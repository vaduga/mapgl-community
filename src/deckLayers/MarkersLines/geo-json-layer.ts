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
    getEditableLines,
    getPoints,
    orgId,
    switchMap,
    setIconFeatures,
    setLineFeatures,
    lineFeatures,
    getMode,
    getSelectedIp,
    zoom,
    onHover,
    highlightColor,
    editCoord,
    uid
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
      const {threshold, isInParentLine} = d.properties
      const {selColor, color} = threshold
      return toRGB4Array(isInParentLine ? selColor : color)
    },
    getPointRadius: (d) => {
      const isHead = getSelectedIp === d.properties?.locName
      return isHead? 10 : d?.properties?.isInParentLine ? 9 : 8
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
    getEditHandlePointColor: (d) => {
      const color = FEATURE_EDIT_HANDLE_COLOR;
      return Array.from(toRGB4Array(color)) as [number, number, number, number];
    },
    getEditHandlePointRadius: 17, //  zoom / 2, //map.current.zoom,
    editHandlePointOutline: true,
    editHandlePointRadiusScale: 0.8,
    editHandlePointRadiusMinPixels: 8,
    editHandlePointRadiusMaxPixels: 20,

    // Interactive props
    pickable: true,
    pickingDepth: 0,
    autoHighlight: true,
    }

  )};


