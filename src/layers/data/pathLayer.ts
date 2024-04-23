import {
    PanelData,
    DataFrameView,
} from '@grafana/data';

import { dataFrameToPoints, getLocationMatchers } from '../../utils/location';
import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
} from '../../extension';
import {colTypes, Feature} from '../../store/interfaces';
import {Position, LineString} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";
import {GEOJSON_LAYER_ID} from "./geojsonLayer";
import {StyleEditor} from "../../editor/StyleEditor";
import {defaultStyleConfig, StyleConfig} from "../../editor/style/types";
import {hexToRgba} from "../../utils";
import {getStyleConfigState} from "../../editor/style/utils";
import {getStyleDimension} from "../../editor/style/geomap_utils";

export interface PathConfig {
    colIdx: number,
    startId: number,
    globalThresholdsConfig: [],
    style: StyleConfig,
}

const defaultOptions: PathConfig = {
    colIdx: 0,
    startId: 0,
    globalThresholdsConfig: [],
    style: defaultStyleConfig,
};
export const PATH_LAYER_ID = colTypes.Path;

// Used by default when nothing is configured
export const defaultPathConfig: ExtendMapLayerOptions<PathConfig> = {
    type: PATH_LAYER_ID,
    name: 'path layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};

/**
 * Map data layer configuration for icons overlay
 */
export const pathLayer: ExtendMapLayerRegistryItem<PathConfig> = {
    id: PATH_LAYER_ID,
    name: 'Path layer',
    description: 'GeoJson LineStrings from query',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param options
     */
    pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<PathConfig>, theme) => {
        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        const matchers = await getLocationMatchers(options.location);

        if (!data.series.length) {
            return []
        }

        const locField = options.locField
        const isShowTooltip = options.isShowTooltip
        const displayProperties = options.displayProperties
        const colIdx = config.colIdx
        const colType = PATH_LAYER_ID
        const style = await getStyleConfigState(config.style);
        const thresholds = options?.config?.globalThresholdsConfig

        for (const frame of data.series) {
//|| !options.query) || (frame.meta)
           // console.log('options.query.options === frame.refId', options?.query?.options, frame.refId)
            style.dims = getStyleDimension(frame, style, theme);
            if ((options.query && options.query.options === frame.refId )) {

                const info = dataFrameToPoints(frame, matchers);
                if (info.warning) {
                    console.log('Could not find locations', info.warning);
                    // continue; // ???
                }
                const coords = info.points

                if (!coords) {
                    console.log('no coords')
                    return []}

                const dataFrame = new DataFrameView(frame).toArray()
                const points: { geometry: LineString; id: number; type: string; properties: any }[] = info.points.map((geometry, i) => {

                        const point = dataFrame[i]

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
                    const locName = entries.length > 0 && locField ? point[locField] ?? entries[0][1] : undefined

                    const properties = {
                        ...point,
                        locName,
                        style: stValues,
                        colType,
                        ...(isShowTooltip && {isShowTooltip}),
                        ...(displayProps && {displayProps}),
                    }

                    const threshold = getThresholdForValue(properties, metric, thresholds, defaultColor)

                    const newFeature: any = {
                        id: config.startId+i,
                        type: "LineString",
                        geometry,
                        properties: {...properties, threshold}
                    }

                    return newFeature
                        }

                );

                return points
            }

            //break; // Only the first frame for now!
        }

        return []
    },

    // Polygons overlay options
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
