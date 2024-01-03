import {Geometry, Position, GeoJsonProperties} from 'geojson'
import {MultiLineString} from "@turf/helpers";

export const AggrTypes = ['node', 'connector']

export type CoordRef = string | Position


export type LineExtraProps = {
  isShowTooltip?: boolean | undefined,
  displayProps?: string[] | [],
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
  threshold: {thresholdLevel: number,
  color: string,
  lineWidth: number,
  label: string},
  [key: string]: unknown
};

export interface Info {
  layer?: any;
  x: number,
  y: number,
  cluster: boolean,
  object: {
    isShowTooltip: Boolean;
    cluster: boolean,
    colorCounts?: { [color: string]: { count: number, label: string } }
    properties?: any
  }
  objects: []
}

export interface DeckFeature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {

  id: number;
  coordinates: Position;
  properties: P;
}

export enum colTypes {
  Icons = "icons",
  Points = "markers",
  Lines = "edit-lines",
  Polygons = "polygons",
  Path = "path",
  GeoJson = "geojson",
  Text = "text"
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
  comId: string,
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
  maxPitch: number,      // (45 * 0.95)
  pitch?: number,
  bearing?: number,
  padding?: any
}
