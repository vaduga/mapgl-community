import { GrafanaTheme2 } from '@grafana/data';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';

export interface JsonConfig {
    url: string;
    attribution: string;
}

const sampleURL = 'https://wms.wheregroup.com/tileserver/style/osm-liberty.json';
export const defaultXYZConfig: JsonConfig = {
    url: sampleURL,
    attribution: `Tiles © <a href="${sampleURL}">wheregroup.com</a>`,
};

export const fromJson: ExtendMapLayerRegistryItem<JsonConfig> = {
    id: 'fromjson',
    name: 'From .json',
    isBaseMap: true,

    create: (options: ExtendMapLayerOptions<JsonConfig>, theme: GrafanaTheme2) => ({
        init: () => {
            const cfg = { ...options.config };
            if (!cfg.url) {
                cfg.url = defaultXYZConfig.url;
                cfg.attribution = cfg.attribution ?? defaultXYZConfig.attribution;
            }
            return (cfg.url);

        },
    }),

    registerOptionsUI: (builder) => {
        builder
            .addTextInput({
                path: 'config.url',
                name: 'URL template',
                description: 'Json file url',
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

export const jsonLayers = [fromJson];
