import {PanelPlugin} from '@grafana/data';
import { PanelOptions, defaultView} from './types';
import { Panel } from './Panel';
import { GlobalThresholdEditor } from './editor/Thresholds/GlobalThresholdEditor';
import { BaseLayerEditor } from './editor/BaseLayerEditor';
import { DataLayersEditor } from './editor/DataLayersEditor';
import { MapViewEditor } from './editor/MapViewEditor';
import { DEFAULT_BASEMAP_CONFIG } from './layers/registry';

export const plugin = new PanelPlugin<PanelOptions>(Panel)
    .setPanelOptions((builder) => {
        let category = ['Map view'];
        builder.addCustomEditor({
            category,
            id: 'view',
            path: 'view',
            name: 'Initial view', // don't show it
            description: 'This location will show when the panel first loads',
            editor: MapViewEditor,
            defaultValue: defaultView,
        });

        builder.addCustomEditor({
            category: ['Base layer'],
            id: 'basemap',
            path: 'basemap',
            name: 'Base layer',
            editor: BaseLayerEditor,
            defaultValue: DEFAULT_BASEMAP_CONFIG,
        });

        builder.addCustomEditor({
            category: ['Data layer'],
            id: 'dataLayer',
            path: 'dataLayer',
            name: 'Data layer',
            editor: DataLayersEditor,
        })


        builder.addCustomEditor({
        name: 'Global thresholds',
        id: 'globalThresholdsConfig',
        path: 'globalThresholdsConfig',
        description: 'Default thresholds to be applied to all metrics',
        editor: GlobalThresholdEditor,
        defaultValue: [] ,
        category: ['Thresholds'],
      })


});
