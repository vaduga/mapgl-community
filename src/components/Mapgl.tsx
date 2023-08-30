// @ts-nocheck
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {GrafanaTheme2} from '@grafana/data';
import {useStyles2, useTheme2} from '@grafana/ui';
import { config } from '@grafana/runtime';
import {observer} from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import Map, {AttributionControl} from 'react-map-gl/maplibre';
import {LinesGeoJsonLayer} from '../deckLayers/MarkersLines/lines-geo-json-layer';
import {MyPathLayer} from '../deckLayers/PathLayer/path-layer';
import {IconClusterLayer} from '../deckLayers/IconClusterLayer/icon-cluster-layer';
import {AggrTypes, colTypes, DeckFeature, Feature} from '../store/interfaces';
import Menu from '../components/Menu';
import {
    genExtendedPLine,
    genNodeConnectionsText, genNodeNamesText, genParentLine,
    genParPathText,
    getBounds, getFirstCoordinate,
    useRootStore,
} from '../utils';

import {MarkersGeoJsonLayer} from '../deckLayers/MarkersLines/geo-json-layer';
import {Tooltip} from './Tooltips/Tooltip';
import {MapViewConfig} from "../types";
import {Point, Position} from "geojson";
import {WebMercatorViewport} from "@deck.gl/core/typed";
import {DEFAULT_BASEMAP_CONFIG, defaultBaseLayer, geomapLayerRegistry} from "../layers/registry";
import {ExtendMapLayerOptions} from "../extension";
import {centerPointRegistry, MapCenterID} from "../view";
import {MyPolygonsLayer} from "../deckLayers/PolygonsLayer/polygons-layer";
import {toJS} from "mobx";
import {MyGeoJsonLayer} from "../deckLayers/GeoJsonLayer/geojson-layer";
import {LineTextLayer} from "../deckLayers/TextLayer/text-layer";

