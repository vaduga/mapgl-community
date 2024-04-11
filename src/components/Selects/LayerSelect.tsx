
import React, {FC, useState, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../utils';
import Checkbox from '../Checkboxes/Checkbox';
import {css} from "@emotion/css";
import {
    HorizontalGroup,
    IconButton,
    InlineField,
    InlineFieldRow,
    Select,
    Stack,
    Switch,
    Tooltip,
    useStyles2
} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";
import {locationService} from "@grafana/runtime";


const getStyles = (theme: GrafanaTheme2) => ({

    checkBoxes: css`
      color: ${theme.colors.text}; 
      display: inline-block;      
      //font-Size: 12;
      //font-Style: italic;
      //padding-left: 5px;
       pointer-events: all;
      //margin: 1em 0em;
      //marginLeft: 1em;    
    `
})

const LayerSelect: FC = observer(() => {
    const s = useStyles2(getStyles);
    const {pointStore, lineStore, replaceVariables} = useRootStore()
    const {
        toggleShowSVG,
        toggleShowPoints,
        getisShowSVG,
        setMode,
        getisShowPoints,
        getisOffset, toggleOffset, setSelectedIp, setTooltipObject,
    } = pointStore;
    const {getDirection, setDirection}
        = lineStore

    const { isShowLines, toggleShowLines } = useRootStore().lineStore;
    const [isDisabled, toggleDisabled] = useState(false);
    const [isLoading, toggleLoading] = useState(false);
    const isDir = ['target', 'source'].includes(replaceVariables('$locRole'))
  return (
    <>
      <div className={s.checkBoxes}
      >
          <InlineFieldRow>
              <InlineField>
        <Checkbox
          disabled={isDisabled}
          checked={getisShowPoints}
          title="nodes"
          onChange={() => {
              toggleShowPoints(!getisShowPoints);
          }}
        >
            &nbsp;nodes
        </Checkbox>
              </InlineField>
              <InlineField>
        <Checkbox
            checked={isShowLines}
              title="edges"
              onChange={() => {
                  toggleShowLines(!isShowLines);
              }}
          >
              &nbsp;edges
          </Checkbox>
                  </InlineField>
              <InlineField>
        <Checkbox
          checked={getisShowSVG}
          title="svg"
          onChange={() => {
            toggleShowSVG(!getisShowSVG);
            //toggleShowPoints(true)
            }  }
        >
            &nbsp;svg
        </Checkbox>
                  </InlineField>
              <InlineField>
              <Checkbox
                  checked={!getisOffset}
                  title="stat2 no offset"
                  onChange={() => {
                      setMode('view')
                      toggleOffset(!getisOffset);
                  }}
              >
                  &nbsp;stat2
              </Checkbox>
                  </InlineField>
              </InlineFieldRow>
      </div>
    </>
  );
});

export { LayerSelect }
