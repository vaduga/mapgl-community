import { Registry, GrafanaTheme2 } from '@grafana/data';
import { carto } from './basemaps/carto';
import { config } from '../config';
import { basemapLayers } from './basemaps';
import { dataLayers } from './data';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions } from '../extension';

export const DEFAULT_BASEMAP_CONFIG: ExtendMapLayerOptions = {
  type: 'default',
  config: {},
};

// Default base layer depending on the server setting
export const defaultBaseLayer: ExtendMapLayerRegistryItem = {
  id: DEFAULT_BASEMAP_CONFIG.type,
  name: 'Default base layer',
  isBaseMap: true,

  create: (options: ExtendMapLayerOptions, theme: GrafanaTheme2) => {
    const serverLayerType = config?.geomapDefaultBaseLayerConfig?.type;
    if (serverLayerType) {
      const layer = geomapLayerRegistry.getIfExists(serverLayerType) ;
      console.log('create/?')
      if (!layer) {
        throw new Error('Invalid basemap configuraiton on server');
      }
      return layer && layer.create ? layer.create(config.geomapDefaultBaseLayerConfig!, theme) : {};
    }

    // For now use carto as our default basemap
    return carto && carto.create ? carto.create(options, theme) : {}
  },
};

/**
 * Registry for layer handlers
 */
export const geomapLayerRegistry = new Registry<ExtendMapLayerRegistryItem<any>>(() => [
  defaultBaseLayer,
  ...basemapLayers, // simple basemaps
  ...dataLayers, // Layers with update functions
]);
