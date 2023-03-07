import React, { FC, useMemo, useCallback } from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { Button, InlineField, InlineFieldRow, Select, VerticalGroup } from '@grafana/ui';
import { PanelOptions, MapViewConfig } from '../types';
import { centerPointRegistry, MapCenterID } from '../view';
import { NumberInput } from './NumberInput';
import { lastMapPanelInstance } from '../components/Mapgl';

export const MapViewEditor: FC<StandardEditorProps<MapViewConfig, any, PanelOptions>> = ({
  value,
  onChange,
  context,
}) => {

  const labelWidth = 10;

  const views = useMemo(() => {
    const ids: string[] = [];
    if (value?.id) {
      ids.push(value.id);
    } else {
      ids.push(centerPointRegistry.list()[0].id);
    }
    return centerPointRegistry.selectOptions(ids);
  }, [value?.id]);

  const onSetCurrentView = useCallback(() => {
    const map = lastMapPanelInstance;
    if (map) {

      const center = map.getCenter();
      const zoom = map.getZoom();
      if (center && zoom) {

        const {lng: longitude, lat: latitude} = center
        onChange({
          ...value,
          id: MapCenterID.Coordinates,
          lon: +longitude.toFixed(6),
          lat: +latitude.toFixed(6),
          zoom: +zoom.toFixed(2),
        });
      }
    }
  }, [value, onChange]);


  const onSelectView = useCallback(
    (selection: SelectableValue<string>) => {
      const v = centerPointRegistry.getIfExists(selection.value);
      if (v && v.id !== MapCenterID.Auto) {
        onChange({
          ...value,
          id: v.id,
          lat: v.lat ?? value?.lat,
          lon: v.lon ?? value?.lon,
          zoom: v.zoom ?? value?.zoom,
        });
      } else if (v && v.id === MapCenterID.Auto) {

              onChange({
                ...value,
                id: v.id,
                // lon: +longitude.toFixed(6),
                // lat: +latitude.toFixed(6),
                // zoom: +zoom.toFixed(0),
              });
      }
    },
    [value, onChange]
  );

  return (
    <>
      <InlineFieldRow>
        <InlineField label="View" labelWidth={labelWidth} grow={true}>
          <Select menuShouldPortal options={views.options} value={views.current} onChange={onSelectView} />
        </InlineField>
      </InlineFieldRow>
      {value?.id === MapCenterID.Coordinates && (
        <>
          <InlineFieldRow>
            <InlineField label="Latitude" labelWidth={labelWidth} grow={true}>
              <NumberInput
                value={value.lat}
                min={-90}
                max={90}
                step={0.001}
                onChange={(v) => {
                  onChange({ ...value, lat: v });
                }}
              />
            </InlineField>
          </InlineFieldRow>
          <InlineFieldRow>
            <InlineField label="Longitude" labelWidth={labelWidth} grow={true}>
              <NumberInput
                value={value.lon}
                min={-180}
                max={180}
                step={0.001}
                onChange={(v) => {
                  onChange({ ...value, lon: v });
                }}
              />
            </InlineField>
          </InlineFieldRow>
        </>
      )}

      <InlineFieldRow>
        <InlineField label="Zoom" labelWidth={labelWidth} grow={true}>
          <NumberInput
            value={value?.zoom ?? 1}
            min={1}
            max={18}
            step={0.01}
            onChange={(v) => {
              onChange({ ...value, zoom: v });
            }}
          />
        </InlineField>
      </InlineFieldRow>

      <VerticalGroup>
        <Button variant="secondary" size="sm" fullWidth onClick={onSetCurrentView}>
          <span>Use current map settings</span>
        </Button>
      </VerticalGroup>
    </>
  );
};
