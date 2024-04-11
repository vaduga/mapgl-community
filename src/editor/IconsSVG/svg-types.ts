import {FieldType, SelectableValue} from '@grafana/data';
import {generateValuesWithIncrement} from "../../utils";

export interface Rule {
  overrides: OverrideTracker | [];
  svgColor?: string;
  iconRuleCollapsed: boolean;
  iconRuleLabel: string;
  iconSize: number;
  iconVOffset: number;
  iconName: string;
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
export const IconVOffsetValues: SelectableValue[] = generateValuesWithIncrement(-20, 20, 5, false);
