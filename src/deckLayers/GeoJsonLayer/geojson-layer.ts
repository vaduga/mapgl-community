import {toRGB4Array} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import { thresholds } from '../../layers/data/markersLayer';
import {colTypes} from "../../store/interfaces";

const MyGeoJsonLayer = (props) => {
    const {
        data,
        getSelectedIp,
        onHover,
        highlightColor,
        colIdx
    } = props;


    return new GeoJsonLayer({
        id: colTypes.GeoJson+colIdx,
        data,
        pickable: true,
        onHover,
        autoHighlight: true,
        highlightColor,
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
        getLineWidth: (d) =>{
            return d?.properties?.lineWidth ?? 1},
        getElevation: 30
    });
};

export { MyGeoJsonLayer };
