import {FieldType, SelectableValue} from '@grafana/data';
import {generateValuesWithIncrement} from "../../utils";

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


export const LineWidthStates: SelectableValue[] = generateValuesWithIncrement(0.1, 50, 1, true);
