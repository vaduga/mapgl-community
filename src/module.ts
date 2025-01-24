import {FieldConfigProperty, PanelPlugin} from '@grafana/data';
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
        builder.addTextInput({
            category: ['Other settings'],
                path: 'common.locLabelName',
                name: 'Location name label in alert annotation',
                //description: '',
                settings: {},
            })
            .addBooleanSwitch({
                category: ['Other settings'],
                path: 'common.isShowLegend',
                name: 'Show legend',
                defaultValue: true,
            })
            .addCustomEditor({
            category: ['Svg icons'],
            id: 'svgIconsConfig',
            path: 'svgIconsConfig',
            name: 'Svg icons',
            editor: GlobalSvgRulesEditor,
        }).addCustomEditor({
        name: 'Default thresholds to be applied to all metrics that do not have an override',
        id: 'globalThresholdsConfig',
        path: 'globalThresholdsConfig',
        description: 'for primary metric (stat1)',
        editor: GlobalThresholdEditor,
        defaultValue: [] ,
        category: ['Thresholds'],
      })


}).setDataSupport({
        annotations: true,
        alertStates: true,
    });;;

    ;
