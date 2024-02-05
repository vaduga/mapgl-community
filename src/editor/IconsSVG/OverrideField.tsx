import {AutoSizeInput, IconButton, InlineField, InlineFieldRow, Select, useStyles2} from "@grafana/ui";
import {OverField} from "./svg-types";
import React, {useState} from "react";
import {GrafanaTheme2, SelectableValue} from "@grafana/data";
import {css} from "@emotion/css";
import {FieldSelectEditor} from "./FieldSelectEditor";

interface OverrideFieldProps {
    overrideField: OverField;
    key: string;
    ID: string;

    nameTypeSetter: any;
    valueSetter: any;
    remover: any;
    index: number;
    disabled: boolean;
    context: any;
}

export const OverrideField: React.FC<OverrideFieldProps> = (options: OverrideFieldProps) => {
    const styles = useStyles2(getThresholdFieldStyles);

    if (options.context.data && options.context.data.length > 0) {
        const fields = options.context.data
            .flatMap((frame) => frame.fields)
            .map((field) => ({
                label: field.name,
                value: field.name,
                type: field.type,
            }));


        return (
            <>
            <InlineField>
                <FieldSelectEditor
                    context={options.context}
                    options={fields}
                    item={options.context.item}
                    //context={options.context}
                    value={options.overrideField.name}
                    onChange={(v) => {
                        if (typeof v === 'string') {
                            options.nameTypeSetter(options.index, v, fields.find(el=> el.value===v).type)
                        }
                    }}
                />
            </InlineField>
            <InlineField>
                <AutoSizeInput
                    minWidth={10}
                    disabled={!options.overrideField.name}
                    onInput={(v) => {
                        options.valueSetter(options.index, v.currentTarget.value);
                    }}
                    placeholder={options.overrideField.value ? options.overrideField.value : 'v1,v2...'}
                />
            </InlineField>
            <InlineField>
                <IconButton
                    disabled={options.disabled}
                    key="deleteThresholdField"
                    variant="destructive"
                    name="trash-alt"
                    tooltip="Delete Rule Field"
                    onClick={() => options.remover(options.index)}
                />
            </InlineField>
            </>
        )
    }

    return <Select onChange={() => {}} disabled={true} />


}

const getThresholdFieldStyles = (theme: GrafanaTheme2) => {
    return {
        colorPicker: css`
      padding: 0 ${theme.spacing(1)};
    `,
    };
};
