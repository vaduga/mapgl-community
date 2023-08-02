import React from 'react';
import {
  PanelData,
  DataFrameView, Field, FieldType,
} from '@grafana/data';

import { dataFrameToPoints, getLocationMatchers } from '../../utils/location';
import {
  ExtendMapLayerRegistryItem,
  ExtendFrameGeometrySourceMode,
  ExtendMapLayerOptions,
  DataLayerOptions
} from '../../extension';
import {Feature} from '../../store/interfaces';
import {Geometry, Point} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {getQueryFields} from "../../editor/getQueryFields";
import {toJS} from "mobx";

export interface MarkersConfig {
  globalThresholdsConfig: [],
  searchProperties?: string[],
  parentName?: string,
  jitterPoints?: boolean;

}

const defaultOptions: MarkersConfig = {
  globalThresholdsConfig: [],
  searchProperties: [],
  jitterPoints: true,
};
export const MARKERS_LAYER_ID = 'markers';

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  name: 'markers layer',
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto
  }
};
export let locName, parentName, metricName, displayProperties, searchProperties, thresholds

/**
 * Map data layer configuration for icons overlay
 */
export const markersLayer: ExtendMapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Clustered icons with lines',
  description: 'render data-points with parent-child connections',
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
    displayProperties = options.displayProperties
    console.log('markeroptions', toJS(options))
    searchProperties = options?.searchProperties
    thresholds = options?.config?.globalThresholdsConfig

    const isJitterPoints = config.jitterPoints

       // Create a Map to "jitter" geopoints with same coordinates
    const groupedByCoordinates = new Map();

    for (const frame of data.series) {

      if ((options.query && options.query.options === frame.refId)) {
        //console.log('macth', options.query.options, frame.refId, frame)
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

        console.log('info', info)
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
                  [metricName ?? 'metric']: point[metricName],
                  iconColor: iconColor || 'rgb(0, 0, 0)',
                  colorLabel,
                  lineWidth: lineWidth || 1,
                },
              }
            }
        );

        ///'Jitter points': spiral out coords in each group of geopoints
        if (isJitterPoints) {
          groupedByCoordinates.forEach(coords => {
            const len = coords.length;

            if (len > 1) {
              const pi = Math.PI
              let angle = 0, k = 1, r = 0.0001;

              let angle_rate = Math.PI * 2 / len
              const deltaAngle = 2 * Math.PI / len;
              const maxAngle = 0.1; // Maximum angle at the center
              const angleDiff = deltaAngle / (len - 1);
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
        // .addFieldNamePicker({
        //   path: 'config.parentName',
        //   name: 'Parent name field',
        //   settings: {
        //     filter: (f: Field) => f.type === FieldType.string,
        //     noFieldsMessage: 'No string fields found',
        //   },
        // })
        // .addMultiSelect({
        //   path: 'config.searchProperties',
        //   name: 'Search by',
        //   description: 'Select properties for search options',
        //   settings: {
        //     allowCustomValue: false,
        //     options: [],
        //     placeholder: 'Search by location name only',
        //     getOptions: getQueryFields,
        //   },
        //   //showIf: (opts) => typeof opts.query !== 'undefined',
        //   defaultValue: '',
        // })
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
