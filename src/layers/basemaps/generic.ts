import { GrafanaTheme2 } from '@grafana/data';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';

export interface XYZConfig {
  url: string;
  attribution: string;
}

const sampleURL = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer';
export const defaultXYZConfig: XYZConfig = {
  url: sampleURL + '/tile/{z}/{y}/{x}',
  attribution: `Tiles © <a href="${sampleURL}">ArcGIS</a>`,
};

export const xyzTiles: ExtendMapLayerRegistryItem<XYZConfig> = {
  id: 'xyz',
  name: 'XYZ Tile layer',
  isBaseMap: true,

  create: (options: ExtendMapLayerOptions<XYZConfig>, theme: GrafanaTheme2) => ({
    init: () => {
      const cfg = { ...options.config };
      if (!cfg.url) {
        cfg.url = defaultXYZConfig.url;
        cfg.attribution = cfg.attribution ?? defaultXYZConfig.attribution ?? '';
      }
      if (!cfg.attribution) {
        cfg.attribution = cfg.attribution ?? defaultXYZConfig.attribution ?? '';
      }

        return (
            {
                version: 8,
                sources: {
                    xyz: {
                        type: 'raster',
                        tiles: [cfg.url],
                        tileSize: 256,
                        attribution: cfg.attribution, // singular?
                    }
                },
                layers: [
                    {
                        id: 'xyz',
                        type: 'raster',
                        source: 'xyz',
                        minzoom: 0,
                        maxzoom: 20
                    }
                ]
            }

        );

    },
  }),

  registerOptionsUI: (builder) => {
    builder
      .addTextInput({
        path: 'config.url',
        name: 'URL template',
        description: 'Must include {x}, {y} or {-y}, and {z} placeholders',
        settings: {
          placeholder: defaultXYZConfig.url,
        },
      })
      .addTextInput({
        path: 'config.attribution',
        name: 'Attribution',
        settings: {
          placeholder: defaultXYZConfig.attribution,
        },
      });
  },
};

export const genericLayers = [xyzTiles];
