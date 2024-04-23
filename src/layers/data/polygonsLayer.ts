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
import {Position, Polygon, GeometryCollection, Geometry} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {PATH_LAYER_ID} from "./pathLayer";
import {toJS} from "mobx";
import {StyleEditor} from "../../editor/StyleEditor";
import {defaultStyleConfig, StyleConfig} from "../../editor/style/types";
import {getStyleConfigState} from "../../editor/style/utils";
import {getStyleDimension} from "../../editor/style/geomap_utils";
import {hexToRgba} from "../../utils";

export interface PolygonsConfig {
    colIdx: number,
    startId: number,
    globalThresholdsConfig: [],
    style: StyleConfig,
}

const defaultOptions: PolygonsConfig = {
    colIdx: 0,
    startId: 0,
    globalThresholdsConfig: [],
    style: defaultStyleConfig,
};
export const POLYGONS_LAYER_ID = colTypes.Polygons;

// Used by default when nothing is configured
export const defaultPolygonsConfig: ExtendMapLayerOptions<PolygonsConfig> = {
    type: POLYGONS_LAYER_ID,
    name: 'polygons layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};

/**
 * Map data layer configuration for icons overlay
 */
export const polygonsLayer: ExtendMapLayerRegistryItem<PolygonsConfig> = {
    id: POLYGONS_LAYER_ID,
    name: 'Polygons layer',
    description: 'GeoJson Polygons from query',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param options
     */
    pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<PolygonsConfig>, theme) => {
        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        const matchers = await getLocationMatchers(options.location);

        if (!data.series.length) {
            return []
        }

        const  locField = options.locField
        const  isShowTooltip = options.isShowTooltip
        const displayProperties = options.displayProperties
        const colIdx = config.colIdx
        const colType = POLYGONS_LAYER_ID
        const style = await getStyleConfigState(config.style);
        const  thresholds = options?.config?.globalThresholdsConfig



        for (const frame of data.series) {
//|| !options.query) || (frame.meta)
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
                const points: { geometry: number[] | Polygon | GeometryCollection<Geometry>; id: number; type: string; properties: any }[] = info.points.map((geometry, i) => {

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
                        type: "Polygon",
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
}
