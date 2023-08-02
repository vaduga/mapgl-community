import {
    PanelData,
} from '@grafana/data';

import { getLocationMatchers } from '../../utils/location';
import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
} from '../../extension';
import {Feature} from '../../store/interfaces';
import {Position} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {colorToRGBA} from "../../utils";

export interface GeoJsonConfig {
}

const defaultOptions: GeoJsonConfig = {
};
export const GEOJSON_LAYER_ID = 'geojson';

// Used by default when nothing is configured
export const defaultPolygonsConfig: ExtendMapLayerOptions<GeoJsonConfig> = {
    type: GEOJSON_LAYER_ID,
    name: 'polygons layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};
export let locName, parentName, metricName, searchProperties, isShowTooltip, thresholds, geoColor

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

        locName = options.geojsonLocName
        metricName = options.geojsonMetricName
        isShowTooltip = options.isShowTooltip
        const displayProperties = options.geojsonDisplayProperties
//@ts-ignore
        geoColor = colorToRGBA(options?.geojsonColor);
        searchProperties = options?.searchProperties
// @ts-ignore
        thresholds = options?.config?.globalThresholdsConfig


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

                const points: Array<{ contour: Position[]; id: number; type: string; properties: any }> = geoData?.features?.map((point, id) => {
                    const {geometry,properties: props} = point
                    const metric = props[metricName]
                    const threshold = getThresholdForValue(point, metric, thresholds)
                    const iconColor = metric ? threshold.color : geoColor
                    const colorLabel = threshold.label
                    const lineWidth = threshold.lineWidth


                    return {
                        id: id,
                        type: "Feature",
                        geometry,
                        properties: {
                            ...props,
                            geometry,
                            locName: locName ? props[locName] : undefined,
                            parentName: props[parentName],
                            metricName: metric,
                            iconColor: iconColor ?? 'rgb(350, 220, 20)',
                            colorLabel,
                            lineWidth: lineWidth ?? 1,
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
