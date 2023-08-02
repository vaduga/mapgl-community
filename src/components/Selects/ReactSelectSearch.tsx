import React, {FC} from 'react';
import { observer } from 'mobx-react-lite';
import {getFirstCoordinate, useRootStore} from '../../utils';
import SelectSearch from 'react-select-search';
import debounce from 'debounce-promise';
import {Point} from "geojson";
import {searchProperties as geoSP} from "../../layers/data/geojsonLayer";
import {searchProperties as markersSP} from "../../layers/data/markersLayer";
import {searchProperties as pathSP} from "../../layers/data/pathLayer";
import {searchProperties as polygonsSP} from "../../layers/data/polygonsLayer";
import {GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";
import {useStyles2} from "@grafana/ui";

type MapRefProps = {
  wait?: number;
};

const ReactSelectSearch: FC<MapRefProps> = ({wait = 300,
  ...props
}) => {
  const s = useStyles2(getStyles);
  const { pointStore, viewStore } = useRootStore();
  const { switchMap, selectedIp, setSelectedIp } =
    pointStore;

  const {
    setViewState
  } = viewStore;

  const selectOptions = switchMap
      ? Array.from(switchMap, ([locName, point]) => {
        const SP = [geoSP, markersSP, pathSP, polygonsSP].filter(el=>el?.length).reduce((acc,cur)=> acc.concat(cur), [])
        const paneProps = SP && SP.length ? SP : []
        const nameComposite = paneProps.map(field=> point.properties[field]).join(' ')
        const geojsonFirstCoord = getFirstCoordinate(point?.geometry);


        return {
          name: `${locName} ${nameComposite}`,
          value: locName,
          color: point.properties.iconColor,
          coord: geojsonFirstCoord ?? (Array.isArray(point?.contour) ? point?.contour?.[0]?.[0] : undefined) ??
              // @ts-ignore
              (point?.path ? point.path[0] : undefined)
        }
      })
      : [];

  const debouncedLoadOptions = debounce(() => selectOptions, wait);

  const selectHandler = async (value, option) => {
    setSelectedIp(value);
    const [longitude, latitude] = option.coord
    setViewState({
      longitude,
      latitude,
      zoom: 16,
      transitionDuration: 350,
    });
  };

  return (

        <div style={{ width: '100%', pointerEvents: 'all' }} className={s.wrapper}>
    <SelectSearch
      options={selectOptions}
      getOptions={(query) => debouncedLoadOptions(query)}
      search
      placeholder="Search location"
      onChange={selectHandler}
      value={selectedIp}
    />
        </div>
  );
};

export default observer(ReactSelectSearch);

const getStyles = (theme2: GrafanaTheme2) => ({

  wrapper: css`
    /**
* Main wrappers
*/

     .select-search-container {
      --select-search-background: ${theme2.isDark ? '#1e1e1e' : '#fff'};
      --select-search-border: ${theme2.isDark ? '#313244' : '#dce0e8'};
      --select-search-selected: ${theme2.isDark ? '#6E9FFF' : '#4B77BE'};
      --select-search-text: ${theme2.isDark ? '#c5cade' : '#000'};
      --select-search-subtle-text: ${theme2.isDark ? '#a6adc8' : '#6c6f85'};
      --select-search-inverted-text: var(--select-search-background);
      --select-search-highlight: ${theme2.isDark ? '#383838' : '#eff1f5'};
      --select-search-font: "Inter", sans-serif;
      width: 100%;
      position: relative;
      font-family: var(--select-search-font);
      color: var(--select-search-text);
      box-sizing: border-box;
    }

    @supports (font-variation-settings: normal) {
      .select-search-container {
        --select-search-font: "Inter var", sans-serif;
      }
    }
    @media (prefers-color-scheme: dark) {
       .select-search-container {
        --select-search-background: #000;
        --select-search-border: #313244;
        --select-search-selected: #89b4fa;
        --select-search-text: #fff;
        --select-search-subtle-text: #a6adc8;
        --select-search-highlight: #1e1e2e;
      }
    }

     body.theme-light .select-search-container {
      --select-search-background: #fff;
      --select-search-border: #dce0e8;
      --select-search-selected: #1e66f5;
      --select-search-text: #000;
      --select-search-subtle-text: #6c6f85;
      --select-search-highlight: #eff1f5;
    }

     .select-search-container *,
    .select-search-container *::after,
    .select-search-container *::before {
      box-sizing: inherit;
    }

     .select-search-input {
      position: relative;
      z-index: 1;
      display: block;
      height: 2.8em;
      width: 100%;
      padding-left: 12px;
      background: var(--select-search-background);
      border: 2px solid var(--select-search-border);
      color: var(--select-search-text);
      border-radius: 3px;
      outline: none;
      font-family: var(--select-search-font);
      font-size: 0.8em;
      text-align: left;
      text-overflow: ellipsis;
      line-height: 38px;
      letter-spacing: 0.01rem;
      -webkit-appearance: none;
      -webkit-font-smoothing: antialiased;
    }

     .select-search-is-multiple .select-search-input {
      margin-bottom: -2px;
    }

     .select-search-is-multiple .select-search-input {
      border-radius: 3px 3px 0 0;
    }

     .select-search-input::-webkit-search-decoration,
    .select-search-input::-webkit-search-cancel-button,
    .select-search-input::-webkit-search-results-button,
    .select-search-input::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }

     .select-search-input[readonly] {
      cursor: pointer;
    }

     .select-search-is-disabled .select-search-input {
      cursor: not-allowed;
    }

     .select-search-container:not(.select-search-is-disabled).select-search-has-focus .select-search-input,
    .select-search-container:not(.select-search-is-disabled) .select-search-input:hover {
      border-color: var(--select-search-selected);
    }

     .select-search-select {
      background: var(--select-search-background);
      box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.15);
      border: 2px solid var(--select-search-border);
      overflow: auto;
      max-height: 360px;
    }

     .select-search-container:not(.select-search-is-multiple) .select-search-select {
      position: absolute;
      z-index: 2;
      top: 58px;
      right: 0;
      left: 0;
      border-radius: 3px;
      display: none;
    }

     .select-search-container:not(.select-search-is-multiple).select-search-has-focus .select-search-select {
      display: block;
    }

     .select-search-has-focus .select-search-select {
      border-color: var(--select-search-selected);
    }

     .select-search-options {
      list-style: none;
      padding-left: 8px;
    }

     .select-search-option,
    .select-search-not-found {
      display: block;
      height: 42px;
      width: 100%;
      padding-left: 0px;
      background: var(--select-search-background);
      border: none;
      outline: none;
      font-family: var(--select-search-font);
      color: var(--select-search-text);
      font-size: 0.8em;
      text-align: left;
      letter-spacing: 0.01rem;
      cursor: pointer;
      -webkit-font-smoothing: antialiased;
    }

     .select-search-option:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: transparent !important;
    }

     .select-search-is-highlighted,
    .select-search-option:not(.select-search-is-selected):hover {
      background: var(--select-search-highlight);
    }

     .select-search-is-selected {
      font-weight: bold;
      color: var(--select-search-selected);
    }

     .select-search-group-header {
      font-size: 0.8em;
      text-transform: uppercase;
      background: var(--select-search-border);
      color: var(--select-search-subtle-text);
      letter-spacing: 0.1rem;
      padding: 10px 16px;
    }

     .select-search-row:not(:first-child) .select-search-group-header {
      margin-top: 10px;
    }

     .select-search-row:not(:last-child) .select-search-group-header {
      margin-bottom: 10px;
    }
    `
})
