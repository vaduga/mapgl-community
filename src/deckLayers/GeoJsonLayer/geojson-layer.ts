import {toRGB4Array} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import { thresholds } from '../../layers/data/markersLayer';
import {toJS} from "mobx";
import iconAtlas from '/img/location-icon-atlas.png';
import {Feature, PointFeatureProperties} from "../../store/interfaces";
import { Geometry } from 'geojson';

const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyGeoJsonLayer = (props) => {
    const {
        data,
        getSelectedFeIndexes,
        getSelectedIp,
        zoom,
        onHover,
        highlightColor,
        iconMapping = ICON_MAPPING,
        idx
    } = props;

    // @ts-ignore
    return new GeoJsonLayer({
        id: 'geojson-layer'+idx,
        data,
        pickable: true,
        onHover,
        stroked: false,
        filled: true,
        extruded: true,
        pointType: 'circle',
        lineWidthScale: 20,
        lineWidthMinPixels: 2,
        getFillColor: (d: any) => {
            const {iconColor} = d.properties
            const isSelected = d.properties?.locName === getSelectedIp
            if (isSelected) {

                const selColor = getThresholdForValue(d.properties, d.properties?.metricName, thresholds).selColor
                return toRGB4Array(selColor)
            }
            return toRGB4Array(iconColor)
        },//[160, 160, 180, 200],
        getLineColor: (d: any) => {
            const {iconColor} = d.properties
            const isSelected = d.properties.locName === getSelectedIp
            if (isSelected) {

                const selColor = getThresholdForValue(d.properties, d.properties?.metricName, thresholds).selColor
                return toRGB4Array(selColor)
            }
            return toRGB4Array(iconColor)      } , //[160, 160, 180, 200] ,
        getPointRadius: 100,
        getLineWidth: 1,
        getElevation: 30
    });
};

export { MyGeoJsonLayer };
