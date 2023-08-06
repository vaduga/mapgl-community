import {Geometry, Position, GeoJsonProperties} from 'geojson'

export type PointFeatureProperties = GeoJsonProperties & {
  locName: string;
  parentName: string;
  metricName: number;
  iconColor: string,
  colorLabel: string,
  lineWidth: number,
  [key: string]: unknown;

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
  Icons = "icons-layer",
  Lines = "lines-layer",
  Polygons = "polygons-layer",
  Path = "paths-layer",
  GeoJson = "geojson-layer",
  Text = "text-layer"
}


export interface Feature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  id: number;
  type: 'Feature' | string;
  colType?: colTypes,
  colIdx?: number,
  geometry: G;
  properties: P;
}

export interface DeckLine<P = PointFeatureProperties> {
  from: { coordinates: Position };
  to: { coordinates: Position };
  properties: Partial<P>;
}
