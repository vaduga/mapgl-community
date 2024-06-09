import React, {Dispatch, SetStateAction, useCallback, useMemo} from 'react';
import {findClosestAnnotations, useRootStore} from '../../utils';
import {toJS} from "mobx";
import {css} from "@emotion/css";
import {IconButton as IconGrafanaButton, useStyles2, useTheme2} from "@grafana/ui";
import {dateTime, GrafanaTheme2} from "@grafana/data";
import {Info} from '../../store/interfaces'
import {locationService} from "@grafana/runtime";
import {ALERTING_STATES, blankHoverInfo} from "../defaults";

function displayItem(item, isAnnot) {
    if (typeof item === "object" && item !== null) {
        return (
            <ul>
                {Object.entries(item).map(([key, value], index) => (
                    <>
                        {isAnnot && key === 'labels' ? (
                            value && Object.entries(value).map(([k, v], i) => (
                                <span key={`${key}-${i}`}>{`${k}: ${v}`}{i !== Object.keys(value).length - 1 ? ", " : ""}</span>
                            ))
                        ) : (
                            Array.isArray(value) ? (
                                value.map((v, i) => (
                                    <span key={i}>{`${i}: ${v}`}{i !== value.length - 1 ? ", " : ""}</span>
                                ))
                            ) : (
                                <span>{`${key}: ${value}`}</span>
                            )
                        )}
                        {index !== Object.keys(item).length - 1 ? ", " : ""}
                    </>
                ))}
                <br /> {/* Add a line break after each annotation */}
            </ul>
        );
    } else {
        return item;
    }
}

function setVars({parent=undefined, props, getSelectedIp, getDirection}){

    const [target, source] = getDirection === 'target' ? [getSelectedIp, parent] : [parent, getSelectedIp];
    //const lineId = parent && props?.sources[parent]?.lineId
    //'var-lineIds': lineId ? ''+lineId : undefined,
    locationService.partial({'var-target': target ?? '', 'var-source': source ?? ''}, true);

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

    function renderTooltipContent({object, time, timeZone, pinned = false, getSelectedIp='', setSelectedIp, getDirection, setTooltipObject, setClosedHint}) {
    const props = object?.properties ?? object ?? {};

    let DP = props?.displayProps

        const filteredProps = Array.isArray(DP) ? DP.reduce((obj, field) => {
            if (props.hasOwnProperty(field)) {
                if (Array.isArray(props[field])) {
                    obj[field] = props[field].map(el => {
                        // if (el['timeEnd']) {
                        //     const unixEpochTime = el['timeEnd'];
                        //     const formattedTime = dateTime(unixEpochTime).format('YYYY-MM-DD HH:mm:ss')
                        //     return { ...el, timeF: formattedTime };
                        // }
                        return el;
                    });
                } else {
                    obj[field] = props[field];
                }
            }
            return obj;
        }, {}) : props;
        let annotations
        if (filteredProps.hasOwnProperty('all_annots')) {
            const closestAnnots: any = findClosestAnnotations(filteredProps.all_annots, time)
            const fAnnots: any = []
            if (closestAnnots?.length) {
                closestAnnots?.forEach(annot => {
                if (!annot) {return}
                const {labels, newState, timeEnd} = annot
                const {grafana_folder, ...extractedFields} = labels

                const timeEndValue = annot['timeEnd']
                const timeF: any = {}
                if (timeEndValue) {
                    timeF.timeF = dateTime(timeEndValue).format('YYYY-MM-DD HH:mm:ss')
                }

                const formattedAnnot = {labels: extractedFields, newState, timeEnd, ...timeF}

                    fAnnots.push(formattedAnnot)
                })
                annotations = fAnnots

            }
            //  filteredProps.all_annots = JSON.stringify(filteredProps.all_annots.map(all=> all.map(el => dateTime(el.timeEnd).format('HH:mm:ss'))))
            delete filteredProps.all_annots
        }

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
                             setTooltipObject({})
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
                    <li key={key}>{`${key}: ${displayItem(value, false)}`}</li>
                ))}
                 {annotations?.length && <>
                 <li key={'ans'}>
                     {annotations.map((a, i) => (
                         <li key={i}>
                             {displayItem(a, true)}
                         </li>
                     ))}
                 </li>
                 </>}

            </ul>
        </>
    );
}


