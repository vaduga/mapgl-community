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
import {Position, Polygon} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {PATH_LAYER_ID} from "./pathLayer";
import {toJS} from "mobx";

export interface PolygonsConfig {
    colIdx: number,
    startId: number,
    globalThresholdsConfig: [],
}

const defaultOptions: PolygonsConfig = {
    colIdx: 0,
    startId: 0,
    globalThresholdsConfig: [],
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
    description: 'render from Geojson Polygons',
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

        const  locField = options.locField
        const  metricField = options.metricField
        const  isShowTooltip = options.isShowTooltip
        const displayProperties = options.displayProperties
        const colIdx = config.colIdx
        const colType = POLYGONS_LAYER_ID
        const  thresholds = options?.config?.globalThresholdsConfig



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
                        const metric = metricField &&  point[metricField]
                        const threshold = getThresholdForValue(point, metric, thresholds)
                        const entries = Object.entries(point);
                        const locName = entries.length > 0 && locField ? point[locField] ?? entries[0][1] : undefined

                        return {
                            id: config.startId+id,
                            type: "Feature",
                            geometry,
                            properties: {
                                ...point,
                                locName,
                                metric: metricField && point[metricField],
                                threshold,
                                colIdx,
                                colType,
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
