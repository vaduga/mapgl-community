import { DataFrame } from '@grafana/data';
import { ResourceDimensionConfig, ResourceDimensionMode } from '@grafana/schema';

import {DimensionSupplier, ResourceFolderName} from './types';
import { findField, getLastNotNullFieldValue } from './utils';

//---------------------------------------------------------
// Resource dimension
//---------------------------------------------------------
export function getPublicOrAbsoluteUrl(v: string): string {
    if (!v) {
        return '';
    }

    if (v.indexOf(':/') > 0) {return window.__grafana_public_path__}
    return v.startsWith(ResourceFolderName.Custom) ? v : 'public/plugins/vaduga-mapgl-panel/img/icons/'+v+'.svg';
}

