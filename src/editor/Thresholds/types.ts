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
  for (let value = start; value <= end; value += increment) {
    const roundedValue = parseFloat(value.toFixed(1));
    values.push({ value: roundedValue, label: roundedValue.toString() });
  }
  return values;
};

export const LineWidthStates: SelectableValue[] = generateValuesWithIncrement(0.1, 25, 0.1);
