import {Geometry, Position, GeoJsonProperties} from 'geojson'

export const AggrTypes = ['node', 'connector']

export type PointFeatureProperties = GeoJsonProperties & {
  locName: string,
  colType: colTypes,
  colIdx?: number,
  aggrType?: string,
  refId: string,
  parName: string,
  parPath: [string | [number, number] ],
  metric: number,
  threshold: {thresholdLevel: number,
  color: string,
  selColor: string,
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


export interface Feature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  id: number;
  type: 'Feature' | string;
  colType?: colTypes,
  colIdx?: number,
  geometry: G;
  properties: P;
}

export interface DeckLine<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  id: number;
  type: 'Feature';
  geometry: G;
  // from: { coordinates: Position };
  // to: { coordinates: Position };
  properties: Partial<P>;
}
