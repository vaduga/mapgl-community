
import React, {FC, useState, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../utils';
import Checkbox from '../Checkboxes/Checkbox';
import {css} from "@emotion/css";
import {HorizontalGroup, InlineField, Select, useStyles2} from "@grafana/ui";
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
        getMode,
        setMode,
        getisShowPoints,
        getisOffset, toggleOffset, setSelectedIp, setTooltipObject, getBlankInfo,
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
          <HorizontalGroup >
              <InlineField label={"nodes"}>
        <Checkbox
          disabled={isDisabled}
          checked={getisShowPoints}
          title="nodes"
          onChange={() => {
              if (getisShowPoints) {
                  toggleShowSVG(false)
              }
              toggleShowPoints(!getisShowPoints);
          }}
        >
            &nbsp;nodes
        </Checkbox>
              </InlineField>
        <Checkbox
            checked={isShowLines}
              title="edges"
              onChange={() => {
                  toggleShowLines(!isShowLines);
              }}
          >
              &nbsp;edges
          </Checkbox>
        <Checkbox
          //disabled={getMode === 'modify'}
          checked={getisShowSVG}
          title="svg"
          onChange={() => {
            toggleShowSVG(!getisShowSVG);
            toggleShowPoints(true)
            if (!getisShowSVG && getMode === 'modify') {
                setMode('view')
                toggleShowSVG(true)
          }}  }
        >
            &nbsp;svg
        </Checkbox>
              <Checkbox
                  checked={!getisOffset}
                  title="stat1/stat2 no offset"
                  onChange={() => {
                      setMode('view')
                      toggleOffset(!getisOffset);
                  }}
              >
                  &nbsp;stat2
              </Checkbox>
              <Checkbox
                  checked={getDirection === 'source'}
                  title="path reverse"
                  onChange={() => {
                      setSelectedIp('');
                      setTooltipObject({...getBlankInfo});

                      setDirection(getDirection === 'target' ? 'source' : 'target')
                       if (isDir) {

                           locationService.partial({'var-locRole': getDirection === 'target' ? 'source' : 'target'}, true);
                       }
                  }}
              >
                  &nbsp;swap tar-src
              </Checkbox>
              </HorizontalGroup >
      </div>
    </>
  );
});

export { LayerSelect }
