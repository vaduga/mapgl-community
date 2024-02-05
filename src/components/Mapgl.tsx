import React, {useCallback, useEffect, useRef, useState} from 'react';
import {GrafanaTheme2} from '@grafana/data';
import {useStyles2, useTheme2} from '@grafana/ui';
import {config, locationService, RefreshEvent} from '@grafana/runtime';
import {observer} from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import MapLibre, {AttributionControl} from 'react-map-gl/maplibre';
import {LinesGeoJsonLayer} from '../deckLayers/LinesLayer/lines-geo-json-layer';
import {MyPathLayer} from '../deckLayers/PathLayer/path-layer';
import {IconClusterLayer} from '../deckLayers/IconClusterLayer/icon-cluster-layer';
import {AggrTypes, colTypes, DeckFeature, Feature, Vertices,
    ViewState, DeckLine} from '../store/interfaces';
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
import {PanelOptions, MapViewConfig} from "../types";
import {Point, Position} from "geojson";
import {WebMercatorViewport} from "@deck.gl/core/typed";
import {DEFAULT_BASEMAP_CONFIG, defaultBaseLayer, geomapLayerRegistry} from "../layers/registry";
import {ExtendMapLayerOptions} from "../extension";
import {centerPointRegistry, MapCenterID} from "../view";
import {LineTextLayer} from "../deckLayers/TextLayer/text-layer";
import { ScatterplotLayer } from '@deck.gl/layers';
import {MyPolygonsLayer} from "../deckLayers/PolygonsLayer/polygons-layer";
import {toJS} from "mobx";
import {MyGeoJsonLayer} from "../deckLayers/GeoJsonLayer/geojson-layer";
import {MyIconLayer} from "../deckLayers/IconLayer/icon-layer";
import {PositionTracker} from "./Geocoder/PositionTracker";
import {pushPath} from "../layers/data/markersLayer";
import {flushSync} from "react-dom";
import {CENTER_PLOT_FILL_COLOR, DEFAULT_COMMENT_COLOR, parDelimiter} from "./defaults";
import {RGBAColor} from "@deck.gl/core/utils/color";
import {getThresholdForValue} from "../editor/Thresholds/data/threshold_processor";
import {getIconRuleForFeature} from "../editor/IconsSVG/data/rules_processor";

