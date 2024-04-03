import React, {FC, useCallback, useMemo} from 'react';
import { Select } from '@grafana/ui';
import {
    DataFrame,
    PanelOptionsEditorBuilder,
    StandardEditorContext,
    FieldType,
    Field, StandardEditorProps,
} from '@grafana/data';
import { OptionsPaneCategoryDescriptor } from './PanelEditor/OptionsPaneCategoryDescriptor';
import { setOptionImmutably } from './PanelEditor/utils';
import { fillOptionsPaneItems } from './PanelEditor/getVizualizationOptions';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions, ExtendFrameGeometrySourceMode } from '../extension';
import { FrameSelectionEditor } from './FrameSelectionEditor';
import {getQueryFields} from "./getQueryFields";
import {PanelOptions} from "../types";

export interface LayerEditorProps<TConfig = any> {
    options?: ExtendMapLayerOptions<TConfig>;
    data: DataFrame[]; // All results
    onChange: (options: ExtendMapLayerOptions<TConfig>) => void;
    // filter: (item: ExtendMapLayerRegistryItem) => boolean;
}

export const AlertsEditor: FC<StandardEditorProps<ExtendMapLayerOptions, any, PanelOptions>> = ({
                                                                                                    value,
                                                                                                    onChange,
                                                                                                    context,
                                                                                                }) => {
    const options=value
    const data=context.data
    const optionsEditorBuilder = useMemo(() => {
        const builder = new PanelOptionsEditorBuilder<ExtendMapLayerOptions>();
        builder
            .addTextInput({
                path: 'locLabelName',
                name: 'Location name label in alert annotation',
                //description: '',
                settings: {},
            })

        return builder;

    }, []);

    // The react components
    const layerOptions = useMemo(() => {
        if (!optionsEditorBuilder) {
            return null;
        }

        const defaultOptions = {
            locLabelName: 'instance'
        }

        const category = new OptionsPaneCategoryDescriptor({
            id: 'Layer config',
            title: 'Layer config',
        });

        const context: StandardEditorContext<any> = {
            data,
            options: options,
        };

        const currentOptions = { ...defaultOptions, ...options   };

        // Update the panel options if not set
        if (!options) {
            onChange(currentOptions as any);
        }

        const reg = optionsEditorBuilder.getRegistry();

        // Load the options into categories
        fillOptionsPaneItems(
            reg.list(),

            // Always use the same category
            (categoryNames) => category,

            // Custom update function
            (path: string, value: any) => {
                onChange(setOptionImmutably(currentOptions, path, value) as any);
            },
            context
        );

        return (
            <>
                <br />
                {category.items.map((item) => item.render())}
            </>
        );
    }, [optionsEditorBuilder, onChange, data, options]);


    return (
        <div>
            {layerOptions}
        </div>
    );
};
