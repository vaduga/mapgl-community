import React, {FC, useState, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../utils';
import { parentName } from '../../layers/data/markersLayer';
import Checkbox from '../Checkboxes/Checkbox';
import {css} from "@emotion/css";
import {useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";


const LayerSelect: FC = observer(() => {
  const s = useStyles2(getStyles);
    const {pointStore} = useRootStore()
  const {
    toggleShowCluster,
    getisShowCluster,
  } = pointStore;


  const { isShowLines, toggleShowLines } = useRootStore().lineStore;

  return (
    <>
      <div className={s.checkBoxes}
      >
        {parentName && <Checkbox
              disabled={false}
              value={isShowLines}
              title="lines"
              onChange={() => {
                  toggleShowLines(!isShowLines);
              }}
          >
              &nbsp;Lines
          </Checkbox>}
        <Checkbox
          disabled={false}
          value={getisShowCluster}
          title="cluster"
          onChange={() => {
            toggleShowCluster(!getisShowCluster);
          }}
        >
            &nbsp;Cluster
        </Checkbox>
      </div>
    </>
  );
});

export { LayerSelect };

const getStyles = (theme: GrafanaTheme2) => ({

    checkBoxes: css`
      color: ${theme.colors.text}; 
      display: inline-block;
      padding: 0;
      pointer-events: all;
      width: 100%;
      position: relative;            
      box-sizing: border-box;
      
      //margin: 1em 0em;
      //marginLeft: 1em;    
    `
})
