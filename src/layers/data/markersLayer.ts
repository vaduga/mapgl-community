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
import { Point} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";

export interface MarkersConfig {
  globalThresholdsConfig?: [],
  searchProperties?: string[],
  parentName?: string,
  show: boolean,
  jitterPoints?: boolean;

}

const defaultOptions: MarkersConfig = {
  searchProperties: [],
  show: true,
  jitterPoints: true,
};
export const MARKERS_LAYER_ID = 'markers';

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  name: 'new data',
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto
  }
};
export let locName, parentName, metricName, searchProperties, isShowTooltip, thresholds

/**
 * Map data layer configuration for icons overlay
 */
export const markersLayer: ExtendMapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Markers and clusters',
  description: 'render data-points with parent-child relation lines',
  isBaseMap: false,
  showLocation: true,

  /**
   * Function that configures transformation and returns transformed points for mobX
   * @param options
   */
  pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<MarkersConfig>) => {
    // Assert default values
    const config = {
      ...defaultOptions, ...options.config
    };

    const matchers = await getLocationMatchers(options?.location);

    if (!data.series.length) {
      return []
    }

    locName = options.locName
    parentName = options?.parentName
    metricName = options.metricName
    isShowTooltip = options.isShowTooltip
    const displayProperties = options.displayProperties
    searchProperties = options?.searchProperties
    thresholds = options?.config?.globalThresholdsConfig

    const isJitterPoints = config.jitterPoints

       // Create a Map datastructure to "jitter" geopoints with same coordinates
    const groupedByCoordinates = new Map();

    for (const frame of data.series) {

      if ((options.query && options.query.options === frame.refId)) {

        const info = dataFrameToPoints(frame, matchers);
        if (info.warning) {
          console.log('Could not find locations', info.warning);
        }
        const coords = info.points

        if (!coords) {
          console.log('no coords')
          return []}

        const dataFrame = new DataFrameView(frame).toArray()

        const points: Array<{ geometry: Point; id: number; type: string; properties: any }> = info.points.map((geom, id) => {
          const {type, coordinates} = geom
              const point = dataFrame[id]
              const metric = point[metricName]
              const threshold = getThresholdForValue(point, metric, thresholds)
              const iconColor = threshold.color
              const colorLabel = threshold.label
              const lineWidth = threshold.lineWidth

              const geometry: Point = {
                type,
                coordinates //.slice(),
              }

              /// 'Jitter points' grouping
              if (isJitterPoints && coordinates?.length === 2) {
                const [longitude, latitude] = coordinates // .slice();

                /// Create a string key for the coordinates
                const coordinatesKey = `${longitude},${latitude}`;

                /// Add coord to the array of the corresponding key-coordinate
                if (!groupedByCoordinates.has(coordinatesKey)) {
                  groupedByCoordinates.set(coordinatesKey, []);
                }
                groupedByCoordinates.get(coordinatesKey).push({idx: id, longitude, latitude});
              }

          const entries = Object.entries(point);

              return {
                id: id,
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

        ///'Jitter points': spiral out coords in each group of geopoints
        if (isJitterPoints) {
          groupedByCoordinates.forEach(coords => {
            const len = coords.length;

            if (len > 1) {
              let angle = 0, k = 1, r = 0.0001;
              coords.forEach(({idx, longitude, latitude}, i) => {
                if (points[idx].geometry.type === 'Point') {

                  const pointGeometry = points[idx].geometry as Point;
                  const pointGeometryProps = points[idx].properties.geometry as Point;

                  pointGeometry.coordinates[0] = longitude + 0.0001 * Math.cos(angle)
                  pointGeometry.coordinates[1] = latitude + 0.0001 * Math.sin(angle)
                  pointGeometryProps.coordinates[0] = longitude + 0.0001 * Math.cos(angle)
                  pointGeometryProps.coordinates[1] = latitude + 0.0001 * Math.sin(angle)
                  angle = Math.PI * 2 * k / (len + 1)
                  k = k + 1;
                }
              });
            }
          });
        }

        return points
      }

      //break; // Only the first frame for now!
            }

    return []
          },

  // Marker overlay options
  registerOptionsUI: (builder) => {

    builder
      .addBooleanSwitch({
        path: 'config.jitterPoints',
        name: 'Jitter points',
        description: 'Jitter points with same coordinates around each other',
        defaultValue: defaultOptions.jitterPoints,
      })
  },

  // fill in the default values
  defaultOptions,
};
