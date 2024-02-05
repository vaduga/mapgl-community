import {FieldType, SelectableValue} from '@grafana/data';

export interface Threshold {
  overrides: OverrideTracker | [];
  color: string;
  selColor?: string;
  lineWidth: number;
  label: string;
  value: number;
}
export interface ThresholdTracker {
  threshold: Threshold;
  order: number;
  ID: string;
}


export interface OverField {
  name: string;
  value: string;

  type: FieldType
}

export interface OverrideTracker {
  overrideField: OverField;
  order: number;
  ID: string;
}


export const generateValuesWithIncrement = (start: number, end: number, increment: number): SelectableValue[] => {
  const values: SelectableValue[] = [];
  let currentIncrement = 0.1;

  for (let value = start; value <= end; value += currentIncrement) {
    const roundedValue = parseFloat(value.toFixed(1));
    values.push({ value: roundedValue, label: roundedValue.toString() });

    // Switch to the provided increment after reaching 1
    if (roundedValue === 1) {
      currentIncrement = increment;
    }
  }

  return values;
};

export const LineWidthStates: SelectableValue[] = generateValuesWithIncrement(0.1, 100, 1);
