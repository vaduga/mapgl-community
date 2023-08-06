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
import {Position, Polygon} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";

export interface PolygonsConfig {
}

const defaultOptions: PolygonsConfig = {
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
export let locName, parentName, metricName, searchProperties, isShowTooltip, thresholds

/**
 * Map data layer configuration for icons overlay
 */
export const polygonsLayer: ExtendMapLayerRegistryItem<PolygonsConfig> = {
    id: POLYGONS_LAYER_ID,
    name: 'Polygons layer',
    description: 'render from Geojson Polygon Geometry',
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
        isShowTooltip = options.isShowTooltip
        const displayProperties = options.displayProperties
        searchProperties = options?.searchProperties
        // @ts-ignore
        thresholds = options?.config?.globalThresholdsConfig



        for (const frame of data.series) {
//|| !options.query) || (frame.meta)
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
                const points: Feature[] = info.points.map((geometry, id) => {
                        const point = dataFrame[id]
                        const metric = point[metricName]
                        const threshold = getThresholdForValue(point, metric, thresholds)
                        const iconColor = threshold.color
                        const colorLabel = threshold.label
                        const lineWidth = threshold.lineWidth

                        const entries = Object.entries(point);

                        return {
                            id,
                            type: "Feature",
                            geometry,
                            properties: {
                                ...point,
                                geometry,
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
