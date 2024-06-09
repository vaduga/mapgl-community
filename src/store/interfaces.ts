import {Geometry, Position, GeoJsonProperties, MultiLineString} from 'geojson'

export const AggrTypes = ['node', 'connector']

export type CoordRef = string | Position


export type LineExtraProps = {
  isShowTooltip?: boolean | undefined,
  displayProps?: string[] | [],
  metric?: number,
  [key: string]: unknown
}

export type ParName = string
export type ParentInfo = { lineId?: number | null, parPath: CoordRef[], lineExtraProps?: LineExtraProps }

export type Sources = {[key: ParName]: ParentInfo }


export type Vertices = {[key: string]: {
  ptId?: number | undefined;
  rxPtId?: number | undefined;
  tarCoords?: Position;
  sources?: Sources;
  lineExtraProps: LineExtraProps
}};

export type PointFeatureProperties = GeoJsonProperties & {
  locName: string,
  ptId?: number | undefined,
  colType: colTypes,
  aggrType?: string,
  parPath?: CoordRef[] | null,
  sources?: Sources,
  metric: number,
  threshold: {
  color: string,
  lineWidth: number,
  label: string},
  [key: string]: unknown
};

export interface Info {
  layer?: any;
  x?: number,
  y?: number,
  object?: {
    properties: {
      cluster?: boolean,
      cluster_id: string,
      guideType?: string;
      expZoom?: number;
      isShowTooltip?: Boolean;
      colorCounts?: { [color: string]: { count: number, label: string } }
      annotStateCounts?: { [color: string]: { count: number, label: string }}
      objects?: [],
      isHull: boolean
    }
    [key: string]: unknown
  } ,

  prevHullData?: any,

}

export interface DeckFeature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {

  id: number;
  coordinates: Position;
  properties: P;
}

export type RGBAColor = [number, number, number] | [number,number,number,number]
export enum colTypes {
  Icons = "icons",
  Points = "markers",
  Lines = "edit-lines",
  Polygons = "polygons",
  Path = "path",
  GeoJson = "geojson",
  Text = "text",
  Hull = "convex-hull"
}

export type AllFeatures= {
  markers?: Feature[],
  polygons?: any,
  path?: any,
  geojson?: any,
}

export enum pEditActions {
  MoveNode= 'dragNode',
  DragLine=  'dragLine',
  SetLineId= 'setLineId',
  DeleteSource = 'deleteSource'
}


export interface Feature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  id: number;
  rxPtId?: number | undefined,
  type: 'Feature' | 'LineString' | 'Polygon' | 'MultiLineString' ;
  geometry: G;
  properties: P;
}

export interface DeckLine<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  id: number;
  pathIdx?: number;
  type: 'Feature';
  geometry: MultiLineString;
  // from: { coordinates: Position };
  // to: { coordinates: Position };
  properties: Partial<P>;
}

export type ComFeature = {
  type: "Feature",
  id,
  comId?: string,
  geometry: {
    type: 'Point',
    coordinates: Position
  },
  properties: {
    note: string,
    tIdx: number,
    iconColor: string,
    isShowTooltip: true,
    displayProperties: ['note', 'tIdx']
  }
}

export type ViewState = {
  longitude: number,
  latitude: number,
  zoom: number,
  maxPitch?: number,      // (45 * 0.95)
  pitch?: number,
  bearing?: number,
  padding?: any
}
