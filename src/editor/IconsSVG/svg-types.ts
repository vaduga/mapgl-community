import {FieldType, SelectableValue} from '@grafana/data';
import {generateValuesWithIncrement} from "../../utils";

export interface Rule {
  overrides: OverrideTracker | [];
  svgColor: string;
  iconSize: number;
  iconName: string;
  value: number;
}
export interface RuleTracker {
  rule: Rule;
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

export const IconSvgSizes: SelectableValue[] = generateValuesWithIncrement(10, 150, 5, false);
