import React from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions } from 'types';
import { RootStoreProvider } from './utils';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import Mapgl from './components/Mapgl'
interface Props extends PanelProps<PanelOptions> {}

export const Panel: React.FC<Props> = ({ options, data, width, height, replaceVariables }) => {
  const styles = useStyles2(getStyles);

  return (
      <RootStoreProvider>
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;          
        `
      )}>

      <Mapgl options={options} data={data} width={width} height={height} replaceVariables={replaceVariables}/>

    </div>
</RootStoreProvider>

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

