import { observer } from 'mobx-react-lite';
import React from 'react';
import {getFirstCoordinate, useRootStore} from '../utils';
import {LayerSelect} from './Selects/LayerSelect';
import ReactSelectSearch from './Selects/ReactSelectSearch';
import {css} from "@emotion/css";
import {InlineField, InlineFieldRow, Select, Switch, Tooltip, useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";
import {flushSync} from "react-dom";
import {libreMapInstance} from "./Mapgl";
import {toJS} from "mobx";
import {locationService} from "@grafana/runtime";

const getStyles = (theme: GrafanaTheme2) => ({
    inlineRow: css`
      display: flex;
      align-items: center;
      pointer-events: all;
    `,

   myMenu: css`
    color: grey;    
    font-size: 0.9em;
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: 9;
    top: ${theme.spacing(1)};
    left: ${theme.spacing(1)};
    width: auto;    
    // min-width: 15%;
    background: none;
    pointer-events: none;

     > div,button, ul, input, p  {    
     }
`,
    field: css`
      margin-top: ${theme.spacing(0.1)};
      margin-right: ${theme.spacing(1.5)};
    `
})

const Menu = ({setShowCenter, total}) => {

    const {pointStore, lineStore, viewStore, replaceVariables} = useRootStore()
    const { getViewState, setViewState, getClusterMaxZoom, setClusterMaxZoom } = viewStore;
    const {
        switchMap,
       setSelectedIp, setTooltipObject,getSelectedIp
    } = pointStore;
    const {getDirection, setDirection}
        = lineStore
    const isDir = ['target', 'source'].includes(replaceVariables('$locRole'))


    const s = useStyles2(getStyles);
    const options: any = []
    for (let i = 18; i >= 2; i--) {
        options.push({ label: i.toString(), value: i });
    }

    const selectGotoHandler = async (value, coord, select = true, fly = true, lineId?: number | null ) => {

        if (value && select) {
            setSelectedIp(value, null)
        }
        else if ((!value || fly) && lineId !== null && lineId !== undefined) {
            setSelectedIp(null, [lineId])
        }

        const point = switchMap?.get(value)
        if (fly && (point || coord))
        {
            const firstCoord = getFirstCoordinate(point?.geometry);
            const coordsFromValue = firstCoord

            if (coord || coordsFromValue) {
                flushSync(() => {
                    setShowCenter(select)
                    setViewState({...getViewState,
                        longitude: coord ? coord[0] : coordsFromValue[0],
                        latitude: coord ? coord[1] : coordsFromValue[1],
                        transitionDuration: 250,
                        maxPitch: 45 * 0.95,
                        zoom: libreMapInstance?.transform?.zoom ?? 18,
                    });
                })
            }
        }
    };

  return (
       <div className={s.myMenu}>
          <InlineFieldRow className={s.inlineRow}>
              <InlineField className={s.field}>
          <ReactSelectSearch aggrTypesOnly={false} total={total} value={getSelectedIp} isMainLocSearch={true} selectHandler={selectGotoHandler} />
                  </InlineField>
          <InlineField className={s.field}>
              <Tooltip content={'cluster max zoom'} >
                  <div>
              <Select
                  onChange={(v) => {
                      if (!v.value) {return}
                      setClusterMaxZoom(v.value)
                  }}
                  value={getClusterMaxZoom}
                  options={options}
              ></Select>
                  </div>
              </Tooltip>
          </InlineField>
              <InlineField className={s.field}>
                  <Tooltip content={'swap tar-src'}>
                      <div>
                          <Switch value={getDirection === 'source'}
                                  title="path reverse"
                                  onChange={() => {
                                      setSelectedIp('');
                                      setTooltipObject({});
                                      setDirection(getDirection === 'target' ? 'source' : 'target')
                                      if (isDir) {

                                          locationService.partial({'var-locRole': getDirection === 'target' ? 'source' : 'target'}, true);
                                      }
                                  }}
                          ></Switch>
                      </div>
                  </Tooltip>

              </InlineField>

          </InlineFieldRow>
          <LayerSelect/>
       </div>
  )
};

export default observer(Menu);
