import {
    toRGB4Array,
    getColorByMetric,
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";
import {flushSync} from "react-dom";
import {Feature, GeoJsonProperties, Geometry, Point} from "geojson";
import {AggrTypes, colTypes, PointFeatureProperties} from "../../store/interfaces";
import {RGBAColor} from "@deck.gl/core/utils/color";


export const LinesGeoJsonLayer = (props) => {
    const {
        linesCollection,
        getSelectedFeIndexes,
        getEditableLines,
        getMode,
        getisOffset,
        switchMap,
        getPoints,
        getSelectedIp,
        zoom,
        onHover,
        isHeadMoving,
        highlightColor,
    } = props;

    const selectedFeatureIndexes = getSelectedFeIndexes?.get(colTypes.Lines) ?? []
    const hasSelectedPt = selectedFeatureIndexes.length>0

    const allButCurrLines = [...getEditableLines]
    let currPoint = hasSelectedPt ? getEditableLines[selectedFeatureIndexes[0]] : null
    if (currPoint) {
        allButCurrLines.splice(selectedFeatureIndexes[0], 1)
    }


    return new GeoJsonLayer({
        highlightColor,
        onHover,
        id: colTypes.Lines,
        data: linesCollection,
        selectedFeatureIndexes,
        getLineWidth: (d)=> d.properties?.threshold?.lineWidth,

        // @ts-ignore
        getLineColor: (d: Feature<Geometry, PointFeatureProperties>): RGBAColor=> {
            if (!getisOffset && d.properties?.throughput ) {
                let color
                const {bandNumber, bandWidth, throughput} = d.properties
                if (bandWidth || bandNumber) {

                    let metricPercentage;
                    if (bandWidth) {
                        metricPercentage = (throughput / bandWidth) * 100;
                    } else if (bandNumber) {
                        metricPercentage = (throughput / bandNumber) * 100;
                    }

                    color = getColorByMetric(metricPercentage);
                } else {
                    // default color
                    color = getColorByMetric(101);
                }
                return toRGB4Array(color)
            }
            /// in aggr mode
            const {threshold} = d.properties
            const {color} = threshold
            return toRGB4Array(color)
        },


        // Styles

        lineWidthScale: 1,
        lineWidthMaxPixels: 2,

    // Interactive props
        pickable: true,
        autoHighlight: true,
    });
};

