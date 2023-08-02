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
import {Feature} from '../../store/interfaces';
import {Position} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";

export interface PathConfig {
    globalThresholdsConfig: [],
}

const defaultOptions: PathConfig = {
    globalThresholdsConfig: [],
};
export const PATH_LAYER_ID = 'path';

// Used by default when nothing is configured
export const defaultPathConfig: ExtendMapLayerOptions<PathConfig> = {
    type: PATH_LAYER_ID,
    name: 'path layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};
export let locName, parentName, metricName, searchProperties, isShowTooltip, thresholds

/**
 * Map data layer configuration for icons overlay
 */
export const pathLayer: ExtendMapLayerRegistryItem<PathConfig> = {
    id: PATH_LAYER_ID,
    name: 'path layer',
    description: 'render path from Geojson LineStrings',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param options
     */
    pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<PathConfig>) => {
        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        const matchers = await getLocationMatchers(options.location);

        if (!data.series.length) {
            return []
        }

        locName = options.locName
        metricName = options.metricName
        isShowTooltip = options.isShowTooltip
        const displayProperties = options.displayProperties
        searchProperties = options?.searchProperties
        thresholds = options?.config?.globalThresholdsConfig

        for (const frame of data.series) {
//|| !options.query) || (frame.meta)
           // console.log('options.query.options === frame.refId', options?.query?.options, frame.refId)
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
                const points: Array<{ path: Position[]; id: number; type: string; properties: any }> = info.points.map((geom, id) => {
                        const {coordinates} = geom
                        const point = dataFrame[id]
                        const metric = point[metricName]
                        const threshold = getThresholdForValue(point, metric, thresholds)
                        const iconColor = threshold.color
                        const colorLabel = threshold.label
                        const lineWidth = threshold.lineWidth

                        const path = coordinates

                        const entries = Object.entries(point);

                        return {
                            id: id,
                            type: "Feature",
                            path,
                            properties: {
                                ...point,
                                path,
                                locName: entries.length > 0 ? point[locName] ?? entries[0][1] : undefined,
                                parentName: point[parentName],
                                metricName: point[metricName],
                                iconColor: iconColor || 'rgb(0, 0, 0)',
                                colorLabel,
                                lineWidth: lineWidth || 1,
                                isShowTooltip,
                                displayProperties: isShowTooltip ? displayProperties : null
                            },
                        }
                    }
                );

                return points
            }

            //break; // Only the first frame for now!
        }

        return []
    },

     // fill in the default values
    defaultOptions,
};
