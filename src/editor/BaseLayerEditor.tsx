import React, { FC } from 'react';
import { StandardEditorProps, PluginState } from '@grafana/data';
import { PanelOptions } from '../types';
import { LayerEditor } from './LayerEditor';
import { config, hasAlphaPanels } from '../config';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions } from 'extension';

function baseMapFilter(layer: ExtendMapLayerRegistryItem): boolean {
  if (!layer.isBaseMap) {
    return false;
  }
  if (layer.state === PluginState.alpha) {
    return hasAlphaPanels;
  }
  return true;
}

export const BaseLayerEditor: FC<StandardEditorProps<ExtendMapLayerOptions, any, PanelOptions>> = ({
  value,
  onChange,
  context,
}) => {
  if (config.geomapDisableCustomBaseLayer) {
    return <div>The base layer is configured by the server admin.</div>;
  }

  return <LayerEditor options={value} eventBus={context.eventBus} data={context.data} onChange={onChange} filter={baseMapFilter} />;
};
