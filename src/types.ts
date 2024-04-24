import { MapCenterID } from './view';
import { ExtendMapLayerOptions } from 'extension';
import {Threshold} from "./editor/Thresholds/threshold-types";

export interface MapViewConfig {
  id: string; // placename > lookup
  lat?: number;
  lon?: number;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export const defaultView: MapViewConfig = {
  id: MapCenterID.Zero,
  lat: 0,
  lon: 0,
  zoom: 1,
};

export interface PanelOptions {
  globalThresholdsConfig: Threshold[];
  common: any;
  svgIconsConfig: any;
  view: MapViewConfig;
  basemap: ExtendMapLayerOptions;
  dataLayers: ExtendMapLayerOptions[];
  dataLayer?: ExtendMapLayerOptions | null;

}
