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
import {colTypes, LineExtraProps, Feature, Vertices} from '../../store/interfaces';
import { Point} from "geojson";
import {parseIfPossible} from "../../utils";
import {toJS} from "mobx";

export interface MarkersConfig {
  globalThresholdsConfig?: [],
  colIdx?: number,
  startId: number,
  direction: "target" | "source" | undefined,
  vertices:  Vertices,
  searchProperties?: string[],
  show: boolean,
  jitterPoints?: boolean;
}

const defaultOptions: MarkersConfig = {
  startId: 0,
  direction: "source",
  vertices: {},
  searchProperties: [],
  show: true,
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
  pointsUp: async (data: PanelData, options: ExtendMapLayerOptions<MarkersConfig>) => {
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
    const metricField = options.metricField
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
    const colType = MARKERS_LAYER_ID

    // Create a Map to "jitter" geopoints with same coordinates
    const groupedByCoordinates = new Map();

    for (const frame of data.series) {
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

              const metric = metricField && point[metricField]

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

              const displayProps = (isShowTooltip && displayProperties && displayProperties?.length) ? [...displayProperties, 'ack', 'msg',, 'all_annots'] : includes

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

                  const newFeature: Feature = {
                    id: startId + counterId,
                    type: "Feature",
                    geometry,
                    properties: {
                      ...point,
                      locName,
                      edgeField,
                      ...(isShowBW && throughput && {bandNumber, bandWidth, throughput}),
                      aggrType: aggrTypeField && point[aggrTypeField],
                      metric,
                      colType,
                      ...(isShowTooltip && {isShowTooltip}),
                      ...(displayProps && {displayProps}),
                    },
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
                  return;
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