export let lastMapPanelInstance, thresholds
const Mapgl = ({ options, data, width, height, replaceVariables }) => {
    thresholds = options.globalThresholdsConfig
    const s = useStyles2(getStyles);
    const theme2 = useTheme2()
    const { pointStore, lineStore, viewStore } = useRootStore();
    const {
        //<editor-fold desc="store imports">
        getPoints,
        getisOffset,
        setPoints,
        setPolygons,
        setPath,
        getPath,
        setGeoJson,
        getGeoJson,
        getNodeConnections,
        getSelectedIp,
        selFeature,
        switchMap,
        getisShowCluster,
        getSelectedFeIndexes,
        setSelectedIp,setTooltipObject,
        getTooltipObject,
        getBlankInfo,
        getisShowPoints,
        getPolygons,
        //</editor-fold>
    } = pointStore;
    const {
        getViewState,
        setViewState,
    } = viewStore;

    const { getisShowLines, getEditableLines, getLineSwitchMap } = lineStore;

    const deckRef = useRef(null);
    const mapRef = useRef(null);
    const [hoverInfo, setHoverInfo] = useState(getTooltipObject);
    const [closedHint, setClosedHint] = useState(false);
    const [zoomGlobal, setZoom] = useState(15)
    const [source, setSource] = useState()

    const expandTooltip = (info, event) => {

        //console.log('expandTooltip', info, event);

        const ip = info.object?.locName || info.object?.properties?.locName;

        if (info.picked) {
            if (ip) {
                setClosedHint(false);
                setSelectedIp(ip);
                setTooltipObject(info); // this pins tooltip

            } else if (getisShowCluster) {
                // zoom on cluster click
                if (info?.object.from) {return}
                const featureGeometry = switchMap && switchMap.get(info?.objects[0].properties.locName)?.geometry as Point;
                if (featureGeometry && Array.isArray(featureGeometry.coordinates)) {

                    const point = switchMap?.get(info.objects[0].properties.locName)?.geometry as Point
                    const [longitude, latitude] = point.coordinates;

                    const zoom = getViewState? getViewState.zoom : zoomGlobal;


                    const OSM = lastMapPanelInstance?.getZoom()
                        setViewState({
                            longitude,
                            latitude,
                            zoom: OSM ? OSM+1 : 1,
                            transitionDuration: 350,
                            maxPitch: 45 * 0.95,
                            bearing: 0,
                            pitch: 0

                        });
                }
            }
        } else {
            /// clicking blank space to reset pinned tooltip
            setSelectedIp('');
            setClosedHint(true);
            setTooltipObject({...getBlankInfo});

        }
    };

    const initBasemap = (cfg: ExtendMapLayerOptions) => {

        if (!cfg?.type || config.geomapDisableCustomBaseLayer) {
            cfg = DEFAULT_BASEMAP_CONFIG;
        }
        const item = geomapLayerRegistry.getIfExists(cfg.type) ?? defaultBaseLayer ?? {};
        const handler = item && item.create ? item?.create(cfg, theme2) : {}
        const layer = handler?.init?.() ?? {};
        setSource(layer)

    }

    const initMapView = (config: MapViewConfig) => {
        let view = {
            id: config.id,
            longitude: 0,
            latitude: 0,
            zoom: 1,
        }

        const v = centerPointRegistry.getIfExists(config.id);
        if (v) {
            let coord: Position | undefined = undefined;
            let zoom: number | undefined

            if (v.lat == null || config.zoom !== 4 ) {
                    coord = [config.lon ?? 0, config.lat ?? 0];
                    zoom = config.zoom;
            } else {
                coord = [v.lon ?? 0, v.lat ?? 0];
                zoom = v.zoom;
            }
            if (coord) {
                view.longitude = coord[0]
                view.latitude = coord[1]
            }
            if (zoom) { view.zoom = zoom; }
        }

        return view;
    }

    const loadPoints = async (data) => {

        const startIds = {};
        for (const key in colTypes) {
            if (Object.prototype.hasOwnProperty.call(colTypes, key)) {
                startIds[colTypes[key]] = 0;
            }
        }
        const transformed: Array< {colType: string, features: any[]}> = [];

        if (options?.dataLayers?.length > 0) {
            for (let i = 0; i < options.dataLayers.length; i++) {
                const dataLayer = options.dataLayers[i];
                const layer = geomapLayerRegistry.getIfExists(dataLayer.type);

                const extOptions = {
                    ...dataLayer,
                    config: {
                        ...dataLayer.config,
                        globalThresholdsConfig: thresholds,
                        startId: startIds[dataLayer.type] ?? 0,
                    },
                };

                const res = {
                    colType: dataLayer.type as string,
                    features: layer?.pointsUp ? await layer.pointsUp(data, extOptions) as Feature[] : [],
                };

                startIds[res.colType] = startIds[res.colType] + res.features.length;
                transformed.push(res);
            }
        }

        const view = initMapView(options.view)

        let longitude, latitude, zoom;
        if (view.id === MapCenterID.Auto) {
            if (transformed?.length > 0) {
                const viewport = new WebMercatorViewport({width, height});
                const allCoordinates = transformed.reduce((acc,curr: any)=> acc.concat(curr.features), []).filter(el=>el)
                const boundsCoords = allCoordinates.map((el: Feature)=> {

                    const firstCoord = el?.geometry && getFirstCoordinate(el.geometry)
                    return (
                        {
                            type: 'Feature', geometry: {
                                type: 'Point',
                                coordinates: firstCoord
                            }
                        }
                    )
                })

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

        } else {
            // console.log('not auto');
            ({longitude, latitude, zoom} = view)
        }

        initBasemap(options.basemap)
        let markers: Feature[] = []
        let polygons: Feature[] = []
        let path: Feature[] = []
        let geojson: Feature[] = []

        transformed.forEach(el=> {
            switch (el.colType){
                case colTypes.Points:
                    if (el?.features.length) {
                        markers = markers.concat(el?.features)
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
        setPoints(markers)
        setPolygons(polygons)
        setPath(path)
        setGeoJson(geojson)

        setZoom(zoom)
        const deckInitViewState = {
            longitude,
            latitude,
            zoom,
            maxPitch: 45 * 0.95 // for non-wgs projection
        };

        // console.log('deckInitViewState', deckInitViewState)
        setViewState(deckInitViewState)
    }

    useEffect(() => {
        if (data && data.series.length) {

            loadPoints(data)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, width, height, options]);


    const onMapLoad = useCallback(()=> {

        const myRef: {
            current: {getMap: Function} | null
        } = mapRef
        lastMapPanelInstance = myRef.current?.getMap ? myRef.current.getMap() : null;
    } , [])
    const layerProps = {
        pickable: true,
        autoHighlight: true,
        highlightColor: [170, 100, 50, 60], //[252, 3, 215, 60],
        onHover: setHoverInfo, //!hoverInfo.objects &&
        zoom: zoomGlobal,
    };

    const lineLayersProps = {
        getSelectedFeIndexes,
        getEditableLines,
        getPoints,
        switchMap,
        getSelectedIp,
        setClosedHint,
        setSelectedIp,
    };

    const iconLayersProps = {
        getPoints,
        switchMap,
        getEditableLines,
        getSelectedFeIndexes,
        getisShowLines,
        getSelectedIp,
        setClosedHint,
        setSelectedIp,
    }

    const [layers, setLayers] = useState([])
    const getLayers = () => {
        let lines, icons, pathLine, pathLineExt, unames, list1, list2, nums, commentsLayer, clusterLayer
        const secLayers: any[] = []
        let newLayers: any = [];
        const iconLayers = []
        const lineLayers = []
        const clusters = []
        const markers = getPoints;
        const polygons = getPolygons;
        const path = getPath;
        const geojson = getGeoJson;

        const allFeatures = [markers, polygons,path, geojson].filter(el=> el)

        if (allFeatures?.length < 1) {
            setLayers(newLayers);

            return
        }

        if (polygons.length>0) {
            secLayers.push(MyPolygonsLayer({ ...layerProps,data: polygons }));
        }

        if (path.length>0) {
            secLayers.push(MyPathLayer({ ...layerProps, selFeature, data: path, type: 'path' }));

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
            if (selFeature?.properties.colType === colTypes.Points) {
                /// ParentLine

                const selLine = lineSwitchMap.get(selFeature.properties.locName)
                const pathLinesCoords = selFeature && genParentLine(selLine, lineSwitchMap)[1]

                pathLine = MyPathLayer({
                    ...layerProps,
                    selFeature,
                    data: pathLinesCoords?.length > 0 ? pathLinesCoords : [],
                    type: 'par-path-line'
                });

                const pathExtCoords = pathLinesCoords && genExtendedPLine(selFeature, lineSwitchMap)

                pathLineExt = pathExtCoords && pathExtCoords.length > 0 ?
                    MyPathLayer({
                        ...layerProps,
                        selFeature,
                        data: pathExtCoords?.length > 0 ? pathExtCoords : [],
                        type: 'par-path-extension'
                    }) : null

                const numsData = genParPathText(lineSwitchMap.get(getSelectedIp))
                nums = numsData && numsData.length > 0 ? LineTextLayer({data: numsData, type: 'nums'}) : null
                const genNodeConsText = genNodeConnectionsText(selFeature, getNodeConnections, lineSwitchMap)
                const isAggregator =  AggrTypes.includes(selFeature?.properties.aggrType)
                // Experimental attached points count
                // list1 = isAggregator && genNodeConsText?.to?.length > 0 ? LineTextLayer({
                //     data: genNodeConsText.to,
                //     dir: 'to',
                //     type: 'list1'
                // }) : null
                // list2 = isAggregator && genNodeConsText?.from?.length > 0 ? LineTextLayer({
                //     data: genNodeConsText.from,
                //     dir: 'from',
                //     type: 'list2'
                // }) : null
            }

            const lFeatures = getEditableLines
            const iconFeatures= markers

            const nodeNames = genNodeNamesText(iconFeatures)
            unames = nodeNames.length > 0 ? LineTextLayer({data: nodeNames, type: 'unames'}) : null

            /// Relation lines
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
                lineLayers.push(unames)
            }

            let clusterLayerData;
            let iconLayerData;

            if (getisShowCluster) {
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
            }
            else {
            iconLayerData = markers
            }

            if (iconLayerData?.length>0) {
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: iconLayerData,
                };

                icons = MarkersGeoJsonLayer({
                    ...layerProps,
                    ...iconLayersProps,
                    featureCollection, isVisible: !getisShowCluster && getisShowPoints,
                })
                iconLayers.push(icons)
            }
            if (clusterLayerData) {
                clusters.push(clusterLayerData)
            }


            if (clusters) {
                clusterLayer = new IconClusterLayer({
                        ...layerProps,
                        getPosition: (d) => d.coordinates,
                        selectedIp: getSelectedIp,
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
            newLayers = [...secLayers, ...iconLayers, ...lineLayers, clusterLayer]
            if (pathLine) {
                newLayers.splice(0, 0, pathLine)
                newLayers.splice(newLayers.length - 1, 0, pathLineExt, nums) // list1, list2 - experimental
            }
        }

        setLayers(newLayers) //.filter(el => el !== null && el !== undefined))
    };



    useEffect(() => {
        getLayers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        getPolygons,
        getPoints,
        getPath,
        getGeoJson,
        getSelectedIp,
        getisOffset,
        getisShowCluster,
        getisShowLines,
        getisShowPoints
    ]);

    return (
            <>
                    {getViewState && <DeckGL
                        ref={deckRef}
                        style={{
                            pointerEvents: 'all',
                            inset: 0,
                            zIndex: 1
                        }}
                        layers={layers}
                        initialViewState={getViewState}
                        controller={{
                            dragMode: 'pan',
                            doubleClickZoom: false,
                            scrollZoom: {smooth: false, speed: 0.005},
                            inertia: true
                        }
                        }
                        onClick={(info, event) => expandTooltip(info, event)}
                    >
                        {source && <Map
                            onLoad={onMapLoad}
                            ref={mapRef}
                            mapStyle={source}
                            attributionControl={false}>
                                <AttributionControl style={{ position: 'absolute', bottom: 0, left: 0 }}
                                    />
                        </Map>}

                    </DeckGL>}
                <Tooltip position={0} info={hoverInfo} isClosed={closedHint} setClosedHint={setClosedHint}
                        />

                {switchMap && <Menu
                />}
          </>
    );
}

export default observer(Mapgl);

const getStyles = (theme: GrafanaTheme2) => ({})

