
import React, {FC, useState, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../utils';
import Checkbox from '../Checkboxes/Checkbox';
import {css} from "@emotion/css";
import {HorizontalGroup, Select, useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";
import {isParFieldArray} from "../../layers/data/markersLayer";


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

// {isTimeRunning}
const LayerSelect: FC = observer(() => {
    const s = useStyles2(getStyles);
    const {pointStore, viewStore} = useRootStore()
    const {
        toggleShowCluster,
        toggleShowPoints,
        getisShowCluster,
        getisShowPoints,
        getisOffset, toggleOffset
    } = pointStore;


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
                        title="points"
                        onChange={() => {
                            if (getisShowPoints) {
                                toggleShowCluster(false)
                            }
                            toggleShowPoints(!getisShowPoints);
                        }}
                    >
                        Pts
                    </Checkbox>
                    <Checkbox
                        value={isShowLines}
                        title="lines"
                        onChange={() => {
                            toggleShowLines(!isShowLines);
                        }}
                    >
                        &nbsp;Lines
                    </Checkbox>
                    <Checkbox
                        //disabled={getMode === 'modify'}
                        value={getisShowCluster}
                        title="cluster"
                        onChange={() => {
                            toggleShowCluster(!getisShowCluster);
                            }  }
                    >
                        &nbsp;Cluster
                    </Checkbox>
                    {isParFieldArray && <Checkbox
                        value={getisOffset}
                        title="endpoint lines offset"
                        onChange={() => {
                            toggleOffset(!getisOffset);
                        }}
                    >
                        &nbsp;Aggr
                    </Checkbox>}
                </HorizontalGroup >
            </div>
        </>
    );
});

export { LayerSelect }
