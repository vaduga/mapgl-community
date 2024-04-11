import { Style } from 'ol/style';

import {
    ColorDimensionConfig,
    ResourceDimensionConfig,
    ResourceDimensionMode,
    ScaleDimensionConfig,
    ScalarDimensionConfig,
    ScalarDimensionMode,
    TextDimensionConfig,
} from '@grafana/schema';
import { DimensionSupplier } from '../from_gr_core/features/dimensions';

export enum GeometryTypeId {
    Point = 'point',
    Line = 'line',
    Polygon = 'polygon',
    Any = '*any*',
}

// StyleConfig is saved in panel json and is used to configure how items get rendered
export interface StyleConfig {
    color?: ColorDimensionConfig;
    opacity?: number; // defaults to 80%

    // For non-points
    lineWidth?: number;

    // Used for points and dynamic text
    size?: ScaleDimensionConfig;

    // Can show markers and text together!
    text?: TextDimensionConfig;
    textConfig?: TextStyleConfig;

    // Allow for rotation of markers
    rotation?: ScalarDimensionConfig;
}

export const DEFAULT_SIZE = 10;


export const defaultStyleConfig = Object.freeze({
    size: {
        fixed: DEFAULT_SIZE,
        min: 10,
        max: 30,
    },
    color: {
        fixed: 'dark-green', // picked from theme
    },
    opacity: 0.4,
    textConfig: {
        fontSize: 14,
    },

});


/**
 * Static options for text display.  See:
 * https://openlayers.org/en/latest/apidoc/module-ol_style_Text.html
 */
export interface TextStyleConfig {
    fontSize?: number;
}

// Applying the config to real data gives the values
export interface StyleConfigValues {
    color: string;
    opacity?: number;
    lineWidth?: number;
    size?: number;
    text?: string;

    // Pass though (not value dependant)
    textConfig?: TextStyleConfig;
}


/** When the style depends on a field */
export interface StyleConfigFields {
    color?: string;
    size?: string;
    text?: string;
}

export interface StyleDimensions {
    color?: DimensionSupplier<string>;
    size?: DimensionSupplier<number>;
    text?: DimensionSupplier<string>;
}

export interface StyleConfigState {
    config: StyleConfig;
    hasText?: boolean;
    base: StyleConfigValues;
    fields?: StyleConfigFields;
    dims?: StyleDimensions;
}

/**
 * Given values create a style
 */
export type StyleMaker = (values: StyleConfigValues) => Style | Style[];
