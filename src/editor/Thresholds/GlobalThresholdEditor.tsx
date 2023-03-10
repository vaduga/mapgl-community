import React, {useState} from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Field } from '@grafana/ui';
import { Threshold } from './types';
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
    <>
      <Field>
        <ThresholdsEditor context={context} thresholds={globalThresholds} setter={setThresholds} />
      </Field>
    </>
  );
};
