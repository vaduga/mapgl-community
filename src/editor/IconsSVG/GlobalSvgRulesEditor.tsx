import React, {useState} from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Field } from '@grafana/ui';
import { Rule } from './svg-types';
import { RulesEditor } from './RulesEditor';
export interface GlobalThresholdEditorSettings {}

interface Props extends StandardEditorProps<string | string[] | null, GlobalThresholdEditorSettings> {}

export const GlobalSvgRulesEditor: React.FC<Props> = ({ context, onChange }) => {
  const [globalIconRules, setGlobalIconRules] = useState(context.options.svgIconsConfig);
  const setRules = (val: Rule[]) => {
    setGlobalIconRules(val);
    onChange(val as any);
  };

  return (
    <>
      <Field>
        <RulesEditor context={context} rules={globalIconRules} setter={setRules} />
      </Field>
    </>
  );
};
