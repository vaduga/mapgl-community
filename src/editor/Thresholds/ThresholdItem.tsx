import React, {useState} from 'react';
import {FieldType, GrafanaTheme2, SelectableValue} from '@grafana/data';
import {AutoSizeInput, ColorPicker, IconButton, Input, Select, Tooltip, useStyles2} from '@grafana/ui';
import {v4 as uuidv4} from 'uuid';
import {css} from '@emotion/css';
import {OverrideField} from "./OverrideField";
import {LineWidthStates, OverField, OverrideTracker, Threshold} from './threshold-types';


interface ThresholdItemProps {
  threshold: Threshold;
  key: string;
  ID: string;
  valueSetter: any;
  colorSetter: any;
  lineWidthSetter: any;
  labelSetter: any;
  overrideSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
  context: any
}

export const ThresholdItem: React.FC<ThresholdItemProps> = (options: ThresholdItemProps) => {
  const styles = useStyles2(getThresholdStyles);
  const [oTracker, _setoTracker] = useState((): OverrideTracker[] => {
    if (!options.threshold.overrides) {
      const empty: OverrideTracker[] = [];
      return empty;
    }
    const items: OverrideTracker[] = [];
    Object.values(options.threshold.overrides).forEach((field: OverField, index: number) => {
      items[index] = {
        overrideField: field,
        order: index,
        ID: uuidv4(),
      };
    });

    // console.log(options.threshold.overrides)
    // console.log(items)
    return items;
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

  const removeThresholdField = (index: number) => {
    const allThresholds = [...oTracker];
    let removeIndex = 0;
    for (let i = 0; i < allThresholds.length; i++) {
      if (allThresholds[i].order === index) {
        removeIndex = i;
        break;
      }
    }
    allThresholds.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allThresholds.length; i++) {
      allThresholds[i].order = i;
    }
    setTracker([...allThresholds]);
  };

  const getThreshold = (thresholdId: number) => {
    const keys = LineWidthStates.keys();
    // allow custom values
    return thresholdId
  };


  const [lineWidth, setLineWidth] = useState<any>(getThreshold(options.threshold.lineWidth));

  return (

      <Input
          title={'metric threshold value'}
          disabled={options.disabled}
          type="number"
          step="1.0"
          key={options.ID}
          onChange={(e) => options.valueSetter(options.index, Number(e.currentTarget.value))}
          value={options.threshold.value}
          prefix={
            <div className={styles.inputPrefix}>
              <Tooltip content={'stat1 color'} >
              <div className={styles.colorPicker}>
                <ColorPicker
                    color={options.threshold.color}
                    onChange={(color) => {
                      //options.selColorSetter(options.index, color)
                      options.colorSetter(options.index, color)
                    }}
                    enableNamedColors={true}
                />
              </div>
              </Tooltip>
              {/*<div className={styles.colorPicker} title="Selected">*/}
              {/*  <ColorPicker*/}
              {/*      color={options.threshold.selColor}*/}
              {/*      onChange={(color) => options.selColorSetter(options.index, color)}*/}
              {/*      enableNamedColors={true}*/}
              {/*  />*/}
              {/*</div>*/}
              <div>
                <Select
                    title={'line width'}
                    disabled={options.disabled}
                    menuShouldPortal={true}
                    value={lineWidth}
                    onChange={(v) => {
                      const intValue = typeof v.value === 'string' ? parseFloat(v.value) : v.value
                      if (!intValue) {return}
                      setLineWidth(v);
                      options.lineWidthSetter(options.index, intValue)
                    }}
                    options={typeof lineWidth === 'number' ? LineWidthStates.concat([{value: lineWidth,label: lineWidth.toString()}]) : LineWidthStates}
                    allowCustomValue={true}
                    width="auto"
                />
              </div>
            </div>
          }
          suffix={
            <>
              <AutoSizeInput
                  title={'color label'}
                  disabled={false}
                  onCommitChange={(v) => {
                    options.labelSetter(options.index, v.currentTarget.value);
                  }}
                  defaultValue={options.threshold.label}
                  placeholder = {'label'}
              />
              {oTracker &&
                  oTracker.map((tracker: OverrideTracker, index: number) => {
                    return (
                        <OverrideField
                            disabled={options.disabled || false}
                            key={`threshold-field-index-${tracker.ID}`}
                            ID={tracker.ID}
                            overrideField={tracker.overrideField}
                            nameTypeSetter={updateOverrideFieldNameType}
                            valueSetter={updateOverrideFieldValue}
                            remover={removeThresholdField}
                            index={index}
                            context={options.context}
                        />
                    );
                  })}


              <IconButton
                  disabled={options.disabled}
                  key="addThresholdField"
                  variant="primary"
                  name="plus"
                  tooltip="add override"
                  onClick={addField}
              />
              <IconButton
                  disabled={options.disabled}
                  key="deleteThreshold"
                  variant="destructive"
                  name="trash-alt"
                  tooltip="delete threshold"
                  onClick={() => options.remover(options.index)}
              />
            </>
          }
      />

  );
};

const getThresholdStyles = (theme: GrafanaTheme2) => {
  return {
    inputPrefix: css`
      display: flex;
      align-items: center;
    `,
    colorPicker: css`
      padding: 0 ${theme.spacing(1)} 0 0;
    `,
  };
};
