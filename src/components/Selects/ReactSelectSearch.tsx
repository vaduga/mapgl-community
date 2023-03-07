import React, {FC} from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../utils';
import SelectSearch from 'react-select-search';
import debounce from 'debounce-promise';
import {Point} from "geojson";
import { useTheme } from '@grafana/ui';
import './rsearch.scss';
import {searchProperties} from "../../layers/data/markersLayer";


type MapRefProps = {
  wait?: number;
};

const ReactSelectSearch: FC<MapRefProps> = ({wait = 300,
  ...props
}) => {
  const theme = useTheme()
  const { pointStore, viewStore } = useRootStore();
  const { switchMap, selectedIp, setSelectedIp } =
    pointStore;

  const {
    setViewState
  } = viewStore;

  const selectOptions = switchMap
      ? Array.from(switchMap, ([locName, point]) => {
        const pointGeometry = point.geometry as Point
        const paneProps = searchProperties && searchProperties.length ? searchProperties : []
        const nameComposite = paneProps.map(field=> point.properties[field]).join(' ')

        return {
          name: `${locName} ${nameComposite}`,
          value: locName,
          color: point.properties.iconColor,
          coord: pointGeometry.coordinates
        };
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

  let styleMode = "select-search-container"
  styleMode +=  theme.isDark ? " is-dark-mode" : ''

  return (
      // is-dark-mode
      <div style={{width: '100%', pointerEvents: 'all'}} className={styleMode}>
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
