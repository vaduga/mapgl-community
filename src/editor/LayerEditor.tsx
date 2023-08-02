import React, {FC, useCallback, useMemo} from 'react';
import { Select } from '@grafana/ui';
import {
  DataFrame,
  PanelOptionsEditorBuilder,
  StandardEditorContext,
  FieldType,
  Field, SelectableValue,
} from '@grafana/data';
import { DEFAULT_BASEMAP_CONFIG, geomapLayerRegistry } from '../layers/registry';
import { OptionsPaneCategoryDescriptor } from './PanelEditor/OptionsPaneCategoryDescriptor';
import { setOptionImmutably } from './PanelEditor/utils';
import { fillOptionsPaneItems } from './PanelEditor/getVizualizationOptions';
import { GazetteerPathEditor } from './GazetteerPathEditor';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions, ExtendFrameGeometrySourceMode } from '../extension';
import { FrameSelectionEditor } from './FrameSelectionEditor';
import {getQueryFields} from "./getQueryFields";
import {DEFAULT_OK_COLOR_RGBA} from "../components/defaults";

export interface LayerEditorProps<TConfig = any> {
  options?: ExtendMapLayerOptions<TConfig>;
  data: DataFrame[]; // All results
  onChange: (options: ExtendMapLayerOptions<TConfig>) => void;
  filter: (item: ExtendMapLayerRegistryItem) => boolean;
}

