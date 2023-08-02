import {
  GrafanaTheme2,
  RegistryItemWithOptions,
  FrameGeometrySourceMode,
  PanelOptionsEditorBuilder, PanelData
} from '@grafana/data';
import {Feature} from "./store/interfaces";

export interface MatcherConfig<TOptions = any> {
  id: string;
  options?: TOptions;
}

export enum GeojsonFrameGeometrySourceMode {
  Geojson = 'geojson',
  Auto = 'auto',
  Geohash = 'geohash',
  Coords = 'coords',
  Lookup = 'lookup',
}

export interface ExtendFrameGeometrySource {
  mode: ExtendFrameGeometrySourceMode;
  geohash?: string;
  latitude?: string;
  longitude?: string;
  h3?: string;
  wkt?: string;
  lookup?: string;
  gazetteer?: string;
  geojson?: string;
}

// eslint-disable-next-line
export const ExtendFrameGeometrySourceMode = {
  ...GeojsonFrameGeometrySourceMode,
};
// eslint-disable-next-line
export type ExtendFrameGeometrySourceMode = FrameGeometrySourceMode | GeojsonFrameGeometrySourceMode;

export interface DataLayerOptions<TConfig = any> {
  globalThresholdsConfig
  config: TConfig
}
export interface ExtendMapLayerOptions<TConfig = any> {
  geojsonColor?: string;
  geojsonLocName?: string;
  geojsonMetricName?: string;
  geojsonurl?: string;
  globalThresholdsConfig?: [];
  name?: string;
  type: string;
  locName?: string;
  parentName?: string;
  metricName?: string;
  config?: TConfig;
  location?: ExtendFrameGeometrySource;
  opacity?: number;
  query?: MatcherConfig;
  displayProperties?: string[];
  geojsonDisplayProperties?: string[] ;
  searchProperties?: string[];
  titleField?: string;
  apiKey?: string;
}

export interface ExtendMapLayerRegistryItem<TConfig = ExtendMapLayerOptions> extends RegistryItemWithOptions {
  /**
   * This layer can be used as a background
   */
  isBaseMap?: boolean;
  /**
   * Show location controls
   */
  showLocation?: boolean;
  /**
   * Show transparency controls in UI (for non-basemaps)
   */
  showOpacity?: boolean;
  /**
   * Function that configures transformation and returns points for Deck.gl render
   * @param options
   */
  pointsUp?: (data: PanelData, options: ExtendMapLayerOptions<TConfig>) =>  Promise<any[] | Feature[] | string>;
  create?: (options: ExtendMapLayerOptions<TConfig>, theme: GrafanaTheme2) => {init?: any} | undefined;
  /**
   * Show custom elements in the panel edit UI
   */
  registerOptionsUI?: (builder: PanelOptionsEditorBuilder<ExtendMapLayerOptions<TConfig>>) => void;
}
