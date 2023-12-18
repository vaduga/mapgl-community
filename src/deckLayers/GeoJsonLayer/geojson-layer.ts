import {toRGB4Array} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {colTypes} from "../../store/interfaces";

const MyGeoJsonLayer = (props) => {
    const {
        data,
        getSelectedIp,
        onHover,
        highlightColor,
    } = props;


    return new GeoJsonLayer({
        id: colTypes.GeoJson,
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
        //@ts-ignore
        getFillColor: (d: any) => {
            const {threshold} = d.properties
            const {color} = threshold
            return toRGB4Array(color)
        },
        //@ts-ignore
        getLineColor: (d: any) => {
            const {threshold} = d.properties
            const {color,} = threshold
            return toRGB4Array(color) },
        getPointRadius: 100,
        getLineWidth: (d) =>{
            return d?.properties?.threshold?.lineWidth},
        getElevation: 30
    });
};

export { MyGeoJsonLayer };
