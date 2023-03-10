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
import {DeckFeature} from '../store/interfaces';
import Menu from '../components/Menu';
import {
    getBounds,
    useRootStore,
} from '../utils';

import {GeoJsonLayer} from '../deckLayers/GeoJsonLayer/geo-json-layer';
import {Tooltip} from './Tooltips/Tooltip';
import {MapViewConfig} from "../types";
import {Point, Position} from "geojson";
import {WebMercatorViewport} from "@deck.gl/core/typed";
import {DEFAULT_BASEMAP_CONFIG, defaultBaseLayer, geomapLayerRegistry} from "../layers/registry";
import {ExtendMapLayerOptions} from "../extension";
import {centerPointRegistry, MapCenterID} from "../view";

export let lastMapPanelInstance
const Mapgl = ({ options, data, width, height, replaceVariables }) => {
    const s = useStyles2(getStyles);
    const theme2 = useTheme2()
    const { pointStore, lineStore, viewStore } = useRootStore();
    const {
        //<editor-fold desc="store imports">
        getPoints,
        setPoints,
        getSelectedIp,
        switchMap,
        getisShowCluster,
        getSelectedFeIndexes,
        setSelectedIp,setTooltipObject,
        getpLinePoints,
        getTooltipObject
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
                const featureGeometry = switchMap && switchMap.get(info.objects[0].properties.locName)?.geometry as Point;
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
        const layer = geomapLayerRegistry.getIfExists('markers')
        const transformed = layer?.pointsUp ? await layer.pointsUp(data, options) : []
        const view = initMapView(options.view)

            let longitude, latitude, zoom;
            if (view.id === MapCenterID.Auto) {
                if (transformed?.length) {
                    const viewport = new WebMercatorViewport({width, height});
                    const [minLng, minLat, maxLng, maxLat] = getBounds(transformed);
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
        setPoints(transformed ?? [])
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
    }, [data, width, height, options]);


    const onMapLoad = useCallback(()=> {

        const myRef: {
            current: {getMap: Function} | null
        } = mapRef
        lastMapPanelInstance = myRef.current?.getMap ? myRef.current.getMap() : null;
    } , [])
    const getLayers = () => {
        const layers: any = [];
        const data = getPoints;
        if (!data.length) {
            return layers;
        }
        layers.push(getisShowLines ? MyLineLayer({ data: getLines }) : null);

        const layerProps = {
            pickable: true,
            autoHighlight: true,
            highlightColor: [170, 100, 50, 60],
            onHover: setHoverInfo,
            zoom: zoomGlobal,
        };

        let clusterLayerData;
        let iconLayerData;

        if (getisShowCluster) {
            clusterLayerData = data
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
            iconLayerData = data
        }

        if (clusterLayerData) {
            layers.push(
                new IconClusterLayer({
                    ...layerProps,
                    getPosition: (d) => d.coordinates,
                    selectedIp: getSelectedIp,
                    data: clusterLayerData,
                    id: 'icon-cluster',
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

         if (iconLayerData) {
            layers.push(
                GeoJsonLayer({
                    ...layerProps,
                    data: iconLayerData.slice(),
                    getSelectedFeIndexes,
                    getSelectedIp,
                    setClosedHint,
                    setSelectedIp,
                    zoom: zoomGlobal,
                })
            );
        }
        setLayers(layers)

    };

 const [layers, setLayers] = useState([])


    useEffect(() => {
        getLayers();

    }, [
        getPoints,
        getpLinePoints,
        getisShowCluster,
        getisShowLines,
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

