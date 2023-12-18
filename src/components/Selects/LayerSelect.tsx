
import React, {FC, useState, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../utils';
import Checkbox from '../Checkboxes/Checkbox';
import {css} from "@emotion/css";
import {HorizontalGroup, Select, useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";
import {isParFieldArray} from "../../layers/data/markersLayer";
import {locationService} from "@grafana/runtime";


const getStyles = (theme: GrafanaTheme2) => ({

    checkBoxes: css`
      color: ${theme.colors.text}; 
      display: inline-block;      
      //font-Size: 12;
      //font-Style: italic;
      padding-left: 15px;
       pointer-events: all;
      //margin: 1em 0em;
      //marginLeft: 1em;    
    `
})

const LayerSelect: FC = observer(() => {
    const s = useStyles2(getStyles);
    const {pointStore, lineStore, replaceVariables} = useRootStore()
    const {
        toggleShowCluster,
        toggleShowPoints,
        getisShowCluster,
        getMode,
        setMode,
        getisShowPoints,
        getisOffset, toggleOffset, setTooltipObject, getBlankInfo
    } = pointStore;
    const {getDirection, setDirection}
        = lineStore

    const { isShowLines, toggleShowLines } = useRootStore().lineStore;
    const [isDisabled, toggleDisabled] = useState(false);
    const [isLoading, toggleLoading] = useState(false);

  return (
    <>
      <div className={s.checkBoxes}
      >
          <HorizontalGroup >
        <Checkbox
          disabled={isDisabled}
          checked={getisShowPoints}
          title="nodes"
          onChange={() => {
              if (getisShowPoints) {
                  toggleShowCluster(false)
              }
              toggleShowPoints(!getisShowPoints);
          }}
        >
            &nbsp;nodes
        </Checkbox>
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
          checked={getisShowCluster}
          title="cluster"
          onChange={() => {
            toggleShowCluster(!getisShowCluster);
            toggleShowPoints(true)
            if (!getisShowCluster && getMode === 'modify') {
                setMode('view')
                toggleShowCluster(true)
          }}  }
        >
            &nbsp;clusters
        </Checkbox>
              <Checkbox
                  checked={getisOffset}
                  title="stat1/stat2 & offset"
                  onChange={() => {
                      setMode('view')
                      toggleOffset(!getisOffset);
                  }}
              >
                  &nbsp;stat1/stat2
              </Checkbox>
              {replaceVariables(`$locRole`) !== '$locRole' && <Checkbox
                  checked={getDirection === 'source'}
                  title="path reverse"
                  onChange={() => {
                      locationService.partial({'var-locRole': getDirection === 'target' ? 'source' : 'target'}, true);
                      setTooltipObject({...getBlankInfo});
                  }}
              >
                  &nbsp;swap tar-src
              </Checkbox>}
              </HorizontalGroup >
      </div>
    </>
  );
});

export { LayerSelect }
