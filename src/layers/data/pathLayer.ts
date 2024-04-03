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

export interface PathConfig {
    colIdx: number,
    startId: number,
    globalThresholdsConfig: [],
}

const defaultOptions: PathConfig = {
    colIdx: 0,
    startId: 0,
    globalThresholdsConfig: [],
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

        const locField = options.locField
        const metricField = options.metricField
        const isShowTooltip = options.isShowTooltip
        const displayProperties = options.displayProperties
        const colIdx = config.colIdx
        const colType = PATH_LAYER_ID
        const thresholds = options?.config?.globalThresholdsConfig

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
                const points: { geometry: LineString; id: number; type: string; properties: any }[] = info.points.map((geom, id) => {
                        const point = dataFrame[id]
                        const metric = metricField && point[metricField]
                        const threshold = getThresholdForValue(point, metric, thresholds)
                        const path = geom.coordinates

                        const entries = Object.entries(point);
                        const locName = entries.length > 0 && locField ? point[locField] ?? entries[0][1] : undefined
                        const geometry: LineString = {
                        type: 'LineString',
                            coordinates: path
                    }


                        return {
                            id: config.startId+id,
                            type: "Feature",
                            geometry,
                            properties: {
                                ...point,
                                geometry,
                                locName,
                                //parName: point[parField],
                                metric: metricField && point[metricField],
                                threshold,
                                colIdx,
                                colType,
                                isShowTooltip,
                                displayProps: isShowTooltip ? displayProperties : null
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
