
import {
    ColorDimensionConfig,
    ResourceDimensionConfig,
    ScalarDimensionConfig,
    ScaleDimensionConfig,
    TextDimensionConfig,
} from '@grafana/schema';

import { DimensionSupplier } from './types';
import {PanelData} from "@grafana/data";

export interface DimensionContext {
    getColor(color: ColorDimensionConfig): DimensionSupplier<string>;
    getScale(scale: ScaleDimensionConfig): DimensionSupplier<number>;
    getScalar(scalar: ScalarDimensionConfig): DimensionSupplier<number>;
    getText(text: TextDimensionConfig): DimensionSupplier<string>;
    getResource(resource: ResourceDimensionConfig): DimensionSupplier<string>;
    getPanelData(): PanelData | undefined;
}
