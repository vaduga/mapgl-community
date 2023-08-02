import { observer } from 'mobx-react-lite';
import React from 'react';
import { useRootStore } from '../utils';
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
  const { getPoints, getPath, getPolygons, getGeoJson } = useRootStore().pointStore;
    const s = useStyles2(getStyles);
const hasData = [getPoints, getPath, getPolygons, getGeoJson].some(el=> el?.length>0)
  return hasData ? (
      <div className={s.myMenu}>
        <ReactSelectSearch/>
          {getPoints?.length>0 && <LayerSelect/>}
      </div>
  ) : null;
};

export default observer(Menu);
