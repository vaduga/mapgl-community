import React, {useState} from 'react';
import {FieldType, GrafanaTheme2, SelectableValue} from '@grafana/data';
import {
  AutoSizeInput,
  ColorPicker,
  IconButton,
  InlineField,
  InlineFieldRow,
  Input,
  Select,
  useStyles2
} from '@grafana/ui';
import {v4 as uuidv4} from 'uuid';
import {css} from '@emotion/css';
import {OverrideField} from "./OverrideField";
import {IconSvgSizes, IconVOffsetValues, OverField, OverrideTracker, Rule} from './svg-types';
import {CiscoIcons, DatabaseIcons, NetworkingIcons} from "./data/iconOptions";
import {DEFAULT_COLOR_PICKER_RGBA} from "../../components/defaults";


interface RuleItemProps {
  rule: Rule;
  key: string;
  ID: string;
  colorSetter: any;
  iconSizeSetter: any;
  iconNameSetter: any;
  iconVOffsetSetter: any;
  overrideSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
  context: any
}

export const RuleItem: React.FC<RuleItemProps> = (options: RuleItemProps) => {
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

  const [iconSize, setIconSize] = useState<any>(options.rule.iconSize);
  const [iconVOffset, setIconVOffset] = useState<any>(options.rule.iconVOffset);
  const [iconName, setIconName] = useState<string>(options.rule.iconName)
  // const [showColor, setShowColor] = useState<string>(options.rule.svgColor)
  const handleIconChange = (icon: string | undefined) => {
    if (typeof icon !== 'string') {return}
      options.iconNameSetter(options.index, icon)
    setIconName(icon)
  }

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

          <InlineField grow label="size">
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
      <InlineField grow label="v.offset">
        <Select
            disabled={options.disabled}
            menuShouldPortal={true}
            value={iconVOffset}
            onChange={(v) => {
              const intValue = typeof v.value === 'string' ? parseFloat(v.value) : v.value
              if (typeof intValue !== 'number') {return}
              setIconVOffset(v);
              options.iconVOffsetSetter(options.index, intValue)
            }}
            options={typeof iconVOffset === 'number' ? IconVOffsetValues.concat([{value: iconVOffset,label: iconVOffset.toString()}]) : IconVOffsetValues}
            allowCustomValue={true}
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
        <InlineField grow>
  <Select
                  onChange={(v) => {
                    if (!v.value) {return}
                    if (v.value === 'custom_icon') {
                      setIconName(v.value)
                    } else {
                    handleIconChange(v.value); }
                  }}
                  value={options.rule.iconName}
                  options={[
                    { label: 'Cisco Icons', value: 'cisco', options: ciscoIconsFormatted },
                    { label: 'Networking Icons', value: 'networking', options: networkingIconsFormatted },
                    { label: 'Database Icons', value: 'databases', options: databaseIconsFormatted },
                    { label: 'Custom Icon', value: 'custom_icon' },
                  ]}
                  className={styles.nodeSelect}
                  placeholder={'Select an icon'}

              ></Select>
        </InlineField>
              {iconName && iconName === 'custom_icon' ? (
                  <>
                    <InlineField
                        grow
                        label="Custom Icon Source"
                        className={styles.inlineField}
                        style={{ marginLeft: '24px' }}
                    >
                      <AutoSizeInput
                          defaultValue={options.rule.iconName}
                          placeholder={'https://example.com/icon.svg'}
                          type={'text'}
                          name={'iconImageURL'}
                          onCommitChange={(e) => {
                            const v = e.currentTarget?.value
                            if (!v) {return}
                            handleIconChange(v );
                          }}
                      ></AutoSizeInput>
                    </InlineField>
                  </>
              ) : (
                  ''
              )}


              <IconButton
                  disabled={options.disabled}
                  key="addRuleField"
                  variant="primary"
                  name="plus"
                  tooltip="Add override"
                  onClick={addField}
              />
              <IconButton
                  disabled={options.disabled}
                  key="deleteRule"
                  variant="destructive"
                  name="trash-alt"
                  tooltip="Delete Rule"
                  onClick={() => options.remover(options.index)}
              />


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
      display: flex;
      align-items: center;      
    `,
  };
};
