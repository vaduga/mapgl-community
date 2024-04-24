import React from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions } from 'types';
import {hexToRgba, RootStoreProvider} from './utils';
import { css, cx } from '@emotion/css';
import {PanelContext, PanelContextProvider, usePanelContext, useStyles2, useTheme2} from '@grafana/ui';
import Mapgl from './components/Mapgl'
interface Props extends PanelProps<PanelOptions> {}

export const Panel: React.FC<Props> = ({ options, data, width, height, replaceVariables, eventBus, onOptionsChange }) => {


  /// migration from v1.0.0 with single dataLayer object

  if (options?.dataLayer && !options?.dataLayers) {
    options.dataLayers = [options.dataLayer]
    options.dataLayer = null
  }

  const theme2 = useTheme2()
  const context = usePanelContext();
  const panelContext: PanelContext = {
    ...context,
    onToggleSeriesVisibility: undefined,
    onSeriesColorChange: (v,c)=>{
      const newOptions = {...options}
      newOptions.globalThresholdsConfig?.forEach(t=>{
        if (t.label === v) {
          const color = theme2.visualization.getColorByName(c)
          if (color) {
            t.color = hexToRgba(color)
          }
        }
      })
      eventBus?.publish({type: 'thresholdType', payload: {thresholds: newOptions.globalThresholdsConfig}})
      onOptionsChange(newOptions)
    }
  };

  return (
      <PanelContextProvider value={panelContext}>
      <RootStoreProvider props={{replaceVariables, theme2}}>



      <Mapgl {...{options, data,width, height, eventBus}}/>


</RootStoreProvider>
      </PanelContextProvider>

  );
};

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans,serif;
      position: relative;
    `
  };
}

