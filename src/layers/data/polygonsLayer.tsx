import React from 'react';
import {
    PanelData,
    DataFrameView,
} from '@grafana/data';

import { dataFrameToPoints, getLocationMatchers } from '../../utils/location';
import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
    DataLayerOptions
} from '../../extension';
import {Feature} from '../../store/interfaces';
import {Geometry, Point, Position} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";

export interface PolygonsConfig {
    globalThresholdsConfig: [],
}

const defaultOptions: PolygonsConfig = {
    globalThresholdsConfig: [],
};
export const POLYGONS_LAYER_ID = 'polygons';

// Used by default when nothing is configured
export const defaultPolygonsConfig: ExtendMapLayerOptions<PolygonsConfig> = {
    type: POLYGONS_LAYER_ID,
    name: 'polygons layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};
export let locName, parentName, metricName, displayProperties, thresholds

/**
 * Map data layer configuration for icons overlay
 */
export const polygonsLayer: ExtendMapLayerRegistryItem<PolygonsConfig> = {
    id: POLYGONS_LAYER_ID,
    name: 'Polygons layer',
    description: 'render polygons from geojson geometry',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param options
     */
    pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<PolygonsConfig>) => {
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
        displayProperties = options.displayProperties
        thresholds = options?.config?.globalThresholdsConfig



        for (const frame of data.series) {
//|| !options.query) || (frame.meta)
            console.log('options.query.options === frame.refId', options?.query?.options, frame.refId)
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
                const points: Array<{ contour: Position[]; id: number; type: string; properties: any }> = info.points.map((geom, id) => {
                        const {type, coordinates} = geom
                        const point = dataFrame[id]
                        const metric = point[metricName]
                        const threshold = getThresholdForValue(point, metric, thresholds)
                        const iconColor = threshold.color
                        const colorLabel = threshold.label
                        const lineWidth = threshold.lineWidth

                        const contour = coordinates

                        const entries = Object.entries(point);

                        return {
                            id: id,
                            type: "Feature",
                            contour,
                            properties: {
                                ...point,
                                contour,
                                locName: entries.length > 0 ? point[locName] ?? entries[0][1] : undefined,
                                parentName: point[parentName],
                                [metricName ?? 'metric']: point[metricName],
                                iconColor: iconColor || 'rgb(0, 0, 0)',
                                colorLabel,
                                lineWidth: lineWidth || 1,
                            },
                        }
                    }
                );


                return points
            }

            break; // Only the first frame for now!
        }

        return []
    },

    // Polygons overlay options
    registerOptionsUI: (builder) => {

        builder
            .addBooleanSwitch({
                path: 'config.jitterPoints',
                name: 'exmaple',
                description: 'exmpale swithc',
                defaultValue: true,//defaultOptions.jitterPoints,
            })
    },

    // fill in the default values
    defaultOptions,
};
