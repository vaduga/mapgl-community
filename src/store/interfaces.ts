import {Geometry, Position, GeoJsonProperties} from 'geojson'

export type PointFeatureProperties = GeoJsonProperties & {
  locName: string;
  parentName: string;
  iconColor: string,
  colorLabel: string,
  lineWidth: number,
  [key: string]: unknown;

};

export interface Info {
  x: number,
  y: number,
  cluster: boolean,
  object: {
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

export interface Feature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  path?: [];
  contour?: string;
  id: number;
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface DeckLine<P = PointFeatureProperties> {
  from: { coordinates: Position };
  to: { coordinates: Position };
  properties: Partial<P>;
}
