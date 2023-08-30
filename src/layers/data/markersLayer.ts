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
import { Point} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";

export interface MarkersConfig {
  globalThresholdsConfig?: [],
  orgId: null | number,
  colIdx: number,
  startId: number,
  searchProperties?: string[],
  parentName?: string,
  show: boolean,
  jitterPoints?: boolean;

}

const defaultOptions: MarkersConfig = {
  startId: 0,
  orgId: null,
  colIdx: 0,
  searchProperties: [],
  show: true,
  jitterPoints: true,
};

export const MARKERS_LAYER_ID = colTypes.Points

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  name: 'new data',
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto
  }
};
export let parFieldExp, isParFieldArray, searchProperties

/**
 * Map data layer configuration for icons overlay
 */
export const markersLayer: ExtendMapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Markers and clusters',
  description: 'render points with parent-child relation lines',
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

    const locField = options.locField
    const parField = options.parField
    parFieldExp = parField
    const metricField = options.metricField
    const isShowTooltip = options.isShowTooltip
    const aggrTypeField = options.aggrTypeField

    const displayProperties = options.displayProperties
    searchProperties = options.searchProperties
    const thresholds = options.config?.globalThresholdsConfig

    const isJitterPoints = config.jitterPoints
    const orgId = config.orgId
    const colIdx = config.colIdx
    const colType = MARKERS_LAYER_ID


       // Create a Map datastructure to "jitter" geopoints with same coordinates
    const groupedByCoordinates = new Map();

    for (const frame of data.series) {

      if ((options.query && options.query.options === frame.refId || frame.meta?.transformations && frame.meta.transformations.length>0)) {

        const info = dataFrameToPoints(frame, matchers);
        if (info.warning) {
          console.log('Could not find locations', info.warning);
        }
        const coords = info.points

        if (!coords) {
          console.log('no coords')
          return []}

        const dataFrame = new DataFrameView(frame).toArray()

        const points: Feature[] = info.points.map((geom, id) => {
          const {type, coordinates} = geom
              const point = dataFrame[id]
              const metric = metricField && point[metricField]
              const threshold = getThresholdForValue(point, metric, thresholds)

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
          const locName = entries.length > 0 && locField ? point[locField] ?? entries[0][1] : undefined
          const geometry: Point = {
            type: 'Point',
            coordinates: coordinates.slice(),
          }

          const par = parField && point[parField]
          const parent = (par && par[0]=== '[') ? JSON.parse(par) : par
          isParFieldArray = Array.isArray(parent)

          const path = [locName, parent].filter(el=> el)

              return {
                id: config.startId+id,
                type: "Feature",
                geometry,
                properties: {
                  ...point,
                  locName,
                  aggrType: aggrTypeField && point[aggrTypeField],
                  parName: Array.isArray(parent) && parent.length>1 ? parent[parent.length-1] : parent,
                  parPath: Array.isArray(parent) ? parent : path,
                  metric: metricField && point[metricField],
                  threshold,
                  colIdx,
                  colType,
                  refId: options.query?.options,
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
              coords.forEach(({idx, longitude, latitude}) => {
                if (points[idx].geometry.type === 'Point') {
                  const pointGeometry = points[idx].geometry as Point;
                  pointGeometry.coordinates[0] = longitude + 0.0001 * Math.cos(angle)
                  pointGeometry.coordinates[1] = latitude + 0.0001 * Math.sin(angle)
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
