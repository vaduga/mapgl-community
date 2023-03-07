import React from 'react';
import { useRootStore } from '../../utils';
import {css} from "@emotion/css";
import {useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";
import {displayProperties, locName, parentName, timeField} from "../../layers/data/markersLayer";
import {Info} from '../../store/interfaces'
const getStyles = (theme: GrafanaTheme2) => ({
    tooltip: css`
      pointer-events: all;      
      text-align: left;
      user-select: text;
      cursor: text;
      position: absolute;
      font-size: 1em;
      border-radius: 5px;
      background: ${theme.colors.background.secondary}; 
      color: ${theme.colors.getContrastText(theme.colors.background.secondary)}; 
      min-width: 160px;
      max-width: 400px;
      overflow-y: hidden;
      margin: 5px;
      padding: 8px;
      ul {
      list-style-type: none }
    `
});

function displayItem(item: any) {
    if (typeof item === "object" && item !== null) {
        return (
            <ul>
                {Object.entries(item).map(([key, value]) => (
                    <li key={key}>
                        {`${key}: `}
                        {displayItem(value)}
                    </li>
                ))}
            </ul>
        );
    } else {
        return item;
    }
}

function renderTooltipContent(object, pinned = false) {
    const props = object?.properties ?? object ?? {}; // #todo no obj in editmode
    const filteredProps = displayProperties?.length ? displayProperties.reduce((obj, field: string) => {
            if (props.hasOwnProperty(field) && ![locName, parentName, timeField].includes(field) ) {
                obj[field] = props[field];
            }
            return obj;
        }, {}) : props

    const displayTime= (unixTimestamp) => {
        const date = new Date(unixTimestamp);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' } as Intl.DateTimeFormatOptions;
        return date.toLocaleString('en-US', options);
    }

    return (
        <>
             <ul>
                 {locName && <li key="locName"><b>{`name: ${displayItem(props.locName)}`}{pinned && '    [Pinned]'}</b></li>}
                 {parentName && displayProperties?.includes(parentName) && <li key="pName"><b>{`parent: ${displayItem(props.parentName)}`}</b></li>}
                {Object.entries(filteredProps).map(([key, value]) => (
                    <li key={key}>{`${key}: ${displayItem(value)}`}</li>
                ))}
                 {timeField && displayProperties?.includes(timeField) && <li key="pName"><b>{`time: ${displayTime(props[timeField])}`}</b></li>}

            </ul>
        </>
    );
}

const Tooltip = ({ info, isClosed = false , selectedFeIndexes=[]}: {
    info: Info;
    isClosed?: boolean;
    selectedFeIndexes?: number[];
}) => {
    const s = useStyles2(getStyles);
  const { pointStore } = useRootStore();
  const { getTooltipObject } = pointStore;
if (!Object.entries(info).length) {
    return null
}
    const { x, y, object } = info;
    if (object?.cluster) {
        const { colorCounts } = object;

        if (colorCounts) {
            const colorElements = Object.entries(colorCounts).map(([rgba, item], i) => (
                <React.Fragment key={rgba}>
                    {i > 0 && <br/>}
                    <span style={{color: rgba, fontWeight: 'bold'}}>
        {`${item.label ? item.label : rgba}: ${item.count}`}
      </span>
                </React.Fragment>
            ));

            return colorElements.length ?
                <div className={s.tooltip} style={{left: x, top: y}}>
                    {colorElements}
                </div>
                : null;
        }
    }

  if (!object) {
    if (isClosed) {return null;}
    const { x, y, object } = getTooltipObject; //return null;

    return (
      /// Pinned hint
      /// onClick={() => setHoverInfo({})}
        <div className={s.tooltip} style={{ left: x, top: y }}>
            {renderTooltipContent(object, true)}
        </div>
    );
  }


      return (
    <div className={s.tooltip} style={{ left: x, top: y}}>
        {renderTooltipContent(object)}
    </div>
  );
};
export { Tooltip };
