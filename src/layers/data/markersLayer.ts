import {
  PanelData,
  DataFrameView, GrafanaTheme2,
} from '@grafana/data';

import { dataFrameToPoints, getLocationMatchers } from '../../utils/location';
import {
  ExtendMapLayerRegistryItem,
  ExtendFrameGeometrySourceMode,
  ExtendMapLayerOptions,
} from '../../extension';
import {colTypes, LineExtraProps, Feature, Vertices} from '../../store/interfaces';
import { Point} from "geojson";
import {hexToRgba, parseIfPossible, parseObjFromString} from "../../utils";
import {toJS} from "mobx";
import {StyleEditor} from "../../editor/StyleEditor";
import {defaultStyleConfig, StyleConfig} from "../../editor/style/types";
import {getStyleConfigState} from "../../editor/style/utils";
import {getStyleDimension} from "../../editor/style/geomap_utils";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {getIconRuleForFeature} from "../../editor/IconsSVG/data/rules_processor";
import {Threshold} from "../../editor/Thresholds/threshold-types";

export interface MarkersConfig {
  globalThresholdsConfig?: [],
  svgIconRules?: [],
  thresholds?: Threshold[],
  locLabelName?: string,
  startId: number,
  direction: "target" | "source" | undefined,
  vertices:  Vertices,
  searchProperties?: string[],
  show: boolean,
  style: StyleConfig,
  jitterPoints?: boolean;
}

const defaultOptions: MarkersConfig = {
  startId: 0,
  direction: "target",
  vertices: {},
  searchProperties: [],
  show: true,
  style: defaultStyleConfig,
  jitterPoints: false,
};

export const MARKERS_LAYER_ID = colTypes.Points

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  isShowBW: false,
  throughputField: undefined,
  bandField: undefined,
  type: MARKERS_LAYER_ID,
  name: 'new data',
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto,
  }
};
export let searchProperties

/**
 * Map data layer configuration for icons overlay
 */
