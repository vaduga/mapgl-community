import {
    toRGB4Array,
    findNearbyNodes,
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {toJS} from "mobx";
import {flushSync} from "react-dom";
import {Point} from "geojson";
import {AggrTypes, colTypes} from "../../store/interfaces";


export const LinesGeoJsonLayer = (props) => {
    const {
        delComment,
        linesCollection,
        getSelectedFeIndexes,
        getEditableLines,
        setComment,
        getComments,
        setIconFeatures,
        setLineFeatures,
        getMode,
        orgId,
        switchMap,
        getPoints,
        getSelectedIp,
        zoom,
        onHover,
        isHeadMoving,
        setHeadMoving,
        highlightColor,
        editCoord,
        uid,


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
        getLineColor: (d) => {
            // @ts-ignore
            const {threshold, isInParentLine} = d.properties
            const {color,selColor} = threshold
            return toRGB4Array(isInParentLine ? selColor : color)
        },

        _subLayerProps: {
            geojson: {

                // getPointRadius: (d) =>
                //     d.properties.locName === getSelectedIp ? 10 : 5 ,
                // pointRadiusScale: 0.5,
                // pointRadiusMinPixels: 2,
                // pointRadiusMaxPixels: 8,
            },
            guides: {
                // pickable: false,
            }
        },

        // Styles

        //filled: true,
        //stroked: true,

        getEditHandlePointRadius: (d)=> {

// if (d.properties.positionIndexes.every((c,i)=> c === 0)) {return 8}

         return isHeadMoving ? 8 : 8
        }, //map.current.zoom,
        editHandlePointOutline: !isHeadMoving,
        // editHandlePointRadiusScale: 1.5,
        // editHandlePointRadiusMinPixels: 7,
        editHandlePointRadiusMaxPixels: 6,

        // Interactive props
        pickable: true,
        pickingDepth: 2,  //// 1 affects snapping not working
        autoHighlight: true,
    });
};

