import React from 'react';
import { PluginState, StandardEditorProps } from '@grafana/data';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';
import { PanelOptions } from 'types';
import { hasAlphaPanels } from 'config';
import { LayerEditor } from './LayerEditor';

function dataLayerFilter(layer: ExtendMapLayerRegistryItem): boolean {
  if (layer.isBaseMap) {
    return false;
  }
  if (layer.state === PluginState.alpha) {
    return hasAlphaPanels;
  }
  return true;
}

export const DataLayersEditor: React.FC<StandardEditorProps<ExtendMapLayerOptions, any, PanelOptions>> = ({
  value,
  onChange,
  context,
}) => {

    return (
        <>
              <LayerEditor
                     options={value ? value : undefined}
                     data={context.data}
                     onChange={(cfg) => {
                       onChange(cfg);
                     }}
                     filter={dataLayerFilter}
              />
        </>
    );

}

