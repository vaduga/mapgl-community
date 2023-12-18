import {toRGB4Array} from '../../utils';
import { PolygonLayer } from '@deck.gl/layers/typed';
import {colTypes} from "../../store/interfaces";

const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyPolygonsLayer = (props) => {
    const {
        data,
        getSelectedFeIndexes,
        onHover,
        highlightColor,
        iconMapping = ICON_MAPPING,
    } = props;

    // @ts-ignore
    return new PolygonLayer({
        highlightColor,
        // Interactive props
        pickable: true,
        autoHighlight: true,
        onHover,
        id: colTypes.Polygons,
        iconMapping,
        data,
        selectedFeatureIndexes: getSelectedFeIndexes?.[colTypes.Polygons] ?? [],
        getPolygon: d => {
            return d.geometry.coordinates
        },
        getIcon: () => 'marker',
        // @ts-ignore
        getFillColor: (d) => {
            const {threshold} = d.properties
            const {color} = threshold
            return toRGB4Array(color)
        },
        getLineWidth: (d)=> d.properties?.threshold?.lineWidth,
    });
};

export { MyPolygonsLayer };
