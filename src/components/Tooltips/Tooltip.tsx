import React from 'react';
import { useRootStore } from '../../utils';
import {css} from "@emotion/css";
import {useStyles2} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";


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
    // Assuming `info` is defined somewhere in your code
    const {locName, parentName} = props
    let DP = props?.displayProperties
    const filteredProps = DP?.length ? DP.reduce((obj, field: string) => {
            if (props.hasOwnProperty(field) && ![locName, parentName].includes(field) ) {
                obj[field] = props[field];
            }
            return obj;
        }, {}) : props

    return (
        <>
             <ul>
                 {locName && <li key="locName"><b>{`name: ${displayItem(props.locName)}`}{pinned && '    [Pinned]'}</b></li>}
                 {parentName && DP?.includes(parentName) && <li key="pName"><b>{`parent: ${displayItem(props.parentName)}`}</b></li>}
                {Object.entries(filteredProps).map(([key, value]) => (
                    <li key={key}>{`${key}: ${displayItem(value)}`}</li>
                ))}
            </ul>
        </>
    );
}

const Tooltip = ({ info, isClosed = false}: {
    info: Info;
    isClosed?: boolean;
}) => {

  const s = useStyles2(getStyles);
  const { pointStore } = useRootStore();
  const { getTooltipObject } = pointStore;
if (!Object.entries(info).length) {
    return null
}

    const { x, y, object } = info;

    if (!object?.cluster && (!object?.isShowTooltip && !object?.properties?.isShowTooltip)) {
        return null
    }

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
