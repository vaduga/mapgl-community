import React, {useCallback, useEffect, useRef, useState} from 'react';
import {GrafanaTheme2} from '@grafana/data';
import {useStyles2, useTheme2} from '@grafana/ui';
import { config } from '@grafana/runtime';
import {observer} from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import {MyLineLayer} from '../deckLayers/LineLayer/line-layer';
import {IconClusterLayer} from '../deckLayers/IconClusterLayer/icon-cluster-layer';
import {DeckFeature, Feature} from '../store/interfaces';
import Menu from '../components/Menu';
import {
    getBounds,
    useRootStore,
} from '../utils';

import {MyIconLayer} from '../deckLayers/IconLayer/icon-layer';
import {Tooltip} from './Tooltips/Tooltip';
import {MapViewConfig} from "../types";
import {Point, Position} from "geojson";
import {WebMercatorViewport} from "@deck.gl/core/typed";
import {DEFAULT_BASEMAP_CONFIG, defaultBaseLayer, geomapLayerRegistry} from "../layers/registry";
import {ExtendMapLayerOptions} from "../extension";
import {centerPointRegistry, MapCenterID} from "../view";
import {MyPolygonsLayer} from "../deckLayers/PolygonsLayer/polygons-layer";
import {toJS} from "mobx";

export let lastMapPanelInstance
const Mapgl = ({ options, data, width, height, replaceVariables }) => {
    const s = useStyles2(getStyles);
    const theme2 = useTheme2()
    const { pointStore, lineStore, viewStore } = useRootStore();
    const {
        //<editor-fold desc="store imports">
        getPoints,
        setPoints, setType, getType,
        setPolygons,
        getSelectedIp,
        switchMap,
        getisShowCluster,
        getSelectedFeIndexes,
        setSelectedIp,setTooltipObject,
        getpLinePoints,
        getTooltipObject,
        getisShowPoints,
        getPolygons
        //</editor-fold>
    } = pointStore;
    const {
        getViewState,
        setViewState,
    } = viewStore;

    const { getisShowLines, getLines } = lineStore;

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
            setHoverInfo({
                x: -3000,
                y: -3000,
                cluster: false,
                object: {
                    cluster: false
                },
                objects: []
            });
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

    const loadPoints = async (data)=> {


                const transformed =  await Promise.all(options?.dataLayers.map(async (dataLayer)=>{

                const layer = geomapLayerRegistry.getIfExists(dataLayer.type)

                    console.log('th', options?.globalThresholdsConfig , options )
                const extOptions = {...dataLayer, config: {...dataLayer.config, globalThresholdsConfig: options?.globalThresholdsConfig}}
                 return {type: dataLayer.type, features: layer?.pointsUp ? await layer.pointsUp(data, extOptions) : []
        }
        }))

        const view = initMapView(options.view)

            let longitude, latitude, zoom;
            if (view.id === MapCenterID.Auto) {
                if (transformed?.length) {
                    const viewport = new WebMercatorViewport({width, height});
                    const boundsCoords = transformed[0].features.map(el=> (
                        {
                        type: 'Feature', geometry: {type: 'Point', coordinates: transformed[0].type === 'polygons' ? el?.contour[0][0] : el.geometry.coordinates
                    }}))
                    const [minLng, minLat, maxLng, maxLat] = getBounds(boundsCoords);
                    const bounds: [[number, number], [number, number]] = [[minLng, minLat], [maxLng, maxLat]];


                    ({longitude, latitude, zoom} = viewport.fitBounds(bounds));
                }
                // when there's no query points in auto mode
                if (!longitude) {
                    ({ longitude, latitude, zoom } = view)
                }

            } else {
                /// not 'auto';
                ({ longitude, latitude, zoom } = view)
            }

        initBasemap(options.basemap)
        const markers: Feature[] = []
        const polygons: Feature[] = []
        transformed.forEach(el=> {
            switch (el.type){
                case 'markers':
                    if (el?.features.length) {
                        markers.push(el?.features)
                    }
                    break;
                case 'polygons':
                    if (el?.features.length) {
                        polygons.push(el?.features)
                    }
                    break
            }

        })
        setPoints(markers)
        setPolygons(polygons)

        setZoom(zoom)
        const deckInitViewState = {
            longitude,
            latitude,
            zoom,
        };
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
    const getLayers = () => {
        const layers: any = [];
        const markers = getPoints;
        const polygons = getPolygons
        if (markers.length < 1 && polygons.length < 1) {
            return layers;
        }

        let lines, icons, pathLine, unames, list1, list2, nums

        const layerProps = {
            pickable: true,
            autoHighlight: true,
            highlightColor: [170, 100, 50, 60],
            onHover: setHoverInfo,
            zoom: zoomGlobal,
        };

        if (polygons.length>0) {
            polygons.forEach((p,i)=> {
                layers.push(MyPolygonsLayer({ ...layerProps,data: p, idx: i }));
            })
        }

        if (markers.length>0) {
            markers.forEach((m, i)=>{
                layers.push(getisShowLines ? MyLineLayer({ setHoverInfo, data: getLines[i], type: 'lines'+i }) : null);
                // layers.push(getpLines?.length > 0 ? MyLineLayer({ setHoverInfo, data: getpLines[i], type: 'pline' }) : null);

                let clusterLayerData;
                let iconLayerData;

                if (getisShowCluster) {
                    clusterLayerData = m
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
                } else {
                    iconLayerData = m
                }

                if (clusterLayerData) {
                    layers.push(
                        new IconClusterLayer({
                            ...layerProps,
                            getPosition: (d) => d.coordinates,
                            selectedIp: getSelectedIp,
                            data: clusterLayerData,
                            id: 'icon-cluster' + i,
                            sizeScale: 30,
                            onClick: (info, event) => {
                                setHoverInfo({
                                    x: -3000,
                                    y: -3000,
                                    cluster: false,
                                    object: {
                                        cluster: false
                                    },
                                    objects: []
                                });
                            },
                            thresholds: []
                        })
                    );
                }

                if (iconLayerData && getisShowPoints) {
                    layers.push(
                        MyIconLayer({
                            ...layerProps,
                            data: iconLayerData.slice(),
                            getSelectedFeIndexes,
                            getSelectedIp,
                            setClosedHint,
                            setSelectedIp,
                            zoom: zoomGlobal,
                            idx: i
                        })
                    );
                }
            })
        }

        setLayers(layers)
    };

 const [layers, setLayers] = useState([])

    useEffect(() => {
        getLayers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        getPolygons,
        getPoints,
        getpLinePoints,
        getisShowCluster,
        getisShowLines,
        getisShowPoints
    ]);

    return (
            <>
                    {getViewState && <DeckGL
                        ref={deckRef}
                        style={{
                            width: '100%',
                            height: '99%',
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
                            mapLib={maplibregl}
                            mapStyle={source}
                        />}
                        <Tooltip info={hoverInfo} isClosed={closedHint} selectedFeIndexes={getSelectedFeIndexes}/>
                    </DeckGL>}
                <Menu/>
          </>
    );
}

export default observer(Mapgl);

const getStyles = (theme: GrafanaTheme2) => ({})

