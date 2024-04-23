import {toRGB4Array} from '../../utils';
import { IconLayer } from '@deck.gl/layers';
import {toJS} from "mobx";
import iconAtlas from '/img/location-icon-atlas.png';
import { colTypes } from '../../store/interfaces';

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyIconLayer = (props) => {
  const {
    data,
    getSelectedFeIndexes,
    getisShowPoints,
    onHover,
    highlightColor,
    iconMapping = ICON_MAPPING,
  } = props;

    return new IconLayer({
    visible: getisShowPoints,
    highlightColor,
    onHover,
    id: colTypes.Icons,
    iconAtlas,
    iconMapping,
    data,
    selectedFeatureIndexes: getSelectedFeIndexes?.get(colTypes.Icons) ?? [],
    getPosition: d => d.geometry.coordinates,
    getIcon: () => 'marker',
    // @ts-ignore
    getColor: (d) => {
      const {iconColor} = d.properties
      return toRGB4Array(iconColor)
        },
    getSize: (d) => 5,//d.properties.locName === getSelectedIp ? zoom * 2 : zoom * 1 ,
    sizeUnits: 'meters',
    sizeScale: 0.4,
    sizeMinPixels: 5,
    sizeMaxPixels: 45,


// Interactive props
    pickable: true,
    autoHighlight: true,
  });
};

export { MyIconLayer };
