import React from 'react';

import {DataFrame, RegistryItem, FieldMatcherInfo, Field, IconName} from '@grafana/data';
import {getFieldTypeIconName} from "@grafana/ui";

export interface FieldMatcherUIRegistryItem<TOptions> extends RegistryItem {
    component: React.ComponentType<MatcherUIProps<TOptions>>;
    matcher: FieldMatcherInfo<TOptions>;
    /* Maps matcher options to human-readable label */
    optionsToLabel: (options: TOptions) => string;
}

export interface MatcherUIProps<T> {
    matcher: FieldMatcherInfo<T>;
    id?: string;
    data: DataFrame[];
    options: T;
    onChange: (options: T) => void;
}

/**
 * Get the icon for a given field
 */
export function getFieldTypeIcon(field?: Field): IconName {
    return getFieldTypeIconName(field?.type);
}

