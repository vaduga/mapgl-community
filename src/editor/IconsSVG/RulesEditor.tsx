import React, { useState } from 'react';
import { orderBy } from 'lodash';
import {Button, CollapsableSection, IconButton, useTheme, useTheme2} from '@grafana/ui';
import { v4 as uuidv4 } from 'uuid';
import {OverrideTracker, Rule, RuleTracker} from './svg-types';
import { RuleItem } from './RuleItem';
import {
  DEFAULT_ICON_NAME, DEFAULT_ICON_RULE_IS_COLLAPSED, DEFAULT_ICON_RULE_LABEL,
  DEFAULT_ICON_SIZE, DEFAULT_SVG_ICON_V_OFFSET,
} from '../../components/defaults';
import {hexToRgba} from "../../utils/utils.plugin";
interface Props {
  rules: Rule[];
  setter: any;
  disabled?: boolean;
  context: any
}
export const RulesEditor: React.FC<Props> = (options) => {


  const [tracker, _setTracker] = useState((): RuleTracker[] => {
    if (!options.rules) {
      const empty: RuleTracker[] = [];
      return empty;
    }
    const items: RuleTracker[] = [];
    options.rules.forEach((value: Rule, index: number) => {
      items[index] = {
        rule: value,
        order: index,
        ID: uuidv4(),
      };
    });
    return items;
  });
  // v9 compatible
  const theme2 = useTheme2();

  const setTracker = (v: RuleTracker[]) => {
    _setTracker(v);
    const allRules: Rule[] = [];
    v.forEach((element) => {
      allRules.push(element.rule);
    });
    options.setter(allRules);
  };

  const updateRuleOverrides = (index: number, overrides: OverrideTracker, value: number) => {
    if (!overrides) {
      return
    }

    tracker[index].rule.overrides = overrides ;
    setTracker([...tracker]);
  };


  const updateRuleColor = (index: number, color: string) => {
    let useColor = color;
    if (typeof theme2.visualization !== 'undefined') {
      useColor = theme2.visualization.getColorByName(color);
    }
    tracker[index].rule.svgColor = hexToRgba(useColor);
    setTracker([...tracker]);
  };

  const updateRuleLabel = (index: number, label: string) => {
    tracker[index].rule.iconRuleLabel = label;
    setTracker([...tracker]);
  };

  const updateIconSize = (index: number, size: number) => {
    tracker[index].rule.iconSize = size;
    setTracker([...tracker]);
  };

  const updateIconCollapsed = (index: number) => {
    tracker[index].rule.iconRuleCollapsed = !tracker[index].rule.iconRuleCollapsed
    setTracker([...tracker]);
  };

  const updateIconVOffset = (index: number, size: number) => {
    tracker[index].rule.iconVOffset = size;
    setTracker([...tracker]);
  };



  const updateIconName = (index: number, name: string) => {
    tracker[index].rule.iconName = name;
    setTracker([...tracker]);
  };

  const removeRule = (index: number) => {
    const allRules = [...tracker];
    let removeIndex = 0;
    for (let i = 0; i < allRules.length; i++) {
      if (allRules[i].order === index) {
        removeIndex = i;
        break;
      }
    }
    allRules.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allRules.length; i++) {
      allRules[i].order = i;
    }
    setTracker([...allRules]);
  };

  const addItem = () => {
    const order = tracker.length;
    const aRule: Rule = {
      overrides: [],
      // svgColor: '',
      iconRuleLabel: DEFAULT_ICON_RULE_LABEL,
      iconRuleCollapsed: DEFAULT_ICON_RULE_IS_COLLAPSED,
      iconSize: DEFAULT_ICON_SIZE,
      iconVOffset: DEFAULT_SVG_ICON_V_OFFSET,
      iconName: DEFAULT_ICON_NAME,
    };
    const aTracker: RuleTracker = {
      rule: aRule,
      order: order,
      ID: uuidv4(),
    };
    setTracker([...tracker, aTracker]);
  };

  return (
      <>
        <Button disabled={options.disabled} fill="solid" variant="primary" icon="plus" onClick={addItem}>
          Add icon rule
        </Button>
        {tracker &&  tracker.map((tracker: RuleTracker, index: number) => {

                return (
                    <CollapsableSection key={index} isOpen={tracker.rule.iconRuleCollapsed} label={
                        (<span>
                      {index + 1} {tracker.rule.iconRuleLabel ?? 'rule'}<>&nbsp;</>
                        <IconButton
                      disabled={options.disabled}
                      key="deleteRule"
                      variant="secondary"
                      name="trash-alt"
                      tooltip="delete icon rule"
                      onClick={(e) => {
                        removeRule(index)
                        e.stopPropagation()
                      }}
                      />
                            </span>
                      )


                    } onToggle={()=> updateIconCollapsed(index)}>
                    <RuleItem
                        disabled={options.disabled || false}
                        key={`rule-item-index-${tracker.ID}`}
                        ID={tracker.ID}
                        rule={tracker.rule}
                        colorSetter={updateRuleColor}
                        iconLabelSetter={updateRuleLabel}
                        iconSizeSetter={updateIconSize}
                        iconVOffsetSetter={updateIconVOffset}
                        iconNameSetter={updateIconName}
                        overrideSetter={updateRuleOverrides}
                        remover={removeRule}
                        index={index}
                        context={options.context}
                    />
                    </CollapsableSection>
                );
              })}




      </>
  );
};
