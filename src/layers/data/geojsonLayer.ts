import {
    PanelData,
} from '@grafana/data';
import {hexToRgba} from '../../utils'

import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
} from '../../extension';
import {colTypes, Feature} from '../../store/interfaces';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";
import {defaultStyleConfig, StyleConfig} from "../../editor/style/types";
import {StyleEditor} from "../../editor/StyleEditor";
import {getStyleDimension} from "../../editor/style/geomap_utils";
import {getStyleConfigState} from "../../editor/style/utils";

export interface GeoJsonConfig {
    startId: number,
    colIdx: number,
    style: StyleConfig,
}

const defaultOptions: GeoJsonConfig = {
    startId: 0,
    colIdx: 0,
    style: defaultStyleConfig,
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
    description: 'GeoJson features from file (url)',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param options
     */
    pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<GeoJsonConfig>, theme) => {
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
        const geoColor = options?.geojsonColor ? hexToRgba(theme.visualization.getColorByName(options?.geojsonColor)) : undefined;

        const style = await getStyleConfigState(config.style);
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

                style.dims = getStyleDimension(undefined, style, theme);

                const points: Feature[] = geoData?.features?.map((point, i) => {
                    const {geometry,properties: props} = point

                    const includes = ['ack', 'msg', 'all_annots', 'liveStat']
                    const displayProps = (isShowTooltip && displayProperties && displayProperties?.length) ? [...displayProperties, 'ack', 'msg', 'all_annots', 'liveStat']  : includes
                    const stValues: any = { ...style.base };
                    const dims = style.dims;

                    const metricField = style.config?.color?.field
                    const metric = metricField ? point[metricField] : undefined

                    if (dims) {
                        if (dims.color) {
                            stValues.color = dims.color.get(i);
                        }
                        if (dims.size) {
                            stValues.size = dims.size.get(i);
                        }
                        if (dims.text) {
                            stValues.text = dims.text.get(i);
                        }
                        stValues.fixedColor = style.config?.color?.fixed
                    }

                    const fixedColor = stValues.fixedColor
                    const hexColor = fixedColor && theme.visualization.getColorByName(fixedColor)
                    const defaultColor = hexColor ? hexToRgba(hexColor) : undefined

                    const entries = Object.entries(point);

                    const properties = {
                        ...point,
                        locName: locName ? props[locName] : undefined,
                        style: stValues,
                        colType,
                        ...(isShowTooltip && {isShowTooltip}),
                        ...(displayProps && {displayProps}),
                    }

                    const threshold = getThresholdForValue(properties, metric, thresholds, defaultColor)

                    const newFeature: any = {
                        id: config.startId+i,
                        type: "Feature",
                        geometry,
                        properties: {...properties, threshold}
                    }

                    return newFeature

                    }
                )

                return points

            }



        return []
    },
// Geojson layer overlay options
    registerOptionsUI: (builder) => {

        builder
            .addCustomEditor({
                id: 'config.style',
                path: 'config.style',
                name: 'Primary metric styles',
                editor: StyleEditor,
                settings: {
                    isAuxLayer: true,
                    displayRotation: true,
                },
                defaultValue: defaultOptions.style,
            })},
    // fill in the default values
    defaultOptions,
};
