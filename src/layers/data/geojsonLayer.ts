import {
    PanelData,
} from '@grafana/data';

import { getLocationMatchers } from '../../utils/location';
import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
} from '../../extension';
import {colTypes, Feature} from '../../store/interfaces';
import {Position} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {colorToRGBA} from "../../utils";
import {MARKERS_LAYER_ID} from "./markersLayer";
import {toJS} from "mobx";

export interface GeoJsonConfig {
    startId: number,
    colIdx: number,
}

const defaultOptions: GeoJsonConfig = {
    startId: 0,
    colIdx: 0,
};
export const GEOJSON_LAYER_ID = colTypes.GeoJson;

// Used by default when nothing is configured
export const defaultPolygonsConfig: ExtendMapLayerOptions<GeoJsonConfig> = {
    type: GEOJSON_LAYER_ID,
    name: 'polygons layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};

/**
 * Map data layer configuration for icons overlay
 */
export const geojsonLayer: ExtendMapLayerRegistryItem<GeoJsonConfig> = {
    id: GEOJSON_LAYER_ID,
    name: 'GeoJson layer',
    description: 'render from Geojson file (url)',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param options
     */
    pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<GeoJsonConfig>) => {
        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        if (!data.series.length) {
            return []
        }

        const locName = options.geojsonLocName
        const metricName = options.geojsonMetricName
        const isShowTooltip = options.isShowTooltip
        const displayProperties = options.geojsonDisplayProperties
        const colIdx = config.colIdx
        const colType = GEOJSON_LAYER_ID
//@ts-ignore
        const geoColor = colorToRGBA(options?.geojsonColor);
// @ts-ignore
        const thresholds = options?.config?.globalThresholdsConfig


        const geoUrl = options?.geojsonurl
            if ((geoUrl)) {
                let ds = await fetch(geoUrl, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).catch((er) => {
                    console.log(er);
                })

                if (!ds) {return []}
                let geoData = await ds.json()

                if (!geoData?.features?.length) {
                    console.log('no geodata')
                    return []}

                const points: Feature[] = geoData?.features?.map((point, id) => {
                    const {geometry,properties: props} = point
                    const metric = metricName && props[metricName]
                    const threshold = getThresholdForValue(point, metric, thresholds)
                    const color = metric ? threshold.color : geoColor
                    const selColor = metric ? threshold.selColor : geoColor

                    return {
                        id: config.startId+id,
                        type: "Feature",
                        geometry,
                        properties: {
                            ...props,
                            geometry,
                            locName: locName ? props[locName] : undefined,
                            metric,
                            threshold: {...threshold, color, selColor},
                            colIdx,
                            colType,
                            isShowTooltip,
                            displayProperties: isShowTooltip ? displayProperties : null
                        },
                    }}
                )

                return points

            }



        return []
    },

    // fill in the default values
    defaultOptions,
};
