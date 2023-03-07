import React, {useState} from 'react';
import {GrafanaTheme2, SelectableValue} from '@grafana/data';
import {AutoSizeInput, ColorPicker, IconButton, Input, Select, useStyles2} from '@grafana/ui';
import {css} from '@emotion/css';
import {LineWidthStates, Threshold} from './types';

interface ThresholdItemProps {
  threshold: Threshold;
  key: string;
  ID: string;
  valueSetter: any;
  colorSetter: any;
  selColorSetter: any;
  lineWidthSetter: any;
  labelSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
  context: any
}

export const ThresholdItem: React.FC<ThresholdItemProps> = (options: ThresholdItemProps) => {
  const styles = useStyles2(getThresholdStyles);


  const getThreshold = (thresholdId: number) => {
    const keys = LineWidthStates.keys();
    for (const aKey of keys) {
      if (LineWidthStates[aKey].value === thresholdId) {
        return LineWidthStates[aKey];
      }
    }
    // no match, return current by default
    return LineWidthStates[1];
  };

  const [lineWidth, setLineWidth] = useState<SelectableValue>(getThreshold(options.threshold.lineWidth));

  return (

    <Input
      disabled={options.disabled}
      type="number"
      step="1.0"
      key={options.ID}
      onChange={(e) => options.valueSetter(options.index, Number(e.currentTarget.value))}
      value={options.threshold.value}
      prefix={
        <div className={styles.inputPrefix}>
          <div className={styles.colorPicker} title="Primary">
            <ColorPicker
              color={options.threshold.color}
              onChange={(color) => {
                options.selColorSetter(options.index, color)
                options.colorSetter(options.index, color)
              }}
              enableNamedColors={true}
            />
          </div>
          <div className={styles.colorPicker} title="Selected">
            <ColorPicker
                color={options.threshold.selColor}
                onChange={(color) => options.selColorSetter(options.index, color)}
                enableNamedColors={true}
            />
          </div>
          <div title="Line width">
          <Select
              disabled={options.disabled}
              menuShouldPortal={true}
              value={lineWidth}
              onChange={(v) => {
                setLineWidth(v);
                options.lineWidthSetter(options.index, v.value)
              }}
              options={LineWidthStates}
              //allowCustomValue={true}
              width="auto"
          />
            </div>
        </div>
      }
      suffix={
        <>
          <AutoSizeInput
              disabled={false}
              onInput={(v) => {
                options.labelSetter(options.index, v.currentTarget.value);
              }}
              placeholder = {options.threshold.label ? options.threshold.label : 'label'}
          />
          <IconButton
            disabled={options.disabled}
            key="deleteThreshold"
            variant="destructive"
            name="trash-alt"
            tooltip="Delete Threshold"
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
      padding: 0 ${theme.spacing(1)};
    `,
  };
};
