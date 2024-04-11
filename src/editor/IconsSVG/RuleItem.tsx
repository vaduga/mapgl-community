import React, {useEffect, useState} from 'react';
import {FieldType, GrafanaTheme2, SelectableValue, StandardEditorsRegistryItem} from '@grafana/data';
import {
  AutoSizeInput,
  ColorPicker, Field,
  IconButton,
  InlineField,
  InlineFieldRow,
  Input,
  Select,
  useStyles2,
    Text
} from '@grafana/ui';
import {v4 as uuidv4} from 'uuid';
import {css} from '@emotion/css';
import {OverrideField} from "./OverrideField";
import {IconSvgSizes, IconVOffsetValues, OverField, OverrideTracker, Rule} from './svg-types';
import {CiscoIcons, DatabaseIcons, NetworkingIcons} from "./data/iconOptions";
import {DEFAULT_COLOR_PICKER_RGBA} from "../../components/defaults";
import {ResourceDimensionEditor} from "../from_gr_core/features/dimensions/editors";
import {defaultStyleConfig} from "../style/types";
import {MediaType, ResourceFolderName} from "../from_gr_core/features/dimensions";
import {ResourceDimensionMode} from "@grafana/schema";


interface RuleItemProps {
  rule: Rule;
  key: string;
  ID: string;
  colorSetter: any;
  iconLabelSetter(index: number, value: string): void;
  iconSizeSetter: any;
  iconNameSetter: any;
  iconVOffsetSetter: any;
  overrideSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
  context: any


}

