import React, { useMemo } from 'react';

import { FieldConfigPropertyItem, StandardEditorProps, StandardEditorsRegistryItem, FrameMatcher } from '@grafana/data';
import {
    ScaleDimensionConfig,
    ResourceDimensionConfig,
    ColorDimensionConfig,
    TextDimensionConfig,
} from '@grafana/schema';
import {
    ColorPicker,
    Field,
    InlineField,
    InlineFieldRow,
    InlineLabel,
} from '@grafana/ui';
import { NumberValueEditor } from './from_gr_core/components/OptionsUI/number';
import { SliderValueEditor } from './from_gr_core/components/OptionsUI/slider';
import {
    ColorDimensionEditor,
    ScaleDimensionEditor,
    TextDimensionEditor,
} from './from_gr_core/features/dimensions/editors';
import { ResourceFolderName, defaultTextConfig, MediaType } from './from_gr_core/features/dimensions/types';

import {
    defaultStyleConfig,
    GeometryTypeId,
    StyleConfig,
} from './style/types';
import { styleUsesText } from './style/utils';

export interface StyleEditorOptions {
    layerInfo?: any;
    simpleFixedValues?: boolean;
    isAuxLayer?: boolean;
    displayRotation?: boolean;
    hideSymbol?: boolean;
    frameMatcher?: FrameMatcher;
}

type Props = StandardEditorProps<StyleConfig, StyleEditorOptions>;

export const StyleEditor = (props: Props) => {
    const { value, onChange, item } = props;
    // @ts-ignore
    const {isAuxLayer} = item.settings
    const context = useMemo(() => {
        if (!item.settings?.frameMatcher) {
            return props.context;
        }
        return props.context;
        //return { ...props.context, data: props.context.data.filter(item.settings.frameMatcher) };
    }, [props.context, item.settings]);

    const settings = item.settings;

    const onSizeChange = (sizeValue: ScaleDimensionConfig | undefined) => {
        onChange({ ...value, size: sizeValue });
    };

    const onColorChange = (colorValue: ColorDimensionConfig | undefined) => {
        onChange({ ...value, color: colorValue });
    };

    const onOpacityChange = (opacityValue: number | undefined) => {
        onChange({ ...value, opacity: opacityValue });
    };

    const onTextChange = (textValue: TextDimensionConfig | undefined) => {
        onChange({ ...value, text: textValue });
    };

    const onTextFontSizeChange = (fontSize: number | undefined) => {
        onChange({ ...value, textConfig: { ...value.textConfig, fontSize } });
    };


    const hasTextLabel = styleUsesText(value);
    const maxFiles = 2000;

    // Simple fixed value display
    if (settings?.simpleFixedValues) {
        return (
            <>
                <InlineFieldRow>
                    <InlineField label="Color" labelWidth={10}>
                        <InlineLabel width={4}>
                            <ColorPicker
                                color={value?.color?.fixed ?? defaultStyleConfig.color.fixed}
                                onChange={(v) => {
                                    onColorChange({ fixed: v });
                                }}
                            />
                        </InlineLabel>
                    </InlineField>
                </InlineFieldRow>
                <InlineFieldRow>
                    <InlineField label="Opacity" labelWidth={10} grow>
                        <SliderValueEditor
                            value={value?.opacity ?? defaultStyleConfig.opacity}
                            context={context}
                            onChange={onOpacityChange}
                            item={
                                {
                                    settings: {
                                        min: 0,
                                        max: 1,
                                        step: 0.1,
                                    },
                                } as FieldConfigPropertyItem
                            }
                        />
                    </InlineField>
                </InlineFieldRow>
            </>
        );
    }

    return (
        <>
            {!isAuxLayer && <Field label={'Circle size'}>
                <ScaleDimensionEditor
                    value={value?.size ?? defaultStyleConfig.size}
                    context={context}
                    onChange={onSizeChange}
                    item={
                        {
                            settings: {
                                min: 1,
                                max: 500,
                                filteredFieldType: 'number'
                            },
                        } as StandardEditorsRegistryItem
                    }
                />
            </Field>}
            <Field label={isAuxLayer ? 'Fill color' : 'Circle color'}>
                <ColorDimensionEditor
                    value={value?.color ?? defaultStyleConfig.color}
                    context={context}
                    onChange={onColorChange}
                    item={
                        {
                            settings: {
                                filteredFieldType: 'number'
                            },
                        } as StandardEditorsRegistryItem
                    }
                />
            </Field>
            <Field label={'Fill opacity'}>
                <SliderValueEditor
                    value={value?.opacity ?? defaultStyleConfig.opacity}
                    context={context}
                    onChange={onOpacityChange}
                    item={
                        {
                            settings: {
                                min: 0,
                                max: 1,
                                step: 0.1,
                            },
                        } as FieldConfigPropertyItem
                    }
                />
            </Field>
            {!isAuxLayer && <Field label={'Text label'}>
                <TextDimensionEditor
                    value={value?.text ?? defaultTextConfig}
                    context={context}
                    onChange={onTextChange}
                    item={{} as StandardEditorsRegistryItem}
                />
            </Field>}

            {hasTextLabel && (
                <>
                    <InlineFieldRow>
                        <Field label={'Font size'}>
                            <NumberValueEditor
                                value={value?.textConfig?.fontSize ?? defaultStyleConfig.textConfig.fontSize}
                                context={context}
                                onChange={onTextFontSizeChange}
                                item={{} as FieldConfigPropertyItem}
                            />
                        </Field>
                    </InlineFieldRow>
                </>
            )}
        </>
    );
};
