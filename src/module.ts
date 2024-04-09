import {PanelPlugin} from '@grafana/data';
import { PanelOptions, defaultView} from './types';
import { Panel } from './Panel';
import { GlobalThresholdEditor } from './editor/Thresholds/GlobalThresholdEditor';
import { BaseLayerEditor } from './editor/BaseLayerEditor';
import { DataLayersEditor } from './editor/DataLayersEditor';
import { MapViewEditor } from './editor/MapViewEditor';
import { DEFAULT_BASEMAP_CONFIG } from './layers/registry';
import {GlobalSvgRulesEditor} from "./editor/IconsSVG/GlobalSvgRulesEditor";
import {AlertsEditor} from "./editor/AlertsEditor";

export const plugin = new PanelPlugin<PanelOptions>(Panel)
    .setNoPadding()
    //.useFieldConfig()
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
            category: ['Data layers'],
            id: 'dataLayers',
            path: 'dataLayers',
            name: 'Data layers',
            editor: DataLayersEditor,
        })
        builder.addCustomEditor({
            category: ['Alerts & Annotations'],
            id: 'common',
            path: 'common',
            name: 'Alerts & Annotations',
            editor: AlertsEditor,
        })

        builder.addCustomEditor({
            category: ['Svg icons'],
            id: 'svgIconsConfig',
            path: 'svgIconsConfig',
            name: 'Svg icons',
            editor: GlobalSvgRulesEditor,
        })



        builder.addCustomEditor({
        name: 'Global thresholds',
        id: 'globalThresholdsConfig',
        path: 'globalThresholdsConfig',
        description: 'Thresholds for stat1, lines width',
        editor: GlobalThresholdEditor,
        defaultValue: [] ,
        category: ['Thresholds'],
      })


}).setDataSupport({
        annotations: true,
        alertStates: true,
    });;;

    ;
