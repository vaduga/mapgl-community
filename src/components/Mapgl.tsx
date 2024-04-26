import {FullscreenWidget, CompassWidget} from '@deck.gl/widgets';
import 'img/stylesheet.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BusEventWithPayload, GrafanaTheme2} from '@grafana/data';
import convex from '@turf/convex'
import {LegendDisplayMode, useStyles2, useTheme2, VizLegend, VizLegendItem} from '@grafana/ui';
import {observer} from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import MapLibre, {AttributionControl} from 'react-map-gl/maplibre';
import {LinesGeoJsonLayer} from '../deckLayers/LinesLayer/lines-geo-json-layer';
import {MyPathLayer} from '../deckLayers/PathLayer/path-layer';
import {IconClusterLayer} from '../deckLayers/IconClusterLayer/icon-cluster-layer';
import {colTypes, DeckFeature, Feature, Vertices,
    ViewState} from '../store/interfaces';
import Menu from '../components/Menu';
import {
    getBounds,
    getFirstCoordinate,
    useRootStore,
    genParPathText,
    genParentLine,
    genLinksText,
    genExtendedPLine,
    mergeVertices, initBasemap, initMapView, toRGB4Array, findComments, hexToRgba, loadSvgIcons
} from '../utils';

import {Tooltip} from './Tooltips/Tooltip';
import {Point} from "geojson";
import {WebMercatorViewport} from "@deck.gl/core";
import {geomapLayerRegistry} from "../layers/registry";
import {MapCenterID} from "../view";
import {LineTextLayer} from "../deckLayers/TextLayer/text-layer";
import {ScatterplotLayer} from '@deck.gl/layers';
import {MyPolygonsLayer} from "../deckLayers/PolygonsLayer/polygons-layer";
import {toJS} from "mobx";
import {MyGeoJsonLayer} from "../deckLayers/GeoJsonLayer/geojson-layer";
import {MyIconLayer} from "../deckLayers/IconLayer/icon-layer";
import {PositionTracker} from "./Geocoder/PositionTracker";
import {flushSync} from "react-dom";
import {
    DARK_AUTO_HIGHLIGHT,
    DEFAULT_CLUSTER_SCALE,
    DEFAULT_COMMENT_COLOR,
    LIGHT_AUTO_HIGHLIGHT,
    LIGHT_CENTER_PLOT,
    DARK_CENTER_PLOT, ALERTING_STATES,
} from "./defaults";
import {IconsGeoJsonLayer} from "../deckLayers/IconClusterLayer/icons-geo-json-layer";
import {StateTime} from "./Geocoder/StateTime";
import {expandTooltip} from "./Tooltips/dataClickUtils";
import {css} from "@emotion/css";

export class BasemapChangeEvent extends BusEventWithPayload<number> {
    static type = 'mapType';
}
export class MapViewChangeEvent extends BusEventWithPayload<number> {
    static type = 'mapView';
}

export class PanelEditEnteredEvent extends BusEventWithPayload<number> {
    static type = 'panel-edit-started';
}

export class PanelEditExitedEvent extends BusEventWithPayload<number> {
    static type = 'panel-edit-finished';
}

export class ThresholdChangeEvent extends BusEventWithPayload<number> {
    static type = 'thresholdType';
}