export const LayerEditor: FC<LayerEditorProps> = ({ options, onChange, data, filter }) => {

  // all basemaps
  const layerTypes = useMemo(() => {
    return geomapLayerRegistry.selectOptions(
      options?.type // the selected value
        ? [options.type] // as an array
        : [DEFAULT_BASEMAP_CONFIG.type],
      filter
    );
  }, [options?.type, filter]);

  const getGeoJsonProps = useCallback(async (e)=> {
    if (!options?.geojsonurl) {return []}
    const url = options?.geojsonurl
    if (!url) {return}

    let ds = await fetch(url, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      },
    }).catch((er) => {
      console.log(er);
    })
    if (!ds) {return []}
    let geoData = await ds.json()
    return Object.keys(geoData.features[0].properties).map(el=> ({value: el, label: el} ))
  }, [options?.geojsonurl])

  // The options change with each layer type
  const optionsEditorBuilder = useMemo(() => {
    const layer = geomapLayerRegistry.getIfExists(options?.type);
    if (!layer || !(layer.registerOptionsUI || layer.showLocation || layer.showOpacity )) {
      return null;
    }

    const builder = new PanelOptionsEditorBuilder<ExtendMapLayerOptions>();

    if (layer.showLocation) {
      builder
         .addTextInput({
            path: 'name',
            name: 'Layer name',
            //description: '',
            settings: {},
          })
        .addCustomEditor({
          id: 'query',
          path: 'query',
          name: 'Query',
          editor: FrameSelectionEditor,
          defaultValue: undefined,
          showIf: (opts) => opts.type !== 'geojson',
        })
        .addRadio({
          path: 'location.mode',
          name: 'Location',
          description: '',
          defaultValue: ExtendFrameGeometrySourceMode.Auto,
          settings: {
            options: [
              { value: ExtendFrameGeometrySourceMode.Auto, label: 'Auto' },
              { value: ExtendFrameGeometrySourceMode.Coords, label: 'Coords' },
              { value: ExtendFrameGeometrySourceMode.Geohash, label: 'Geohash' },
              { value: ExtendFrameGeometrySourceMode.Lookup, label: 'Lookup' },
              { value: ExtendFrameGeometrySourceMode.Geojson, label: 'Geojson' },
            ],
          },
          showIf: (opts) => opts.type !== 'geojson',
        })
        .addFieldNamePicker({
          path: 'location.geojson',
          name: 'Geojson field',
          // settings: {
          //   filter: (f: Field) => f.type === FieldType.other,
          //   noFieldsMessage: 'No strings fields found',
          // },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Geojson,
        })
        .addFieldNamePicker({
            path: 'location.longitude',
            name: 'Longitude field',
            settings: {
              filter: (f: Field) => f.type === FieldType.number,
              noFieldsMessage: 'No numeric fields found',
            },
            showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Coords,
          })
        .addFieldNamePicker({
          path: 'location.latitude',
          name: 'Latitude field',
          settings: {
            filter: (f: Field) => f.type === FieldType.number,
            noFieldsMessage: 'No numeric fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Coords,
        })
        .addFieldNamePicker({
          path: 'location.geohash',
          name: 'Geohash field',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No strings fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Geohash,
          // eslint-disable-next-line react/display-name
          // info: (props) => <div>HELLO</div>,
        })
        .addFieldNamePicker({
          path: 'location.lookup',
          name: 'Lookup field',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No strings fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Lookup,
        })
        .addCustomEditor({
          id: 'gazetteer',
          path: 'location.gazetteer',
          name: 'Gazetteer',
          editor: GazetteerPathEditor,
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Lookup,
        })
          .addFieldNamePicker({
            path: 'locName',
            name: 'Location name field',
            settings: {
              filter: (f: Field) => f.type === FieldType.string,
              noFieldsMessage: 'No string fields found',
            },
            showIf: (opts) => opts.type !== 'geojson',
          })
          .addSelect({
            path: 'geojsonLocName',
            name: 'Location name GeoJson property',
            //description: 'Select location name from GeoJson properties',
            settings: {
              allowCustomValue: true,
              options: [],
              placeholder: 'GeoJson properties',
              //@ts-ignore
              getOptions: getGeoJsonProps
            },
            showIf: (opts) => opts.type === 'geojson',
            defaultValue: '',
          })
          .addFieldNamePicker({
            path: 'parentName',
            name: 'Parent name field',
            settings: {
              filter: (f: Field) => f.type === FieldType.string,
              noFieldsMessage: 'No string fields found',
            },
            showIf: (opts) => opts.type === 'markers',
          })
          .addFieldNamePicker({
            path: 'metricName',
            name: 'Metric name field',
            settings: {
              filter: (f: Field) => f.type === FieldType.number,
              noFieldsMessage: 'No number fields found',
            },
            showIf: (opts) => opts.type !== 'geojson',
          })
          .addColorPicker({
            path: 'geojsonColor',
      name: 'Default GeoJson Color',
      //defaultValue :  [255, 0, 0, 1], //DEFAULT_OK_COLOR_RGBA,
                showIf: (opts) => opts.type === 'geojson',
              }
          )
           .addSelect({
            path: 'geojsonMetricName',
            name: 'Metric name GeoJson property',
            description: 'Select Metric GeoJson property with numeric values',
            settings: {
              allowCustomValue: true,
              options: [],
              placeholder: 'GeoJson properties',
              //@ts-ignore
              getOptions: getGeoJsonProps,
              showIf: (opts) => opts.type === 'geojson',
            }})
        .addMultiSelect({
          path: 'displayProperties',
          name: 'Tooltip properties',
          description: 'Select properties to be displayed',
          settings: {
            allowCustomValue: false,
            options: [],
            placeholder: 'All Properties',
            getOptions: getQueryFields,
          },
          showIf: (opts) => opts.type !== 'geojson',
          //showIf: (opts) => typeof opts.query !== 'undefined',
          defaultValue: '',
        })
          .addTextInput({
            path: 'geojsonurl',
            name: 'GeoJson Url',
            description: 'Url to a file with valid GeoJSON FeatureCollection object',
            settings: {},
            showIf: (opts) => opts.type === 'geojson',
          })
          .addMultiSelect({
            path: 'geojsonDisplayProperties',
            name: 'Tooltip properties',
            description: 'Select properties to be displayed from GeoJson properties',
            settings: {
              allowCustomValue: true,
              options: [],
              placeholder: 'All Properties',
              //@ts-ignore
              getOptions: getGeoJsonProps
            },
            showIf: (opts) => opts.type === 'geojson',
            defaultValue: '',
          })
          .addMultiSelect({
            path: 'searchProperties',
            name: 'Search by',
            description: 'Select properties for search options',
            settings: {
              allowCustomValue: false,
              options: [],
              placeholder: 'Search by location name only',
              getOptions: getQueryFields,
            },
            showIf: (opts) => opts.type === 'markers',
            //showIf: (opts) => typeof opts.query !== 'undefined',
            defaultValue: '',
          })
    }
    if (layer.registerOptionsUI) {
      layer.registerOptionsUI(builder);
    }
    return builder;

  }, [options?.type, getGeoJsonProps]);

  // The react components
  const layerOptions = useMemo(() => {
    const layer = geomapLayerRegistry.getIfExists(options?.type);
    if (!optionsEditorBuilder || !layer) {
      return null;
    }

    const category = new OptionsPaneCategoryDescriptor({
      id: 'Layer config',
      title: 'Layer config',
    });

    const context: StandardEditorContext<any> = {
      data,
      options: options,
    };

    const currentOptions = { ...options, type: layer.id, config: { ...layer.defaultOptions, ...options?.config } };

    // Update the panel options if not set
    if (!options || (layer.defaultOptions && !options.config)) {
      onChange(currentOptions as any);
    }

    const reg = optionsEditorBuilder.getRegistry();

    // Load the options into categories
    fillOptionsPaneItems(
      reg.list(),

      // Always use the same category
      (categoryNames) => category,

      // Custom update function
      (path: string, value: any) => {
        onChange(setOptionImmutably(currentOptions, path, value) as any);
      },
      context
    );

    return (
      <>
        <br />
        {category.items.map((item) => item.render())}
      </>
    );
  }, [optionsEditorBuilder, onChange, data, options]);

  return (
    <div>
      <Select
        menuShouldPortal
        options={layerTypes.options}
        value={layerTypes.current}
        onChange={(v) => {
          const layer = geomapLayerRegistry.getIfExists(v.value);
          if (!layer) {
            console.warn('layer does not exist', v);
            return;
          }

          onChange({
            ...options, // keep current options
            type: layer.id,
            config: { ...layer.defaultOptions }, // clone?
          });
        }}
      />

      {layerOptions}
    </div>
  );
};
