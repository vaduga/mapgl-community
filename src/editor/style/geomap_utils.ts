import {DataFrame, GrafanaTheme2} from '@grafana/data';

import { defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions } from '../style/types';
import {getColorDimension, getScalarDimension, getScaledDimension, getTextDimension} from "../from_gr_core/features/dimensions";

export function getStyleDimension(
    frame: DataFrame | undefined,
    style: StyleConfigState,
    theme: GrafanaTheme2,
    customStyleConfig?: StyleConfig
) {
    const dims: StyleDimensions = {};
    if (customStyleConfig && Object.keys(customStyleConfig).length) {
        dims.color = getColorDimension(frame, customStyleConfig.color ?? defaultStyleConfig.color, theme);
        dims.size = getScaledDimension(frame, customStyleConfig.size ?? defaultStyleConfig.size);
        if (customStyleConfig.text && (customStyleConfig.text.field || customStyleConfig.text.fixed)) {
            dims.text = getTextDimension(frame, customStyleConfig.text!);
        }
    } else {
        if (style.fields) {
            if (style.fields.color) {
                dims.color = getColorDimension(frame, style.config.color ?? defaultStyleConfig.color, theme);
            }
            if (style.fields.size) {
                dims.size = getScaledDimension(frame, style.config.size ?? defaultStyleConfig.size);
            }
            if (style.fields.text) {
                dims.text = getTextDimension(frame, style.config.text!);
            }
        }
    }

    return dims;
}


export const isUrl = (url: string) => {
    try {
        const newUrl = new URL(url);
        return newUrl.protocol.includes('http');
    } catch (_) {
        return false;
    }
};