export let libreMapInstance, thresholds
const Mapgl = ({options, data,width, height, eventBus}) => {

    const { pointStore, lineStore, viewStore, replaceVariables } = useRootStore();
    thresholds = options.globalThresholdsConfig
    const svgIconRules = options.svgIconsConfig
    const locLabelName = options.common?.locLabelName
    const isShowLegend = options.common?.isShowLegend
    const s = useStyles2(getStyles);
    const theme2 = useTheme2()

    const {
        //<editor-fold desc="store imports">
        getPoints,
        getisOffset,
        getMode,
        setSelCoord,
        getComments,
        setAllComments,
        getSelectedIp,
        getSelFeature,
        getSelIds,
        switchMap,
        getisShowSVG,
        getSelectedFeIndexes,
        setSelectedIp,setTooltipObject,
        getTooltipObject,
        getisShowPoints,
        setSvgIcons,
        getSvgIcons,
        getAllFeatures,
        setAllFeatures,
        //</editor-fold>
    } = pointStore;
    const {
        getViewState,
        setViewState,
        getClusterMaxZoom,
    } = viewStore;

    const {getisShowLines, getEditableLines, getLineSwitchMap , getDirection, setDirection, setVertices} = lineStore;

    const deckRef = useRef(null);
    const containerRef = useRef(null);

    const mapRef: any = useRef(null);
    const [hoverInfo, setHoverInfo] = useState(getTooltipObject);
    const [closedHint, setClosedHint] = useState(false);
    const [source, setSource] = useState()
    const [isRenderNums, setIsRenderNums] = useState(true)
    const [isShowCenter, setShowCenter] = useState(getSelectedIp ? true : false)
    const [localViewState, setLocalViewState] = useState<ViewState | undefined>(getViewState);
    const [cPlotCoords, setCPlotCoords] = useState<ViewState | undefined>()
    // const [_, setLocation] = useState(locationService.getLocation())
    const [layers, setLayers] = useState<any>([])
    const [refresh, setRefresh] = useState<any>({r:5})

    const [hoverCluster,setHoverCluster] = useState<any>()
    const timeZone = replaceVariables('$__timezone')
    const [time, setTime] = useState<any>(data.timeRange.to.unix()*1000);
    const [total,setTotal] = useState(0)
    const hasAnnots = !!data.annotations?.length


    const initLegendItems = useMemo(() => {
        const arr: VizLegendItem[] = []
        thresholds?.forEach((t, i) => arr.push({
            color: t.color,
            label: t.label,
            yAxis: 1,
            disabled: false
        }))
        return arr
    }, []);

    const [legendItems, setItems] = useState<VizLegendItem[]>(initLegendItems)


    useEffect(() => {
        if (data.timeRange) {
            setTime(data.timeRange.to.unix()*1000)

            const label = 'annotations & alerts query (built-in)'
            if (hasAnnots && legendItems?.at(-1)?.label !== label ) {
                const alertsItem = {
                    color: ALERTING_STATES.Alerting,
                    label: 'annotations & alerts query (built-in)',
                    yAxis: 1,
                    disabled: false
                }
                setItems(prev=> [...prev, alertsItem])
            }

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])


    useEffect(() => {

        // const sub0 = eventBus.getStream(RefreshEvent).subscribe(event => {
        //     setRefresh(prev=> ({...prev}))
        // })

        const sub1 = eventBus.subscribe(MapViewChangeEvent, (evt) => {
                setLocalViewState(undefined)
                loadPoints(data)
        })

        const sub2 = eventBus.subscribe(BasemapChangeEvent, (evt) => {
            if (options.basemap.type !== evt.payload.mapType) {
                setLocalViewState(undefined)
               loadPoints(data)
            }

        })

        const sub3 = eventBus.subscribe(ThresholdChangeEvent, (evt) => {
            if (evt.payload?.thresholds) {
                const arr: VizLegendItem[] = []
                evt.payload.thresholds?.forEach((t, i) => arr.push({
                    color: t.color,
                    label: t.label,
                    yAxis: 1,
                    disabled: false
                }))

                const label = 'annotations & alerts query (built-in)'
                if (hasAnnots && legendItems?.at(-1)?.label !== label ) {
                    const alertsItem = {
                        color: ALERTING_STATES.Alerting,
                        label: 'annotations & alerts query (built-in)',
                        yAxis: 1,
                        disabled: false
                    }
                    arr.push(alertsItem)
                }
                setItems(arr)

            }}  )

        const sub6 = eventBus.subscribe(ThresholdChangeEvent, (evt) => {
            if (evt.payload?.thresholds) {
                const arr: VizLegendItem[] = []
                evt.payload.thresholds?.forEach((t, i) => arr.push({
                    color: t.color,
                    label: t.label,
                    yAxis: 1,
                    disabled: false
                }))

                const label = 'annotations & alerts query (built-in)'
                if (hasAnnots && legendItems?.at(-1)?.label !== label ) {
                    const alertsItem = {
                        color: ALERTING_STATES.Alerting,
                        label: 'annotations & alerts query (built-in)',
                        yAxis: 1,
                        disabled: false
                    }
                    arr.push(alertsItem)
                }
                setItems(arr)

            }}  )

        return () => {
            //sub0.unsubscribe();
            sub1.unsubscribe()
            sub2.unsubscribe()
            sub3.unsubscribe()
            sub6.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventBus]);


    const loadPoints = async(data)=> {

    {


        const isDir = ['target', 'source'].includes(replaceVariables('$locRole'))
        const direction = isDir ? replaceVariables(`$locRole`) : getDirection
        const startIds = {};
        for (const key in colTypes) {
            if (Object.prototype.hasOwnProperty.call(colTypes, key)) {
                startIds[colTypes[key]] = 0;
            }
        }

        const transformed: any = [];
        let svgIcons
        if (svgIconRules?.length) {
            svgIcons = await loadSvgIcons(svgIconRules)
        }

        if (svgIcons && Object.keys(svgIcons).length) {
            setSvgIcons(svgIcons)
        }


        if (options?.dataLayers?.length > 0) {
            const vertices: Vertices = {}
            for (let i = 0; i < options.dataLayers.length; i++) {
                const dataLayer = options.dataLayers[i];
                const layer = geomapLayerRegistry.getIfExists(dataLayer.type);

                const extOptions = {
                    ...dataLayer,
                    config: {
                        ...dataLayer.config,
                        globalThresholdsConfig: thresholds,
                        startId: startIds[dataLayer.type] ?? 0,
                        vertices,
                        direction,
                        locLabelName,
                        svgIconRules,
                        thresholds
                    },
                };

                const pointsUpRes = layer?.pointsUp ? await layer.pointsUp(data, extOptions, theme2) : null
                const features = Array.isArray(pointsUpRes) ? pointsUpRes : []
                const res = {
                    colType: dataLayer.type,
                    features,
                    vertices: Object.keys(vertices).length ? vertices : null
                };

                startIds[res.colType] = startIds[res.colType] + res.features.length;
                transformed.push(res);
            }
        }

        if (!localViewState) {
            const view = initMapView(options.view)
            let longitude, latitude, zoom
            if (view.id === MapCenterID.Auto) {
                if (transformed?.length > 0) {
                    const viewport = new WebMercatorViewport({width, height});
                    const allCoordinates = transformed.reduce((acc, curr) => acc.concat(curr.features), [])
                    const boundsCoords = allCoordinates.map((el: any) => {

                        const firstCoord = getFirstCoordinate(el.geometry)
                        return (
                            {
                                type: 'Feature', geometry: {
                                    type: 'Point',
                                    coordinates: firstCoord
                                }
                            }
                        )
                    }).filter(el => el)

                    if (boundsCoords.length > 1) {
                        ({longitude, latitude, zoom} = view)

                        const [minLng, minLat, maxLng, maxLat] = getBounds(boundsCoords);
                        const bounds: [[number, number], [number, number]] = [[minLng, minLat], [maxLng, maxLat]];

                        if (minLng && minLat && maxLng && maxLat) {
                            ({longitude, latitude, zoom} = viewport.fitBounds(bounds));
                        }
                    }
                    // if no query points in auto mode
                    if (!longitude) {
                        ({longitude, latitude, zoom} = view)

                    }
                }
            } else {
                // console.log('not auto');
                ({longitude, latitude, zoom} = view)
            }

            const deckInitViewState = {
                longitude,
                latitude,
                zoom,
                maxPitch: 45 * 0.95 // for non-wgs projection
            };

            if (longitude !== undefined && latitude !== undefined) {
                setViewState({...deckInitViewState})
            } else {
                setLayers([])
                setLocalViewState(undefined)
            }

            initBasemap(options.basemap, setSource, false, theme2)

        }
        let markers: Feature[] = []
        let vertices: Vertices = {}
        let polygons: Feature[] = []
        let path: Feature[] = []
        let geojson: Feature[] = []

        transformed.forEach((el: any) => {
            switch (el.colType) {
                case colTypes.Points:
                    if (el?.features.length) {
                        vertices = mergeVertices(vertices, el?.vertices)
                        markers = markers.concat(el?.features)
                        markers = markers.map(f => {
                            const {locName} = f.properties
                            const sources = vertices[locName]?.sources ? {...vertices[locName]?.sources} : undefined
                            return {
                                ...f,
                                properties: {
                                    ...f.properties,
                                    sources: sources && Object.keys(sources).length > 0 ? sources : undefined
                                }
                            }
                        })
                    }
                    break;
                case colTypes.Polygons:
                    if (el?.features.length) {
                        polygons = polygons.concat(el?.features)
                    }
                    break;
                case colTypes.Path:
                    if (el?.features.length) {
                        path = path.concat(el?.features)
                    }
                    break;
                case colTypes.GeoJson:
                    if (el?.features.length) {
                        geojson = geojson.concat(el?.features)
                    }
                    break;
            }
        })

        setVertices(vertices)

        const commentsData: any = []
        const comments = findComments(vertices)

        let counter = 0
        comments?.forEach((comment) => {
            const {text, iconColor, orderId, coords, tar, src} = comment;
            if (tar && text && orderId && coords) {

                const hexColor = iconColor && theme2.visualization.getColorByName(iconColor)
                commentsData.push({
                    type: "Feature",
                    id: counter,
                    geometry: {
                        type: 'Point',
                        coordinates: coords
                    },
                    properties: {
                        note: text,
                        tIdx: orderId + 1,
                        tar,
                        iconColor: iconColor?.indexOf('rgb') > -1 ? iconColor : (iconColor && hexToRgba(hexColor)) ?? DEFAULT_COMMENT_COLOR,
                        isShowTooltip: true,
                        displayProps: ['note', 'tar', 'tIdx']
                    }
                })
                counter++
            }

        })
        commentsData && setAllComments(commentsData)

        const collections = [markers, polygons, path, geojson];
        const allFeatures = {}

        collections.forEach((collection, index) => {
            const propertyName = ['markers', 'polygons', 'path', 'geojson'][index];
            if (collection !== undefined && collection !== null) {
                allFeatures[propertyName] = collection;
            }
        });
        collections.forEach(collection => {
            if (collection !== undefined && collection !== null) {
                Object.assign(allFeatures, collection);
            }
        });
        markers && setTotal(markers.length)
        setAllFeatures(allFeatures)
    }

}

    useEffect(() => {
        if (hoverCluster?.object?.properties?.objects?.length > 2 || hoverInfo.prevHullData) {

            const features = hoverCluster?.object?.properties?.objects ?? hoverInfo.prevHullData
            const featureCollection = {
                type: 'FeatureCollection',
                features,
            };
            // @ts-ignore
            const data = convex(featureCollection)
            if (!data) {return }

            const convexLayer = MyPolygonsLayer({
                ...layerProps,
                colType: colTypes.Hull,
                data: [data],
            });

            flushSync(()=> {
                setLayers((prev: any)=> {
                    let newLayers = [...prev]
                    if (prev?.[0]?.id === 'convex-hull') {
                        newLayers[0] = convexLayer
                    } else {
                        newLayers = [convexLayer, ...prev]
                    }
                    return newLayers

                })
            })
        }

// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hoverCluster]);

    const onMapLoad = useCallback(()=> {

        const myRef: {
            current: {getMap: Function} | null
        } = mapRef
        libreMapInstance = myRef.current?.getMap ? myRef.current.getMap() : null;
    } , [])

    const dataClickProps = {
        setSelCoord,
        setClosedHint,
        switchMap,
        getMode,
        setShowCenter,
        setCPlotCoords,
        setIsRenderNums,
        setTooltipObject,
        setSelectedIp,
        setLocalViewState,
        setHoverCluster,
        setHoverInfo
    }

    const layerProps = {
        pickable: true,
        autoHighlight: true,
        highlightColor: toRGB4Array(theme2.isDark ? DARK_AUTO_HIGHLIGHT : LIGHT_AUTO_HIGHLIGHT ) ,
        onHover: setHoverInfo,
        setShowCenter,
        getEditableLines,
        getSelectedFeIndexes,
        getPoints,
        getSelFeature,
        switchMap,
        getMode,
        getSelectedIp,
        setClosedHint,
        setSelectedIp,
        theme2,
        time,
        options,
        setTooltipObject,
        getTooltipObject,
        setHoverInfo,
        closedHint,
        hoverCluster,
        hoverInfo,
        setHoverCluster,
        legendItems
    };

    const lineLayersProps = {
        getDirection,
        getisOffset,
        getComments,
        setTooltipObject,
        setCPlotCoords,
    };

    const iconLayersProps = {
        getSvgIcons,
        getisShowSVG,
        getisShowPoints,
    }

    const getLayers = () => {
        let lines, icons, pathLine, pathLineExt, list1, nums, commentsLayer, clusterLayer
        const secLayers: any = []
        let newLayers: any = [];
        const iconLayers: any = []
        const lineLayers: any = []
        const clusters: any = []

        if (hoverCluster?.object?.properties?.objects?.length > 2 || hoverInfo.prevHullData) {

            const features = hoverCluster?.object?.properties?.objects ?? hoverInfo.prevHullData
            const featureCollection = {
                type: 'FeatureCollection',
                features,
            };
            // @ts-ignore
            const data = convex(featureCollection)
            if (data) {
                const convexLayer = MyPolygonsLayer({
                    ...layerProps,
                    colType: colTypes.Hull,
                    isStatic: true,
                    data: [data],
                });
                secLayers.push(convexLayer)
            }}


       let markers, polygons,path, geojson
        if (getAllFeatures) {
            ({ markers, polygons, path, geojson } = getAllFeatures);
        }

        if (polygons?.length>0) {
            secLayers.push(MyPolygonsLayer({ ...layerProps,data: polygons }));
        }

        if (path?.length>0) {
                secLayers.push(MyPathLayer({ ...layerProps, data: path, type: 'path' }));

        }
        if (geojson?.length>0) {

            const featCollection = {
                type: 'FeatureCollection',
                features: geojson
            }
            secLayers.push(MyGeoJsonLayer({ ...layerProps, data: featCollection }));

        }


        if (markers?.length>0 || secLayers?.length>0) {

            const lineSwitchMap = getLineSwitchMap
            if (getSelFeature?.properties.colType === colTypes.Points) {
                /// Path to tar/src

                const selPathPts = getSelIds.map((id)=> getEditableLines[id]).filter(el=>el)

                const pathLinesCoords = selPathPts.length > 0 && genParentLine({features:selPathPts, switchMap, lineSwitchMap, getisOffset, time})[1]

                pathLine = pathLinesCoords && pathLinesCoords?.length > 0 ? MyPathLayer({
                    ...layerProps,
                    data: pathLinesCoords,
                    type: 'par-path-line',
                }) : null

                const pathExtCoords = pathLinesCoords && genExtendedPLine({features: selPathPts, switchMap, lineSwitchMap, getisOffset, time})

                pathLineExt = pathExtCoords && pathExtCoords?.length > 0 ?
                    MyPathLayer({
                        ...layerProps,
                        data: pathExtCoords,
                        type: 'par-path-extension'
                    }) : null

                const numsData = isRenderNums && getisOffset && genParPathText(selPathPts)
                nums = numsData?.length > 0 ? LineTextLayer({data: numsData, type: 'nums', dir: 'to'}) : null

            }
            const linksText = getEditableLines.map(f=> genLinksText(f, switchMap, options, theme2))
            //const isAggregator =  AggrTypes.includes(getSelFeature?.properties.aggrType ?? '')

            list1 = !getisOffset && linksText?.length > 0 ? LineTextLayer({
                data: linksText.reduce((acc: any,curr: any)=> curr.to ? acc.concat(curr.to) : acc,[]),
                dir: 'to',
                type: 'list1'
            }) : null

                const lFeatures = getEditableLines

            /// Edges render
            if (getisShowLines && lFeatures?.length > 0) {
                const linesCollection = {
                    type: 'FeatureCollection',
                    features: lFeatures
                };


                lines = LinesGeoJsonLayer({
                    ...layerProps,
                    ...lineLayersProps,
                    linesCollection
                })
                lineLayers.push(lines)
            }

            let clusterLayerData = markers
            let iconLayerData = markers;

            if (iconLayerData?.length) {
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: iconLayerData,
                };

                icons = IconsGeoJsonLayer({
                    ...layerProps,
                    ...iconLayersProps,
                    featureCollection,
                })
                iconLayers.push(icons)


            }

            if (clusterLayerData?.length) {
                clusters.push(clusterLayerData)
            }

            if (clusters.length) {
                clusterLayer = new IconClusterLayer({
                        ...layerProps,
                        ...iconLayersProps,
                        getPosition: (d) => d.coordinates,
                        data: clusters.reduce((acc,curr)=> acc.concat(curr), []),
                        id: 'icon-cluster',
                    sizeScale: DEFAULT_CLUSTER_SCALE,
                    maxZoom: getClusterMaxZoom,
                        //onClick: (info, event) => {
                        //setHoverInfo(getBlankInfo);
                        //},
                        thresholds: []
                    }
                );
            }
            newLayers = [...secLayers, ...lineLayers, ...iconLayers]
            if (list1) {
                newLayers.push(list1)
            }
            if (pathLine) {
                newLayers.unshift(pathLine)
                newLayers.push(pathLineExt)
                newLayers.push(nums)
            }

            if (getComments && getComments?.length > 0 ) {  /// comments for all collections
                commentsLayer = MyIconLayer({
                    ...layerProps,
                    ...iconLayersProps,
                    data: getComments,
                    getSelectedFeIndexes,
                    setClosedHint,
                    setSelectedIp,
                })
                newLayers.push(commentsLayer)
            }

            let centerPlot
            if (isShowCenter && cPlotCoords && getSelFeature ) {
                const {longitude, latitude} = cPlotCoords
                centerPlot = new ScatterplotLayer({
                    id: 'centerplot-layer',
                    data: [{coordinates: [longitude, latitude]}],
                    pickable: false,
                    opacity: 0.2,
                    stroked: false,
                    filled: true,
                    radiusScale: 5,
                    radiusMinPixels: 1,
                    radiusMaxPixels: 18,
                    lineWidthMinPixels: 1,
                    getPosition: (d: any) => d.coordinates,
                    getRadius: (d: any )=> Math.sqrt(d.exits),
                    getFillColor: (d: any) => toRGB4Array(theme2.isDark ? DARK_CENTER_PLOT : LIGHT_CENTER_PLOT),
                });
                newLayers.push(centerPlot)
            }

            newLayers.push(clusterLayer) // in that order for better clusters visibilty

        }

        setLayers(newLayers.filter(el => el !== null && el !== undefined))
    };

    // Unused for now: not changing dashboard variables from inside the plugin.

    // useEffect(() => {
    //     const history = locationService.getHistory()
    //     const unlistenHistory = history.listen((location: any) => {
    //         setLocation(location)
    //     })
    //     return unlistenHistory
    //
    // }  ,[])

    useEffect(()=> {
        if (!getViewState) {return}
            setLocalViewState(getViewState)
            setCPlotCoords(getViewState)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getViewState])

    useEffect(() => {
        /// get some proves that data was specified at least somewhere and needs some time to load.
        if (!options.dataLayers?.some(el=> el?.query) && !data.request?.targets
        //?.some(el=> el?.queryType === 'snapshot')
        //&& !data.series?.some(el=>el?.meta?.transformations?.length)
        ) {return}
        if (!data?.series?.length) {return}

        if (!(getAllFeatures && Object.keys(getAllFeatures).length)){
            setRefresh(prev=> ({...prev}))
            return}
        //setShowCenter(false)
        getLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        legendItems,
        getSvgIcons,
        getTooltipObject,
        getClusterMaxZoom,
        getSelIds,
        getViewState,
        cPlotCoords,
        getMode,
        getAllFeatures,
        getSelectedIp,
        getisOffset,
        getisShowSVG,
        getisShowLines,
        getisShowPoints,
    ]);

    useEffect(() => {

        if (data && data.series.length) {
            loadPoints(data)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh, getDirection, data, width, height, options]);  // _


const memoMenu = useMemo(()=> {
    return (
           <Menu
            total={total}
            setShowCenter={setShowCenter}
        />
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [total])

    const onLabelClick = useCallback((clickItem: VizLegendItem, e) => {
        setItems(prev=> prev?.map((item) => {
                if (item !== clickItem) {
                    return item;
                } else {
                    return {
                        ...item,
                        disabled: !item.disabled,
                    };
                }
            })
        )

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    if (!source || !localViewState) {
        return null
    }


    return (
            <div className={s.container} ref={containerRef}>
                <DeckGL
                    widgets={[new FullscreenWidget({id:'myfull', container: containerRef.current ?? undefined, placement: 'top-right',
                        className: s.fullscreen }), new CompassWidget({id:'compass',  placement: 'top-right', className: s.compass})]}
                        ref={deckRef}
                        style={{
                            pointerEvents: 'all',
                            inset: '0px',
                            zIndex: '1'
                        }}
                        layers={layers}
                        initialViewState={localViewState}
                        controller={{
                            dragMode: 'pan',
                            doubleClickZoom: false,
                            scrollZoom: {smooth: false, speed: 0.005},
                            inertia: true
                        }
                        }
                        onClick={(info, event) => expandTooltip(info, event, dataClickProps)}
                    >
                        <MapLibre
                            onLoad={onMapLoad}
                            ref={mapRef}
                            mapStyle={source}
                            attributionControl={false}>
                            <AttributionControl style={{ zIndex: '2', position: 'absolute', top: 0, right: theme2.spacing(1) }} />
                        </MapLibre>
                    </DeckGL><div className={s.timeNcoords}>
                <PositionTracker/>
                {!!hasAnnots && <StateTime time={time}/>}
            </div>

                        <Tooltip time={time} timeZone={timeZone} position={0} info={hoverInfo} isClosed={closedHint} setTooltipObject={setTooltipObject} setClosedHint={setClosedHint}
                        />
                {isShowLegend && <div className={s.legend}>
                    <VizLegend displayMode={LegendDisplayMode.List} placement="bottom" items={legendItems}
                               onLabelClick={onLabelClick}/>
                </div>}

                {memoMenu}

            </div>
    );
}

export default observer(Mapgl);


    const getStyles = (theme: GrafanaTheme2) => ({
        page: css`
          padding: ${theme.spacing(3)};
          background-color: ${theme.colors.background.secondary};
          display: flex;
          justify-content: center;
        `,
        container: css`
            .maplibregl-ctrl-attrib-button {
                display: none;
            }
        `,
        yamap: css`
          width: 100%;
          height: 100%;
          z-index: -1;
          position: absolute;
          isolation: isolate;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        `,
        geocoder: css`
          display: flex;
          flex-direction: row-reverse;
          //width: 10%;
          position:absolute;
          right: ${theme.spacing(1.7)};
          top: ${theme.spacing(2)};
        `,
        textBox: css`
          position: absolute;
          bottom: 0;
          left: 0;
          padding: 10px;
        `,
        fullscreen: css`
          z-index: 2;
          position: absolute;
          top: ${theme.spacing(5)};
          right: 0px;
          
          overflow: hidden;
          pointer-events: all;
        `,
        compass: css`
          z-index: 2;
          position: absolute;
          top: ${theme.spacing(10)};
          right: 0px;   
          overflow: hidden;
          pointer-events: all;
        `,
        legend: css`
          z-index: 2;
            position: absolute;            
            bottom: 0;// ${theme.spacing(3)};
            //left: ${theme.spacing(10)};
            //width: 20%;
            padding-bottom: 5px;
            pointer-events: all;
            background: ${theme.isDark ? theme.colors.background.secondary : '#EAEAEA'};
        `,
        timeNcoords: css`            
            position: absolute;
            z-index: 1;
            font-size: small;
            bottom: 5px;
            right: 1%;                        
        `

    })

