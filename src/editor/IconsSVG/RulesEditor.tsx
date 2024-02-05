import React, { useState } from 'react';
import { orderBy } from 'lodash';
import { Button, useTheme, useTheme2} from '@grafana/ui';
import { v4 as uuidv4 } from 'uuid';
import {OverrideTracker, Rule, RuleTracker} from './svg-types';
import { RuleItem } from './RuleItem';
import {
  DEFAULT_LINE_WIDTH,
  DEFAULT_OK_COLOR_SELECTED_RGBA, DEFAULT_OK_COLOR_RGBA, DEFAULT_ICON_WIDTH, DEFAULT_ICON_HEIGHT, DEFAULT_ICON_NAME,
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

  const updateRuleValue = (index: number, value: number) => {
    tracker[index].rule.value = Number(value);
    // reorder
    const allRules = [...tracker];
    const orderedRules = orderBy(allRules, ['rule.value'], ['asc']) as RuleTracker[];
    setTracker([...orderedRules]);
  };

  const updateRuleColor = (index: number, color: string) => {
    let useColor = color;
    if (typeof theme2.visualization !== 'undefined') {
      useColor = theme2.visualization.getColorByName(color);
    }
    tracker[index].rule.color = hexToRgba(useColor);
    setTracker([...tracker]);
  };

  const updateIconWidth = (index: number, width: number) => {
    tracker[index].rule.iconWidth = width;
    setTracker([...tracker]);
  };

  const updateIconHeight = (index: number, height: number) => {
    tracker[index].rule.iconHeight = height;
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
      color: '',
      iconWidth: DEFAULT_ICON_WIDTH,
      iconHeight: DEFAULT_ICON_HEIGHT,
      iconName: DEFAULT_ICON_NAME,
      value: 0,
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
        {tracker &&
            tracker.map((tracker: RuleTracker, index: number) => {

              return (
                  <RuleItem
                      disabled={options.disabled || false}
                      key={`rule-item-index-${tracker.ID}`}
                      ID={tracker.ID}
                      rule={tracker.rule}
                      colorSetter={updateRuleColor}
                      iconWidthSetter={updateIconWidth}
                      iconHeightSetter={updateIconHeight}
                      iconNameSetter={updateIconName}
                      valueSetter={updateRuleValue}
                      overrideSetter={updateRuleOverrides}
                      remover={removeRule}
                      index={index}
                      context={options.context}
                  />
              );
            })}
      </>
  );
};
