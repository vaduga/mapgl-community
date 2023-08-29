import React from 'react';
import { useRootStore } from '../../utils';
import {toJS} from "mobx";
import {css} from "@emotion/css";
import {IconButton as IconGrafanaButton, useStyles2, useTheme2} from "@grafana/ui";
import {Field, formattedValueToString, GrafanaTheme2, Vector} from "@grafana/data";
import {Info} from '../../store/interfaces'

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


    function renderTooltipContent(object, pinned = false, setClosedHint, getNodeConnections) {
    const props = object?.properties ?? object ?? {};

    let DP = props?.displayProperties

    const filteredProps = DP?.length ? DP.reduce((obj, field: string) => {
        if (props.hasOwnProperty(field)) {
            obj[field] = props[field];
        }
        return obj;
    }, {}) : {}

    return (
        <>
             <ul>
                 {props.locName && <li key="locName">
                     {pinned && <IconGrafanaButton
                         key="closeHint"
                         variant="destructive"
                         name="x"
                         size='sm'
                         tooltip="Close hint"
                         onClick={() => {
                             setClosedHint(true)
                         }}
                     />}
                     <b>{`loc: ${displayItem(props.locName)}  `}</b></li>}
                 {props.parName && <li key="pName"><b>{`par: ${displayItem(props.parName)}`}</b></li>}
                {Object.entries(filteredProps).map(([key, value]) => (
                    <li key={key}>{`${key}: ${displayItem(value)}`}</li>
                ))}
                 {['node','connector'].includes(props.aggrType) && <>
                     {`\n`}
                     {`${props.locName} --> ${props.parName}:`}
                     {getNodeConnections?.get(props.parName)?.from?.map((el, key) => (<li style={{color: el?.threshold?.color}} key={key}>{`${el?.locName}`} </li>))}
                     {`\n`}
                     {`${props.locName} <-- ${props.parName}:`}
                     {getNodeConnections?.get(props.parName)?.to?.map((el, key) => (<li style={{color: el?.threshold?.color}} key={key}>{`${el?.locName}`} </li>))}
                 </>
                 }

            </ul>
        </>
    );
}


const Tooltip = ({ info, isClosed = false , setClosedHint, position = 0}: {
    info: Info;
    isClosed?: boolean;
    setClosedHint?: Function;
    selectedFeIndexes?: number[];
    position: number
}) => {

    const getStyles = (theme: GrafanaTheme2) => ({
        tooltip: css`
      position: absolute;
      left: ${position - 80}px;
      top: 150px;
      pointer-events: all;      
      text-align: left;
      user-select: text;
      cursor: text;      
      font-size: 1em;
      border-radius: 5px;
      background: ${theme.colors.background.secondary}; 
      color: ${theme.colors.getContrastText(theme.colors.background.secondary)}; 
      min-width: 250px;
      max-width: 400px;
      overflow-y: hidden;
      margin: 5px;
      padding: 8px;
      z-index: 99;
      opacity: 0.95;
      ul {
      list-style-type: none }
    `
    });

    const s = useStyles2(getStyles);
  const { pointStore } = useRootStore();
  const { getMode, getTooltipObject, getNodeConnections } = pointStore;
if (!Object.entries(info).length) {
    return null
}

    const { x, y, object } = info;

    if (object?.isShowTooltip === false || object?.properties?.isShowTooltip === false) {return null}


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

  if (!object ) {

    if (isClosed || getMode === 'modify' ) {return null}
    const { x, y, object: ghostObject } = getTooltipObject; //return null;
      const idx = parseInt(info.layer?.id.split('-').at(-1), 10)

    return (
      /// Pinned hint
      /// onClick={() => setHoverInfo({})}
        <div className={s.tooltip} style={{ left: x, top: y }}>
            {renderTooltipContent(ghostObject, true, setClosedHint, getNodeConnections)}
        </div>
    );
  }

  if (getMode === 'modify') {

    // if (selectedFeIndexes.includes(object.properties?.featureIndex))
    //       {return null}

      // console.log('hover obj', object)
  if (object.properties?.guideType) {
      // skip hoverInfo on edit handle
      return null
  }
  }
    const idx = parseInt(info.layer?.id.split('-').at(-1), 10)
      return (
    <div className={s.tooltip} style={x && y ? { left: x, top: y } : {}}>
        {renderTooltipContent(object, false, setClosedHint, getNodeConnections)}
    </div>
  );
};
export { Tooltip };


