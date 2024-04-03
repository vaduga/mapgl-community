import React from 'react';
import {GrafanaTheme2, PluginState, StandardEditorProps} from '@grafana/data';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../extension';
import { PanelOptions } from '../types';
import { defaultMarkersConfig } from '../layers/data/markersLayer';
import { hasAlphaPanels } from 'config';
import { LayerEditor } from './LayerEditor';
import {CollapsableSection, ToolbarButton, useStyles2} from "@grafana/ui";
import _ from 'lodash';
import {css} from "@emotion/css";

function dataLayerFilter(layer: ExtendMapLayerRegistryItem): boolean {
  if (layer.isBaseMap) {
    return false;
  }
  if (layer.state === PluginState.alpha) {
    return hasAlphaPanels;
  }
  return true;
}

export const DataLayersEditor: React.FC<StandardEditorProps<ExtendMapLayerOptions[], any, PanelOptions>> = ({
  value,
  onChange,
  context,
}) => {

    const getStyles = (theme: GrafanaTheme2) => ({
        collapsible: css`
      margin-top: 5px;
      padding-left: 5px;    
      border-bottom: solid 0.001px;      
    `
    });
    const s = useStyles2(getStyles);

    const onAddLayer = () => {
        let newData: ExtendMapLayerOptions[] = value ? _.cloneDeep(value) : [];
        newData.push(defaultMarkersConfig);
        onChange(newData);
    };
    const onDeleteLayer = (index: number) => {
        let newData: ExtendMapLayerOptions[] = value ? _.cloneDeep(value) : [];
        newData.splice(index, 1);
        onChange(newData);
    };

    return (
        <>
            <div className="data-layer-add">
                <ToolbarButton icon="plus" tooltip="add new layer" variant="primary" key="Add" onClick={onAddLayer}>
                    Add Layer
                </ToolbarButton>
            </div>
            {(value || []).map((v, index) => {

                return (
                    <>
                        <CollapsableSection className={s.collapsible} label={v.name ? v.name + ' layer' : 'unnamed layer'} isOpen={false}>
                            <LayerEditor
                                options={v ? v : undefined}
                                data={context.data}
                                onChange={(cfg) => {
                                    let newData: ExtendMapLayerOptions[] = value ? _.cloneDeep(value) : [];
                                    newData[index] = cfg;
                                    onChange(newData);
                                }}
                                filter={dataLayerFilter}
                            />
                            <div className="data-layer-remove">
                                <ToolbarButton
                                    icon="trash-alt"
                                    tooltip="delete"
                                    variant="destructive"
                                    key="Delete"
                                    onClick={(e) => {
                                        onDeleteLayer(index);
                                    }}
                                >
                                    Delete
                                </ToolbarButton>
                            </div>
                        </CollapsableSection>
                    </>
                );
            })}
            </>)

}