export const RuleItem: React.FC<RuleItemProps> = (options: RuleItemProps, context) => {
  const styles = useStyles2(getRuleStyles);
  const [oTracker, _setoTracker] = useState((): OverrideTracker[] => {
    if (!options.rule.overrides) {
      const empty: OverrideTracker[] = [];
      return empty;
    }
    const items: OverrideTracker[] = [];
    Object.values(options.rule.overrides).forEach((field: OverField, index: number) => {
      items[index] = {
        overrideField: field,
        order: index,
        ID: uuidv4(),
      };
    });

    // console.log(options.rule.overrides)
    // console.log(items)
    return items;
  });

  const ciscoIconsFormatted = CiscoIcons.map((t) => {
    return { label: t, value: 'cisco/' + t };
  });
  const networkingIconsFormatted = NetworkingIcons.map((t) => {
    return { label: t, value: 'networking/' + t };
  });
  const databaseIconsFormatted = DatabaseIcons.map((t) => {
    return { label: t, value: 'databases/' + t };
  });



  const setTracker = (v: OverrideTracker[]) => {
    _setoTracker(v);
    const allOverrides: OverField[] = [];
    v.forEach((element) => {
      allOverrides.push(element.overrideField);
    });
    options.overrideSetter(options.index, allOverrides);
  };

  const updateOverrideFieldNameType = (index: number, name: string, type: FieldType) => {
    oTracker[index].overrideField.name = name;
    oTracker[index].overrideField.type = type;
    setTracker([...oTracker]);
  };

  const updateOverrideFieldValue = (index: string, value: string) => {
    oTracker[index].overrideField.value = value;
    setTracker([...oTracker]);
  };


  const addField = () => {
    const order = oTracker.length;
    const aOverrideField: OverField = {
      name: '',
      value: '',
      type: FieldType.string
    };
    const aTracker: OverrideTracker = {
      overrideField: aOverrideField,
      order: order,
      ID: uuidv4(),
    };
    setTracker([...oTracker, aTracker]);
  };

  const removeRuleField = (index: number) => {
    const allRules = [...oTracker];
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

  const [ruleLabel, setRuleLabel] = useState<any>(options.rule.iconRuleLabel);
  const [iconSize, setIconSize] = useState<any>(options.rule.iconSize);
  const [iconVOffset, setIconVOffset] = useState<any>(options.rule.iconVOffset);
  const [iconName, setIconName] = useState<string>(options.rule.iconName)
  // const [showColor, setShowColor] = useState<string>(options.rule.svgColor)
  const handleIconChange = (icon: string | undefined) => {
    if (typeof icon !== 'string') {return}
      options.iconNameSetter(options.index, icon)
    setIconName(icon)
  }
  const maxFiles = 2000;

  return (
      <InlineFieldRow className={styles.inlineRow}>
        {/*Disabled for now. No way to fill custom svg background properly  */}
        {/*<div className={styles.colorPicker}>*/}

        {/*  {showColor ? <ColorPicker*/}
        {/*      color={options.rule.svgColor ?? DEFAULT_COLOR_PICKER_RGBA}*/}
        {/*      onChange={(color) => {*/}
        {/*        console.log('color', color)*/}
        {/*        options.colorSetter(options.index, color)*/}
        {/*      }}*/}
        {/*      enableNamedColors={true}*/}
        {/*  /> :*/}
        {/*    <IconButton*/}
        {/*    disabled={options.disabled}*/}
        {/*  key="addColorPickerRuleField"*/}
        {/*  variant="primary"*/}
        {/*  name="lock"*/}
        {/*  tooltip="Set constant color"*/}
        {/*  onClick={()=> {*/}
        {/*    options.colorSetter(options.index, DEFAULT_COLOR_PICKER_RGBA)*/}
        {/*    setShowColor(DEFAULT_COLOR_PICKER_RGBA)*/}
        {/*  }}*/}
        {/*/>*/}
        {/*  }*/}
        {/*</div>*/}

        <InlineField shrink label="label">
          <AutoSizeInput
              key={options.index}
              defaultValue={ruleLabel}
              placeholder={'rule label'}
              onCommitChange={(e) => {
                const {value} = e.currentTarget
                setRuleLabel(value);
                options.iconLabelSetter(options.index, value)
              }}
              //options={typeof iconVOffset === 'number' ? IconVOffsetValues.concat([{value: iconVOffset,label: iconVOffset.toString()}]) : IconVOffsetValues}
              //allowCustomValue={true}
          />
        </InlineField>
          <InlineField label="size">
              <Select
                  disabled={options.disabled}
                  menuShouldPortal={true}
                  value={iconSize}
                  onChange={(v) => {
                      const intValue = typeof v.value === 'string' ? parseFloat(v.value) : v.value
                      if (!intValue) {return}
                      setIconSize(v);
                      options.iconSizeSetter(options.index, intValue)
                  }}
                  options={typeof iconSize === 'number' ? IconSvgSizes.concat([{value: iconSize,label: iconSize.toString()}]) : IconSvgSizes}
                  allowCustomValue={true}
              />
          </InlineField>
      <InlineField shrink label="offset" className={styles.voffset}>
        <Input
            disabled={options.disabled}
            type="number"
            step="1.0"
            key={options.index}
            //menuShouldPortal={true}
            defaultValue={iconVOffset}
            onChange={(e) => {
              const {value} = e.currentTarget
              const intValue = typeof value === 'string' ? parseFloat(value) : value
              if (typeof intValue !== 'number') {return}
              setIconVOffset(intValue);
             options.iconVOffsetSetter(options.index, intValue)
            }}
            //options={typeof iconVOffset === 'number' ? IconVOffsetValues.concat([{value: iconVOffset,label: iconVOffset.toString()}]) : IconVOffsetValues}
            //allowCustomValue={true}
        />
      </InlineField>


        {oTracker &&
                  oTracker.map((tracker: OverrideTracker, index: number) => {
                    return (
                        <OverrideField
                            disabled={options.disabled || false}
                            key={`rule-field-index-${tracker.ID}`}
                            ID={tracker.ID}
                            overrideField={tracker.overrideField}
                            nameTypeSetter={updateOverrideFieldNameType}
                            valueSetter={updateOverrideFieldValue}
                            remover={removeRuleField}
                            index={index}
                            context={options.context}
                        />
                    );
                  })}
<InlineField shrink label={'icon name'}>
            <ResourceDimensionEditor
                value={{fixed: options.rule.iconName, mode: ResourceDimensionMode.Fixed}}
                context={context}
                onChange={(v) => {
                  if (!v) {return}
                  if (v.fixed === 'custom_icon') {
                    setIconName(v.fixed)
                  } else {
                    handleIconChange(v.fixed); }
                }}
                item={
                  {
                    settings: {
                      resourceType: MediaType.Icon,
                      folderName: ResourceFolderName.Networking,
                      placeholderText: 'Select an icon',
                      showSourceRadio: false,
                      maxFiles,
                    },
                  } as StandardEditorsRegistryItem
                }
            />
</InlineField>
      <InlineField className={styles.addButton}>
              <IconButton
                  disabled={options.disabled}
                  key="addRuleField"
                  variant="primary"
                  name="plus"
                  tooltip="add override"
                  onClick={addField}
              />
      </InlineField>


</InlineFieldRow>
  );
};

const getRuleStyles = (theme: GrafanaTheme2) => {
  return {
    ruleContainer: css`
      display: flex;
      align-items: center;
      //flex: 1; // Use flex: 1 to distribute space equally among child elements
      justify-content: space-between;
    `,
    colorPicker: css`
      padding: 0 ${theme.spacing(1)};
    `,
    nodeSelect: css`
      margin: 5px 0px;
    `,
    inlineField: css`
      flex: 1 0 auto;
    `,
    inlineRow: css`
      //display: flex;
      //align-items: center;
     margin-top: 10px;      
    `,
    voffset: css`
      //display: inline-block; /* Ensures the field takes only the space it needs */
      width: 30%;
      flex-shrink: 1;
    `,
    addButton: css `
      align-items: center;
    `
  };
};
