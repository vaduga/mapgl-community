import {
  toRGB4Array,
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {colTypes} from "../../store/interfaces";
import iconAtlas from '/img/location-icon-atlas.png';
import { CollisionFilterExtension } from '@deck.gl/extensions/typed';
const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true},
};

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
    getText: f => f.properties.locName,
    getTextAlignmentBaseline: 'bottom',
    // @ts-ignore
    getTextColor: (d) => {
      // @ts-ignore
      const {threshold} = d.properties
      const {color} = threshold
      return toRGB4Array(color)
    },
    getTextSize: 12,

    pointType: 'icon+text',
    iconAtlas,
    iconMapping: ICON_MAPPING,
    getIcon: ()=>  'marker',


   getIconSize: (d)=> {
        const isHead = getSelectedIp === d.properties?.locName
        return isHead? 10 : 8
   } ,
    iconSizeUnits: 'pixels',
    // @ts-ignore
    getIconColor: (d) => {
      // @ts-ignore
      const {threshold} = d.properties
      const {color} = threshold
      return toRGB4Array(color)
    },

      _subLayerProps: {
        "points-text": {
            extensions: [new CollisionFilterExtension()],
            collisionTestProps:
                {
                    sizeScale: 4
                }
        },
    },

    // Interactive props
    pickable: true,
    autoHighlight: true,
    }

  )};


