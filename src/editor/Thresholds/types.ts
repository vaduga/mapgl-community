import {SelectableValue} from '@grafana/data';

export interface Threshold {
  color: string;
  selColor: string;
  lineWidth: number;
  label: string;
  value: number;
}
export interface ThresholdTracker {
  threshold: Threshold;
  order: number;
  ID: string;
}


export const LineWidthStates: SelectableValue[] = [
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
  { value: 2.5, label: '2.5' },
  { value: 3, label: '3' },
  { value: 3.5, label: '3.5' },
  { value: 4, label: '4' },
  { value: 4.5, label: '4.5' },
  { value: 5, label: '5' },
];
