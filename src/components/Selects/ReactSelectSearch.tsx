import React, {FC, useMemo, useState} from 'react';
import { observer } from 'mobx-react-lite';
import {getFirstCoordinate, useRootStore} from '../../utils';
import {searchProperties as markersSP} from "../../layers/data/markersLayer";
import {GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";
import {Select, useStyles2} from "@grafana/ui";
import {AggrTypes} from "../../store/interfaces";

type MapRefProps = {
  wait?: number;
    selectHandler: (value: any, coord: any, select: boolean, fly: boolean, lineId?: number | null) => Promise<void> | undefined;
    value?: string;
    placeholder?: string;
    aggrTypesOnly?: boolean;
    noAggrTypes?: boolean;
    isMainLocSearch?: boolean;
    total: number;
};

const ReactSelectSearch: FC<MapRefProps> = ({ selectHandler, total, wait = 300, value='',
    placeholder ='Search', aggrTypesOnly = false, noAggrTypes = false, isMainLocSearch = false,
                                              ...props
                                            }) => {
  const s = useStyles2(getStyles);
  const { pointStore, viewStore } = useRootStore();
  const { switchMap, getSelectedIp} =
    pointStore;

  const {
    setViewState
  } = viewStore;

  const selectOptions = useMemo(()=> {
     return switchMap
      ? Array.from(switchMap, ([locName, point]) => {
          const SP = [markersSP].filter(el=>el?.length).reduce((acc,cur)=> acc.concat(cur), [])
          const paneProps = SP && SP.length ? SP : []
          const nameComposite = paneProps.map(field=> point.properties[field]).join(' ')
          const firstCoord = getFirstCoordinate(point?.geometry);

        return {
          label: `${locName} ${nameComposite}`,
          value: locName,
          color: point.properties.iconColor,
          coord: firstCoord,
          aggrType: point.properties.aggrType
        };
      })
         // eslint-disable-next-line react-hooks/exhaustive-deps
      : []}, [total])

  const filteredOptions = aggrTypesOnly ? selectOptions.filter(el=>
          AggrTypes.includes(el?.aggrType as string)) : noAggrTypes ? selectOptions.filter(el=>
          !AggrTypes.includes(el?.aggrType as string)) : selectOptions

    const placeholderText = `Search: ${total}`;
   const newValue = isMainLocSearch ? getSelectedIp : value

  return (
      <Select
      virtualized
      options={filteredOptions}
      isSearchable={true}
      //defaultOptions={filteredOptions}
      value={newValue !== '' ? newValue : null}
      placeholder={placeholderText}
      onChange={(v)=> {
          selectHandler(v.value, null, true, true)
      }}
         // prefix={getPrefix(args.icon)}
        />
  );
};

export default observer(ReactSelectSearch);

const getStyles = (theme2: GrafanaTheme2) => ({

})
