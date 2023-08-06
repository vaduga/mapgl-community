import {toRGB4Array} from '../../utils';
import { PolygonLayer } from '@deck.gl/layers/typed';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import { thresholds } from '../../layers/data/markersLayer';
import {toJS} from "mobx";
import iconAtlas from '/img/location-icon-atlas.png';
import { colTypes } from 'store/interfaces';

const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyPolygonsLayer = (props) => {
    const {
        data,
        getSelectedFeIndexes,
        getSelectedIp,
        zoom,
        onHover,
        highlightColor,
        iconMapping = ICON_MAPPING,
        colIdx
    } = props;

    // @ts-ignore
    return new PolygonLayer({
        highlightColor,
        // Interactive props
        pickable: true,
        autoHighlight: true,
        onHover,
        id: colTypes.Polygons+'-'+colIdx,
        iconAtlas,
        iconMapping,
        data,
        selectedFeatureIndexes: getSelectedFeIndexes?.[colTypes.Polygons]?.[colIdx] ?? [],
        getPolygon: d => {
            return d.geometry.coordinates
        },
        getIcon: () => 'marker',
        getFillColor: (d) => {
            const {iconColor} = d.properties
            const isSelected = d.properties.locName === getSelectedIp
            if (isSelected) {

                const selColor = getThresholdForValue(d.properties, d.properties.metricName, thresholds).selColor
                return toRGB4Array(selColor)
            }
            return toRGB4Array(iconColor)
        },
        getLineWidth: 1,


    });
};

export { MyPolygonsLayer };
