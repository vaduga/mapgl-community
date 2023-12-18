import {
  toRGB4Array,
  findRelatedLines,
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {FEATURE_EDIT_HANDLE_COLOR, DEFAULT_EDIT_HANDLE_COLOR} from '../../components/defaults';
import {toJS} from "mobx";
import {colTypes} from "../../store/interfaces";

export const MarkersGeoJsonLayer = (props) => {
  const {
    isVisible = true,
    featureCollection,
    getSelectedFeIndexes,
    getSelectedIp,
    onHover,
    highlightColor,
  } = props;

  return new GeoJsonLayer({
    visible: isVisible,
    highlightColor,
    onHover,
    id: colTypes.Points,
    data: featureCollection,
    selectedFeatureIndexes:   getSelectedFeIndexes?.get(colTypes.Points) ?? [],
    // @ts-ignore
    getFillColor: (d) => {
      // @ts-ignore
      const {threshold} = d.properties
      const {color} = threshold
      return toRGB4Array(color)
    },
    getPointRadius: (d) => {
      const isHead = getSelectedIp === d.properties?.locName
      return isHead? 10 : 8
    } ,
    pointRadiusScale: 0.3,
    // pointRadiusMinPixels: 2,
    // pointRadiusMaxPixels: 15,
    _subLayerProps: {
      geojson: {

      },
    },

    // Styles
    filled: true,
    stroked: false,

    // Interactive props
    pickable: true,
    autoHighlight: true,
    }

  )};