export const markersLayer: ExtendMapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Markers and clusters',
  description: 'nodes and edges from query',
  isBaseMap: false,
  showLocation: true,
  /**
   * Function that configures transformation and returns transformed points for mobX
   * @param options
   */
  pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<MarkersConfig>, theme: GrafanaTheme2) => {
    // Assert default values
    const config = {
      ...defaultOptions,
      ...options.config,
    };

    const matchers = await getLocationMatchers(options?.location);

    if (!data.series.length) {
      return []
    }

    const locField = options.locField
    const parField = options.parField
    const edgeLabelField = options.edgeLabelField
    const isShowBW = options.isShowBW
    const bandField = options.bandField
    const throughputField = options.throughputField
    const isShowTooltip = options.isShowTooltip
    const aggrTypeField = options.aggrTypeField

    const displayProperties = options.displayProperties
    searchProperties = options.searchProperties
    const isJitterPoints = config.jitterPoints
    const startId = config.startId
    const direction = config.direction
    const vertices = config.vertices
    const locLabelName = config.locLabelName
    const svgIconRules = config.svgIconRules
    const thresholds = config.thresholds

    const colType = MARKERS_LAYER_ID
    const style = await getStyleConfigState(config.style);

    const alerts = {}

    if (locLabelName && data.annotations?.length && data.annotations[0].fields.length ) {
      data.annotations.forEach(a => {
            const annotations = new DataFrameView(a).toArray()

            annotations.forEach(b => {
              if (b?.text) {
                b.labels = parseObjFromString(b?.text)
              }
              const name = b.labels?.alertname
              const locName = b.labels?.[locLabelName]
              if (name) {
                const alertMap = alerts[name]
                if (alertMap) {
                  const alertAnnots = alertMap.get(locName)
                  if (alertAnnots) {
                    alertAnnots.push(b)
                  } else {
                    alertMap.set(locName, [b])
                  }
                } else {
                  const newAlertMap = new Map()
                  newAlertMap.set(b.labels[locLabelName], [b])
                  alerts[name] = newAlertMap
                }
              }
            })
          }
      )
    }


    // Create a Map to "jitter" geopoints with same coordinates
    const groupedByCoordinates = new Map();

    for (const frame of data.series) {
      style.dims = getStyleDimension(frame, style, theme);

      // @ts-ignore
      if ((!frame.refId || options.query && options.query.options === frame.refId || frame.meta?.transformations && frame.meta.transformations?.length>0)) {
        const info = dataFrameToPoints(frame, matchers);
        if (info.warning) {
          //console.log('Could not find locations', info.warning);
        }
        const coords = info.points
        if (!coords) {
          console.log('no coords')
          return []}

        const dataFrame = new DataFrameView(frame).toArray()

        const points: Feature[] = []
        let counterId = 0
            coords.forEach((geom, i) => {

              const {type, coordinates} = geom
              const point = dataFrame[i]

              const locName = locField && point[locField]
              if (!locName) {
                return
              }
              const edgeField = edgeLabelField
              const bandNumber = options.bandNumber
              const bandWidth = bandField && point[bandField]
              const throughput = throughputField && point[throughputField]

              const geometry: Point = {
                type: 'Point',
                coordinates: coordinates.slice(),
              }

              const dsParents = parField && point[parField]
              const parsedParents = parseIfPossible(dsParents)

              const parents = parsedParents
              let lineExtraProps: LineExtraProps | undefined
              const excludes = [locField, parField, 'locName', 'sources', 'geojson', '$streamId', '$time', 'threshold', 'colType', 'isShowTooltip', 'displayProps']
              ///Object.keys(point)?.filter(el=> !excludes.includes(el))  - should i by default show more props?
              const includes = ['ack', 'msg']

              const displayProps = (isShowTooltip && displayProperties && displayProperties?.length) ? [...displayProperties, 'ack', 'msg', 'all_annots'] : includes

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
              }

              const fixedColor = style.config?.color?.fixed
              stValues.fixedColor = fixedColor

              const hexColor = fixedColor && theme.visualization.getColorByName(fixedColor)
              const defaultColor = hexColor ? hexToRgba(hexColor) : undefined


              if (locName && (!vertices.hasOwnProperty(locName) || direction === 'source')) {
                const ptId = startId + counterId /// removes duplicate pts from dataframe
                if (!vertices[locName]?.ptId) {
                  vertices[locName] = {...vertices[locName], ptId, tarCoords: coordinates.slice()}

                  /// 'Jitter points' grouping initializes only on non-edited points
                  if (isJitterPoints && coordinates?.length === 2) {
                    const [longitude, latitude] = coordinates // .slice();

                    /// Create a string key for the coordinates
                    const coordinatesKey = `${longitude},${latitude}`;

                    /// Add coord to the array of the corresponding key-coordinate
                    if (!groupedByCoordinates.has(coordinatesKey)) {
                      groupedByCoordinates.set(coordinatesKey, []);
                    }
                    groupedByCoordinates.get(coordinatesKey).push({idx: startId + counterId, longitude, latitude});
                  }

                  let annotations: any = []
                  Object.keys(alerts).forEach(name => {
                        const alertAnnots = alerts[name].get(locName)
                        if (alertAnnots?.length) {
                          annotations.push(alertAnnots)
                        }
                      }
                  )

                  let all_annots
                  if (annotations.length) {
                    all_annots = annotations
                  }

                  const properties = {
                  ...point,
                        locName,
                        edgeField,
                        style: stValues,
                  ...(isShowBW && throughput && {bandNumber, bandWidth, throughput}),
                        aggrType: aggrTypeField && point[aggrTypeField],
                        all_annots,
                        colType,
                  ...(isShowTooltip && {isShowTooltip}),
                  ...(displayProps && {displayProps}),
                  }

                  const threshold = getThresholdForValue(properties, metric, thresholds, defaultColor)
                  const rulesThreshold = getIconRuleForFeature(properties, svgIconRules)
                  const newFeature: Feature = {
                    id: startId + counterId,
                    type: "Feature",
                    geometry,
                    properties: {...properties, threshold: {...threshold, ...rulesThreshold}}
                  }
                  points.push(newFeature)
                  counterId++
                }
              } else {
                const lineExcludes = [locField, parField, 'locName', 'sources', 'geojson', 'longitude', 'latitude', '$streamId', '$time', 'colType']

                lineExtraProps = Object.fromEntries(
                    Object.entries({
                      ...point, metric, ...(throughput && {
                        bandNumber,
                        bandWidth,
                        throughput
                      })
                    })     /// metric could be changes by status updates live
                        .filter(([key]) => !lineExcludes.includes(key))
                );
              }

              const isParFieldArray = Array.isArray(parents)
              if (isParFieldArray && Array.isArray(parents[0])) {
                for (let i = 0; i < parents.length; i++) {
                  const parPath = getParPath(parents, counterId, i, locName)
                  if (!parPath.length) {
                    continue;
                  }
                  pushPath(vertices, parPath, direction, lineExtraProps);
                }
              } else if (parents) {
                const parPath = getParPath(parents, counterId, null, locName)

                if (parPath.filter(el => el && (typeof el === 'string' || Array.isArray(el))).length < 2) {
                  return ;
                }

                pushPath(vertices, parPath, direction, lineExtraProps);
              }

            }
        );

        ///'Jitter points': spiral out coords in each group of geopoints with same coordinates
        if (isJitterPoints) {
          groupedByCoordinates.forEach(coords => {
            const len = coords.length;

            if (len > 1) {
              let angle = 0, k = 1, r = 0.0001;
              coords.forEach(({idx, longitude, latitude}, i) => {
                if (idx && points[idx]?.geometry.type === 'Point') {

                  const pointGeometry = points[idx].geometry as Point;
                  pointGeometry.coordinates[0] = longitude + 0.00005 * Math.cos(angle)
                  pointGeometry.coordinates[1] = latitude + 0.00005 * Math.sin(angle)
                  angle = Math.PI * 2 * k / (len + 1)
                  k = k + 1;
                }
              });
            }
          });
        }
        return points
      }
      //break; // Don't break . Process and concatenate all frames into points
            }

    return []
          },

  // Marker overlay options
  registerOptionsUI: (builder) => {
    builder
        .addCustomEditor({
          id: 'config.style',
          path: 'config.style',
          name: 'Primary metric styles',
          editor: StyleEditor,
          settings: {
            displayRotation: true,
          },
          defaultValue: defaultOptions.style,
        })
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

function getParPath(parents, id, idx,locName){

  const isArray = Array.isArray(parents)

  if (!isArray) {
    if (typeof parents === 'string') {
      return [locName, parents]
    }
  //  console.log('Wrong format: '+toJS(parents))
    return []
  }

  const isNested = Array.isArray(parents[idx])
  const parPath: any = isNested ? parents[idx] : parents

  const isInitString = (Array.isArray(parPath) && typeof parPath[0] === 'string') || (!Array.isArray(parPath[0]) && typeof parPath === 'string') // #TODO : better handling for single names like [["U1"],"M1"]
  if (!isInitString) {
   // console.log('Wrong path format: No coords, numbers, nulls allowed as 0 element), no deeper nesting arrays, or empty arrays. Info: id: '+id+' locName: '+locName+' sources: '+parents)
    return []
  }

  const isSingle = Array.isArray(parPath)? parPath.length===1 : false
   return isSingle? [locName, parPath[0]]: parPath[0] !== locName ? [locName, ...parPath] : parPath as []

 }

export function pushPath (vertices: Vertices, parPathBase, direction, lineExtraProps ) {

  const locName = parPathBase[0]
  const parName = parPathBase.at(-1)
  const isSource = direction === 'source'
  const fromName = isSource ? parName : locName
  const toName = isSource ? locName : parName
  const parPath = isSource ? parPathBase.slice().reverse() : parPathBase

  const sources = vertices[fromName]?.sources

  if (sources) {
    if (sources[toName]) {
      if (sources?.[toName]?.lineExtraProps)
      {
        sources[toName] = {...sources[toName], lineExtraProps: {...sources[toName]?.lineExtraProps,   ...Object.fromEntries(
                Object.entries(lineExtraProps || {}).filter(([k, v]) => v !== undefined && v !== null && v !== '')
            ),}}  /// no rewrites down the edgeStream traverse , but add props
      }

    } else {
      sources[toName] = {parPath,  ...(lineExtraProps ? { lineExtraProps } : {})}
    }
  }
    else {
      vertices[fromName] = {...vertices[fromName],sources: {[toName]: {parPath}}}
    }

}







