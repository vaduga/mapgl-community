import React, { FC, useMemo, useState, useEffect } from 'react';
import { StandardEditorProps, SelectableValue, GrafanaTheme2 } from '@grafana/data';
import {Alert, Select, useStyles2, useTheme2} from '@grafana/ui';
import { COUNTRIES_GAZETTEER_PATH, Gazetteer, getGazetteer } from '../gazetteer/gazetteer';
import { css } from '@emotion/css';

const paths: Array<SelectableValue<string>> = [
  {
    label: 'Countries',
    description: 'Lookup countries by name, two letter code, or three leter code',
    value: COUNTRIES_GAZETTEER_PATH,
  },
  {
    label: 'USA States',
    description: 'Lookup states by name or 2 ',
    value: 'public/gazetteer/usa-states.json',
  },
];

export const GazetteerPathEditor: FC<StandardEditorProps<string, any, any>> = ({ value, onChange, context }) => {
  const s = useStyles2(getStyles);
  const [gaz, setGaz] = useState<Gazetteer>();

  useEffect(() => {
    async function fetchData() {
      const p = await getGazetteer(value);
      setGaz(p);
    }
    fetchData();
  }, [value, setGaz]);

  const { current, options } = useMemo(() => {
    let options = [...paths];
    let current = options.find((f) => f.value === gaz?.path);
    if (!current && gaz) {
      current = {
        label: gaz.path,
        value: gaz.path,
      };
      options.push(current);
    }
    return { options, current };
  }, [gaz]);

  return (
    <>
      <Select
        menuShouldPortal
        value={current}
        options={options}
        onChange={(v) => onChange(v.value)}
        allowCustomValue={true}
        formatCreateLabel={(txt) => `Load from URL: ${txt}`}
      />
      {gaz && (
        <>
          {gaz.error && <Alert title={gaz.error} severity={'warning'} />}
          {gaz.count && (
            <div className={s.keys}>
              <b>({gaz.count})</b>
              {gaz.examples(10).map((k) => (
                <span key={k}>{k},</span>
              ))}{' '}
              &ellipsis;
            </div>
          )}
        </>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    keys: css`
      margin-top: 4px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;

      > span {
        margin-left: 4px;
      }
    `,
  };
};
