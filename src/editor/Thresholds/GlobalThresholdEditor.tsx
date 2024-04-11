import React, {useState} from 'react';
import { StandardEditorProps } from '@grafana/data';
import {Field, InlineFieldRow} from '@grafana/ui';
import { Threshold } from './threshold-types';
import { ThresholdsEditor } from './ThresholdsEditor';
export interface GlobalThresholdEditorSettings {}

interface Props extends StandardEditorProps<string | string[] | null, GlobalThresholdEditorSettings> {}

export const GlobalThresholdEditor: React.FC<Props> = ({ context, onChange }) => {
  const [globalThresholds, setGlobalThresholds] = useState(context.options.globalThresholdsConfig);
  const setThresholds = (val: Threshold[]) => {
    setGlobalThresholds(val);
    onChange(val as any);
  };

  return (

        <ThresholdsEditor context={context} thresholds={globalThresholds} setter={setThresholds} />


  );
};
