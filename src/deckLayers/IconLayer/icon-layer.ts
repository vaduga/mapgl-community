import {toRGB4Array} from '../../utils';
import { IconLayer } from '@deck.gl/layers/typed';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import { metricName, thresholds } from '../../layers/data/markersLayer';
import {toJS} from "mobx";
import iconAtlas from '/img/location-icon-atlas.png';

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyIconLayer = (props) => {
  const {
    data,
    getSelectedFeIndexes,
    getSelectedIp,
    zoom,
    onHover,
    highlightColor,
    iconMapping = ICON_MAPPING,
  } = props;

  // @ts-ignore
  return new IconLayer({
    highlightColor,
    onHover,
    id: 'icon-layer',
    iconAtlas,
    iconMapping,
    data,
    selectedFeatureIndexes: getSelectedFeIndexes,
    getPosition: d => d.geometry.coordinates,
    getIcon: () => 'marker',
    getColor: (d) => {
          const {iconColor} = d.properties
          const isSelected = d.properties.locName === getSelectedIp
       if (isSelected) {

            const selColor = getThresholdForValue(d.properties, d.properties[metricName], thresholds).selColor
            return toRGB4Array(selColor)
          }
            return toRGB4Array(iconColor)
        },
    getSize: (d) => d.properties.locName === getSelectedIp ? zoom * 2 : zoom * 1 ,
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