const Tooltip = ({ info, time, timeZone, isClosed = false , setTooltipObject, setClosedHint, position = 0}: {
    info: Info;
    isClosed?: boolean;
    setClosedHint?: Dispatch<SetStateAction<boolean>>;
    setTooltipObject?: Dispatch<SetStateAction<boolean>>;
    selectedFeIndexes?: number[];
    position: number,
    timeZone: string,
    time: number
}) => {

    const getStyles = (theme: GrafanaTheme2) => ({
        tooltip: css`
      position: absolute;
      left: ${position - 80}px;
      top: 150px;
      pointer-events: none;      
      text-align: left;
      user-select: text;
      cursor: text;      
      font-size: 1em;
      border-radius: 5px;
      border: ${theme.isDark ? 'none' : 'solid #c7c3c3'};
      background: ${theme.isDark ? theme.colors.background.primary : '#EAEAEA'}; 
      color: ${theme.colors.getContrastText(theme.colors.background.canvas)}; 
      min-width: 25px;
      max-width: 400px;
      //overflow-y: hidden;
      margin: 5px;
      padding: 8px;
      z-index: 3;
      opacity: 0.95;
      ul {
      list-style-type: none }
    `,
        turnOnEvents: css`
 position: absolute;
      left: ${position - 80}px;
      top: 150px;
      text-align: left;
      user-select: text;
      cursor: text;      
      font-size: 1em;
      border-radius: 5px;
      border: ${theme.isDark ? 'none' : 'solid #c7c3c3'};
      background: ${theme.isDark ? theme.colors.background.primary : '#EAEAEA'}; 
      color: ${theme.colors.getContrastText(theme.colors.background.canvas)}; 
      min-width: 25px;
      max-width: 400px;
      //overflow-y: hidden;
      margin: 5px;
      padding: 8px;
      z-index: 10;
      opacity: 0.95;
      ul {
      list-style-type: none }
        pointer-events: all`
    });

    const s = useStyles2(getStyles);
  const { pointStore , lineStore} = useRootStore();
  const { getMode, getTooltipObject, getSelectedIp, setSelectedIp, getSelIds } = pointStore;
  const {getDirection} = lineStore
if (!Object.entries(info).length) {
    return null
}

    const { x=-3000, y=-3000, object } = info;

    if (!object ) {
        if (isClosed || getMode === 'modify' ) {return null}
        const { x=-3000, y=-3000, object: ghostObject } = getTooltipObject; //return null;

        return (
            /// Pinned hint
            /// onClick={() => setHoverInfo({})}
            <div className={s.turnOnEvents} style={{ left: x, top: y }}>
                {renderTooltipContent({object: ghostObject, time, timeZone, pinned: true, getSelectedIp, setSelectedIp, getDirection, setTooltipObject, setClosedHint })}
            </div>
        );
    }

    if (!object?.isShowTooltip && !object?.properties?.isShowTooltip && !object?.properties?.cluster) {return null}
    if (object?.properties?.cluster) {
        if (isClosed) {return null}
        const { colorCounts, annotStateCounts } = object.properties;

        if (colorCounts) {
            const colorElements = Object.entries(colorCounts).map(([rgba, item], i) => (
                <React.Fragment key={rgba}>
                    {i > 0 && <br/>}
                    <span style={{color: rgba, fontWeight: 'bold'}}>
        {`${item.label ? item.label : rgba}: ${item.count}`}
      </span>
                </React.Fragment>
            ));

            const colorOrder = [
                ALERTING_STATES.Alerting,
                ALERTING_STATES.Pending,
                ALERTING_STATES.Normal,
            ];
            const orderedClCounts: any = []
            colorOrder.forEach(rgba=> {
                if (annotStateCounts?.[rgba] && Object.keys(annotStateCounts?.[rgba]).length) {
                    const item = annotStateCounts[rgba]
                    orderedClCounts.push([rgba, item])}
            })

            const annotColorElements = orderedClCounts.map(([rgba, item], i) => (
                <React.Fragment key={rgba}>
                    {i > 0 && <br/>}
                    <span style={{color: rgba, fontWeight: 'bold'}}>
        {`${item.label ? item.label : rgba}: ${item.count}`}
      </span>
                </React.Fragment>
            ));

            return colorElements.length ?
                <div className={s.tooltip} style={{left: x, top: y}}>
                    {<div>
                        {/*<span>Metrics: </span><br/>*/}
                        {colorElements}</div>}
                    {annotColorElements?.length !== 0 && <div>
                            <br/>
                    <span>States: </span><br/>
                        {annotColorElements}
                    </div>
                    }
                </div>
                : null;
        }
    }



  if (getMode === 'modify') {

      // console.log('hover obj', object)
  if (object.properties?.guideType) {
      // skip hoverInfo on edit handle
      return null
  }
  }
    // const idx = parseInt(info.layer?.id.split('-').at(-1), 10)
      return (
    <div className={s.tooltip} style={{left: x, top: y}}>
        {renderTooltipContent({object, time, timeZone, pinned: false, setTooltipObject, setClosedHint, getDirection, getSelectedIp, setSelectedIp})}
    </div>
  );
};
export { Tooltip };