export let libreMapInstance, thresholds
const Mapgl = () => {
    const { pointStore, lineStore, viewStore, options, data, width, height, replaceVariables, eventBus  } = useRootStore();
    thresholds = options.globalThresholdsConfig
    const svgIconRules = options.svgIconsConfig
    const theme2 = useTheme2()

    const {
        //<editor-fold desc="store imports">
        getPoints,
        getisOffset,
        getMode,
        setPoints,
        setSelCoord,
        getPolygons,
        setPolygons,
        setPath,
        getPath,
        setGeoJson,
        getComments,
        setAllComments,
        getGeoJson,
        getSelectedIp,
        getSelFeature,
        getSelIds,
        switchMap,
        getisShowSVG,
        getSelectedFeIndexes,
        setSelectedIp,setTooltipObject,
        getTooltipObject,
        getBlankInfo,
        getisShowPoints,
        setSvgIcons,
        getSvgIcons
        //</editor-fold>
    } = pointStore;
    const {
        getViewState,
        setViewState,
    } = viewStore;

    const {getisShowLines, getEditableLines, getLineSwitchMap , getDirection, setDirection, setVertices} = lineStore;

    const deckRef = useRef(null);
    const mapRef: any = useRef(null);
    const [hoverInfo, setHoverInfo] = useState(getTooltipObject);
    const [closedHint, setClosedHint] = useState(false);
    const [zoomGlobal, setZoom] = useState(15)
    const [source, setSource] = useState()
    const [isRenderNums, setIsRenderNums] = useState(true)
    const [isShowCenter, setShowCenter] = useState(getSelectedIp ? true : false)
    const [localViewState, setLocalViewState] = useState<ViewState | undefined>(getViewState);
    const [cPlotCoords, setCPlotCoords] = useState<ViewState | undefined>()
    const [_, setLocation] = useState(locationService.getLocation())
    const [layers, setLayers] = useState([])
    const [refresh, setRefresh] = useState<any>({r:5})

    useEffect(() => {
        const subscriber = eventBus.getStream(RefreshEvent).subscribe(event => {
           // console.log(`Received event: ${event.type}`);
            setRefresh(prev=> ({...prev}))
        })

        return () => {
            subscriber.unsubscribe();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventBus]);

    const expandTooltip = (info, event) => {
        const position = info.coordinate
        if (position) {
            const [longitude, latitude,] = position.map(e => parseFloat(e.toFixed(6)))

            setSelCoord(
                {
                    coordinates: [longitude, latitude],
                    type: "Point"
                })
        }

        if (info.picked) {

            const properties = info.object?.properties || info.object // cluster/icon datasets
            const {id} = info.object
            const {locName: ip, parPath} = properties

            if (ip) {
                const {aggrType, colType} = properties
                setClosedHint(false);
                const layerId = info.sourceLayer?.id
                const lineId = layerId?.startsWith('edit-lines') ? id : null

                const ipDelimited = ip?.split(parDelimiter)[0]
                const geom = switchMap?.get(ipDelimited)?.geometry as Point

                const OSM = libreMapInstance?.getZoom()
                if (geom && getMode !== 'modify')
                {
                    const [longitude, latitude] = geom?.coordinates
                    setShowCenter(true)
                    setCPlotCoords(
                        {
                            longitude,
                            latitude,
                            zoom: OSM ? OSM : 18,
                            maxPitch: 45 * 0.95,
                            bearing: 0,
                            pitch: 0
                        }
                    )
                }

                const isAggr = AggrTypes.includes(aggrType)
                setIsRenderNums(!isAggr)
                setTooltipObject(info); // this pins tooltip
                setSelectedIp(ip, lineId ? [lineId] : null)


            } else if (getisShowSVG) {
                // zoom on cluster click
                const featureGeometry = switchMap && switchMap.get(info.objects?.[0].properties.locName)?.geometry as Point;
                if (featureGeometry && Array.isArray(featureGeometry.coordinates)) {

                    const point = switchMap?.get(info.objects[0].properties.locName)?.geometry as Point
                    const [longitude, latitude] = point.coordinates;


                    const OSM = libreMapInstance?.getZoom()
                        setViewState({
                            longitude,
                            latitude,
                            zoom: OSM ? OSM+1 : 18,
                            transitionDuration: 250,
                            maxPitch: 45 * 0.95,
                            bearing: 0,
                            pitch: 0

                        });
                }


            }
        } else {
            // reset tooltip by clicking blank space
            setShowCenter(true)
            setSelectedIp('');
            setClosedHint(true);
            setTooltipObject({...getBlankInfo});

        }
    };

    const loadPoints = async (data) => {

const isDir = ['target', 'source'].includes(replaceVariables('$locRole'))
        const direction = isDir ? replaceVariables('$locRole') : 'target';
        setDirection(direction)
        const startIds = {};
        for (const key in colTypes) {
            if (Object.prototype.hasOwnProperty.call(colTypes, key)) {
                startIds[colTypes[key]] = 0;
            }
        }

        const transformed: any = [];

        const svgIcons = await loadSvgIcons(svgIconRules)
        if (Object.keys(svgIcons).length) {
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
                        direction
                    },
                };

                const pointsUpRes = layer?.pointsUp ? await layer.pointsUp(data, extOptions) : null
                const features = Array.isArray(pointsUpRes) ? pointsUpRes : []
                const res = {
                    colType: dataLayer.type,
                    features,
                    vertices:  Object.keys(vertices).length ? vertices : null
                };

                startIds[res.colType] = startIds[res.colType] + res.features.length;
                transformed.push(res);
            }
        }

        if (!localViewState) {
            const view = initMapView(options.view)

            let longitude, latitude, zoom;
            if (view.id === MapCenterID.Auto) {
                if (transformed?.length > 0) {
                    const viewport = new WebMercatorViewport({width, height});
                    const allCoordinates = transformed.reduce((acc,curr)=> acc.concat(curr.features), [])
                    const boundsCoords = allCoordinates.map((el: any)=> {

                        const firstCoord = getFirstCoordinate(el.geometry)
                        return (
                            {
                                type: 'Feature', geometry: {
                                    type: 'Point',
                                    coordinates: firstCoord
                                }
                            }
                        )
                    }).filter(el=>el)

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

                setViewState({...deckInitViewState})
                setZoom(zoom)

            initBasemap(options.basemap, setSource, false, theme2)

        }
        let markers: Feature[] = []
        let vertices:  Vertices = {}
        let polygons: Feature[] = []
        let path: Feature[] = []
        let geojson: Feature[] = []

        transformed.forEach((el: any)=> {
            switch (el.colType){
                case colTypes.Points:
                    if (el?.features.length) {
                        vertices = mergeVertices(vertices, el?.vertices)
                        markers = markers.concat(el?.features)

                        markers = markers.map(f=> {
                            const {locName} = f.properties
                            const geom = f.geometry as Point;

                            const metric = f.properties?.metric
                            const threshold = getThresholdForValue(f.properties, metric, thresholds)
                            const rulesThreshold = getIconRuleForFeature(f.properties, svgIconRules)

                            const status = {threshold: {...threshold, ...rulesThreshold}}

                            const sources = vertices[locName]?.sources ? {...vertices[locName]?.sources} : undefined
                            return {...f,
                                geometry: {type: "Point", coordinates: geom.coordinates},
                                properties: {...f.properties, ...(status && Object.entries(status).reduce((acc, [key, value]) => (value !== undefined ? { ...acc, [key]: value } : acc), {})), sources: sources && Object.keys(sources).length >0 ? sources : undefined}}
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
            const { text, iconColor, orderId, coords,tar, src} = comment;
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
                        tIdx: orderId+1,
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
            markers && setPoints(markers)
            polygons && setPolygons(polygons)
            path && setPath(path)
            geojson && setGeoJson(geojson)
    }

    useEffect(() => {

        if (data && data.series.length) {
            loadPoints(data)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh, _, data, width, height, options]);


    const onMapLoad = useCallback(()=> {

        const myRef: {
            current: {getMap: Function} | null
        } = mapRef
        libreMapInstance = myRef.current?.getMap ? myRef.current.getMap() : null;
    } , [])
    const layerProps = {
        pickable: true,
        autoHighlight: true,
        highlightColor: [170, 100, 50, 60],
        onHover: setHoverInfo,
        zoom: zoomGlobal,
        setShowCenter,
        getEditableLines,
        getSelectedFeIndexes,
        getisShowSVG,
        getPoints,
        getSelFeature,
        switchMap,
        getMode,
        getSelectedIp,
        setClosedHint,
        setSelectedIp,
    };

    const lineLayersProps = {
        getDirection,
        getisOffset
    };

    const iconLayersProps = {
    }

    const getLayers = () => {
        let lines, pathLine, pathLineExt, list1, nums, clusterLayer, commentsLayer
        const secLayers: any[] = []
        let newLayers: any = [];
        const iconLayers: any = []
        const lineLayers: any = []
        const clusters: any = []
        const markers: any = getPoints;
        const polygons: any = getPolygons;
        const path: any = getPath;
        const geojson: any = getGeoJson;

        const allFeatures = [markers, polygons,path, geojson].filter(el=> el)

        if (allFeatures?.length < 1) {
            setLayers(newLayers);

            return
        }

        if (polygons.length>0) {
            secLayers.push(MyPolygonsLayer({ ...layerProps,data: polygons }));
        }

        if (path.length>0) {
                secLayers.push(MyPathLayer({ ...layerProps, data: path, type: 'path' }));

        }

        if (geojson.length>0) {

            const featCollection = {
                type: 'FeatureCollection',
                features: geojson
            }
            secLayers.push(MyGeoJsonLayer({ ...layerProps, data: featCollection }));

        }


        if (markers.length>0 || secLayers.length>0) {

            const lineSwitchMap = getLineSwitchMap
            if (getSelFeature?.properties.colType === colTypes.Points) {
                /// Path to tar/src

                const selPathPts = getSelIds.map((id)=> getEditableLines[id]).filter(el=>el)

                const pathLinesCoords = selPathPts.length > 0 && genParentLine(selPathPts, switchMap, lineSwitchMap, getisOffset)[1]

                pathLine = pathLinesCoords && pathLinesCoords.length > 0 ? MyPathLayer({
                    ...layerProps,
                    data: pathLinesCoords,
                    type: 'par-path-line'
                }) : null

                const pathExtCoords = pathLinesCoords && genExtendedPLine(selPathPts, switchMap, lineSwitchMap, getisOffset)

                pathLineExt = pathExtCoords && pathExtCoords?.length > 0 ?
                    MyPathLayer({
                        ...layerProps,
                        data: pathExtCoords,
                        type: 'par-path-extension'
                    }) : null

                const numsData = isRenderNums && getisOffset && genParPathText(selPathPts)
                nums = numsData?.length > 0 ? LineTextLayer({data: numsData, type: 'nums', dir: 'to'}) : null

            }
            const linksText = getEditableLines.map(f=> genLinksText(f, switchMap))
            //const isAggregator =  AggrTypes.includes(getSelFeature?.properties.aggrType ?? '')

            list1 = !getisOffset && linksText?.length > 0 ? LineTextLayer({
                data: linksText.reduce((acc: any,curr: any)=> curr.to ? acc.concat(curr.to) : acc,[]),
                dir: 'to',
                type: 'list1'
            }) : null

                const lFeatures = getEditableLines
                const iconFeatures= markers


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

            let clusterLayerData;

                clusterLayerData = markers
                    .map((el): DeckFeature | undefined => {
                        if (el) {
                            const pointGeometry = el.geometry as Point;
                            return {
                                id: el.id,
                                coordinates: pointGeometry.coordinates,
                                properties: el.properties,
                            };
                        }
                        return undefined;
                    })
                    .filter((val): val is DeckFeature => val !== undefined);

            if (clusterLayerData.length) {
                clusters.push(clusterLayerData)
            }

            if (clusters.length) {
                clusterLayer = new IconClusterLayer({
                        ...layerProps,
                        layerProps,
                        getSvgIcons,
                        isVisible: getisShowPoints,
                        getPosition: (d) => d.coordinates,
                        data: clusters.reduce((acc,curr)=> acc.concat(curr), []),
                        id: 'icon-cluster',
                        sizeScale: 30,
                        //onClick: (info, event) => {
                        //setHoverInfo(getBlankInfo);
                        //},
                        thresholds: []
                    }
                );
            }
            newLayers = [...secLayers, ...lineLayers, list1]
            if (pathLine) {
                newLayers.unshift(pathLine)
                newLayers.push(pathLineExt)
                newLayers.push(nums)
            }

            if (getisShowPoints &&  getComments && getComments?.length > 0 ) {  /// comments for all collections
                commentsLayer = MyIconLayer({
                    ...layerProps,
                    data: getComments,
                    getSelectedFeIndexes,
                    setClosedHint,
                    setSelectedIp,
                    zoom: zoomGlobal,
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
                    getFillColor: (d: any) => toRGB4Array(CENTER_PLOT_FILL_COLOR) as RGBAColor,
                    getLineColor: (d: any) => [0, 0, 0]
                });
                newLayers.push(centerPlot)
            }

            newLayers.push(clusterLayer) // in that order for better clusters visibilty

        }

        setLayers(newLayers) //.filter(el => el !== null && el !== undefined))
    };

    useEffect(() => {
        const history = locationService.getHistory()
        const unlistenHistory = history.listen((location: any) => {
            setLocation(location)
        })
        return unlistenHistory

    }  ,[])

    useEffect(()=> {
        if (!getViewState) {return}
            setLocalViewState(getViewState)
            setCPlotCoords(getViewState)
    }, [getViewState])

    useEffect(() => {
        if (!getPoints.length && !getPolygons.length && !getPath.length && !getGeoJson.length && data?.series?.length) {
            setRefresh(prev=> ({...prev}))
            return}
        //setShowCenter(false)
        getLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        getSelIds,
        getViewState,
        cPlotCoords,
        getMode,
        getPolygons,
        getPoints,
        getPath,
        getGeoJson,
        getSelectedIp,
        getisOffset,
        getisShowSVG,
        getisShowLines,
        getisShowPoints,
    ]);

    return (
            <>
                    {source && localViewState && <> <DeckGL
                        ref={deckRef}
                        style={{
                            pointerEvents: 'all',
                            inset: 0,
                            // zIndex: 1
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
                        onClick={(info, event) => expandTooltip(info, event)}
                    >
                        <MapLibre
                            onLoad={onMapLoad}
                            ref={mapRef}
                            mapStyle={source}
                            attributionControl={false}>
                                <AttributionControl style={{ position: 'absolute', bottom: 0, left: 0 }}
                                    />
                        </MapLibre>

                    </DeckGL>
                        <PositionTracker/>
                        <Tooltip position={0} info={hoverInfo} isClosed={closedHint} setClosedHint={setClosedHint}
            />

    {switchMap && <Menu setShowCenter={setShowCenter}
    />}

                   </>
                    }

          </>
    );
}

export default observer(Mapgl);

