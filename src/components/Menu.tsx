import { observer } from 'mobx-react-lite';
import React from 'react';
import {getFirstCoordinate, useRootStore} from '../utils';
import {LayerSelect} from './Selects/LayerSelect';
import ReactSelectSearch from './Selects/ReactSelectSearch';
import {css} from "@emotion/css";
import {useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";

const getStyles = (theme: GrafanaTheme2) => ({

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
       margin-top: 3px;
     }
`,
})

const Menu = () => {
  const { getPoints, getPath, getPolygons, getGeoJson, switchMap, getSelectedIp, setSelectedIp } = useRootStore().pointStore;
    const { setViewState } = useRootStore().viewStore;
    const s = useStyles2(getStyles);

    const selectGotoHandler = async (value, coord, selectIp = true) => {
        if (value && selectIp) {
            setSelectedIp(value);
        }

        if (switchMap?.get(value) || coord)
        {

            const point = switchMap?.get(value) //as Point

            const firstCoord = getFirstCoordinate(point?.geometry);
            const coordsFromValue = firstCoord

            setViewState({
                longitude: coord ? coord[0] : coordsFromValue[0],
                latitude: coord ? coord[1] : coordsFromValue[1],
                transitionDuration: 350,
                zoom: 18,
            });
        }
    };



const hasData = [getPoints, getPath, getPolygons, getGeoJson].some(el=> el?.length>0)
  return hasData ? (
      <div className={s.myMenu}>
          <ReactSelectSearch aggrTypes={[]} value={getSelectedIp} selectHandler={selectGotoHandler} />
          {getPoints?.length>0 && <LayerSelect/>}
      </div>
  ) : null;
};

export default observer(Menu);
