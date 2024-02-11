import React, {Dispatch, SetStateAction, useCallback, useMemo} from 'react';
import {useRootStore} from '../../utils';
import {toJS} from "mobx";
import {css} from "@emotion/css";
import {IconButton as IconGrafanaButton, useStyles2, useTheme2} from "@grafana/ui";
import {Field, formattedValueToString, GrafanaTheme2, Vector} from "@grafana/data";
import {Info} from '../../store/interfaces'
import {locationService} from "@grafana/runtime";

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

function setVars({parent=undefined, props, getSelectedIp, getDirection}){

    const [target, source] = getDirection === 'target' ? [getSelectedIp, parent] : [parent, getSelectedIp];
    const lineId = parent && props?.sources[parent]?.lineId
//'var-lineIds': lineId ? ''+lineId : undefined,
    locationService.partial({'var-target': target ?? '', 'var-source': source ?? '', 'var-mode': 'view'}, true);

}

const SetVarsIcon = ({parent = undefined, props, getSelectedIp, getDirection})=> {
    return (
        <IconGrafanaButton
            key="setVars"
            variant="primary"
            name="graph-bar"
            size='sm'
            tooltip="set vars"
            tooltipPlacement='left'
            onClick={() => {
                setVars({parent, props, getSelectedIp, getDirection})
            }}
        />
    )
}

    function renderTooltipContent({object, pinned = false, getSelectedIp='', setSelectedIp, getDirection, setClosedHint}) {
    const props = object?.properties ?? object ?? {};

    let DP = props?.displayProps

    const filteredProps = Array.isArray(DP) ? DP.reduce((obj, field: string) => {
        if (props.hasOwnProperty(field)) {
            obj[field] = Array.isArray(props[field]) ? JSON.stringify(props[field]): props[field];
        }
        return obj;
    }, {}) : props


    const parArr = props.ptId && Array.isArray(props.parPath) && props.parPath.length ? [props.parPath?.at(-1)] : props.sources && Object.keys(props.sources)
    const parents = parArr?.map((parent, k)=> {
        return <li key={''+k}>
            {pinned && <SetVarsIcon {...{parent, props, getSelectedIp, getDirection}}/>}
            {getDirection === 'target' ? 'src: ' : 'tar: '}
            <a onClick={()=> setSelectedIp(getSelectedIp, [props.sources[parent]?.lineId])}>{parent}</a>
        </li>
    })

    return (
        <>
             <ul>
                 {props.locName && <li key="locName">
                     {pinned && <><IconGrafanaButton
                         key="closeHint"
                         variant="destructive"
                         name="x"
                         size='sm'
                         tooltip={'close'}
                         tooltipPlacement='left'
                         onClick={() => {
                             setClosedHint(true)
                         }}
                     />
                         {!parents?.length &&
                             <SetVarsIcon {...{props, getSelectedIp, getDirection}}/>
                         }
                     </>
                     }

                     {getDirection === 'target' ? 'tar: ' : 'src: '}
         <a onClick={()=> setSelectedIp(getSelectedIp, null)}>{props.locName}</a></li>}

                 {parents}

                {Object.entries(filteredProps).map(([key, value]) => (
                    <li key={key}>{`${key}: ${displayItem(value)}`}</li>
                ))}


            </ul>
        </>
    );
}


const Tooltip = ({ info, isClosed = false , setClosedHint, position = 0}: {
    info: Info;
    isClosed?: boolean;
    setClosedHint?: Dispatch<SetStateAction<boolean>>;
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
      z-index: 1;
      opacity: 0.95;
      ul {
      list-style-type: none }
    `
    });

    const s = useStyles2(getStyles);
  const { pointStore , lineStore} = useRootStore();
  const { getMode, getTooltipObject, getSelectedIp, setSelectedIp, getSelIds } = pointStore;
  const {getDirection} = lineStore
if (!Object.entries(info).length) {
    return null
}

    const { x, y, object } = info;

    if (!object ) {

        if (isClosed || getMode === 'modify' ) {return null}
        const { x, y, object: ghostObject } = getTooltipObject; //return null;
        const idx = parseInt(info.layer?.id.split('-').at(-1), 10)

        return (
            /// Pinned hint
            /// onClick={() => setHoverInfo({})}
            <div className={s.tooltip} style={{ left: x, top: y }}>
                {renderTooltipContent({object: ghostObject, pinned: true, getSelectedIp, setSelectedIp, getDirection, setClosedHint })}
            </div>
        );
    }

    if (!object?.isShowTooltip && !object?.properties?.isShowTooltip && !object?.cluster) {return null}
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
        {renderTooltipContent({object, pinned: false, setClosedHint, getDirection, getSelectedIp, setSelectedIp})}
    </div>
  );
};
export { Tooltip };


