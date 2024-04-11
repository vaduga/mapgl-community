import {toRGB4Array} from '../../utils';
import {PolygonLayer} from '@deck.gl/layers/typed';
import {colTypes} from "../../store/interfaces";
import {flushSync} from "react-dom";
import {DARK_HULL_HIGHLIGHT, LIGHT_HULL_HIGHLIGHT} from "../../components/defaults";

const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyPolygonsLayer = (props) => {
    const {
        data,
        getSelectedFeIndexes,
        highlightColor,
        onHover,
        iconMapping = ICON_MAPPING,
        colType = colTypes.Polygons,
        getTooltipObject,
        setHoverInfo,
        setClosedHint,
        closedHint,
        hoverCluster,
        hoverInfo,
        setHoverCluster,
    setTooltipObject,
        theme2,
        isStatic,

    } = props;

    // @ts-ignore
    return new PolygonLayer({
        highlightColor,
        // Interactive props
        pickable: true,
        autoHighlight: colType !== colTypes.Hull,
        id: isStatic? colType+'-'+isStatic : colType,
        iconMapping,
        data,
        onHover: (o: any)=> {
            if (colType !== colTypes.Hull) {return onHover(o)}
            if (getTooltipObject?.object && Object.keys(getTooltipObject?.object).length) {
                return}
            if (!o.object) {setHoverInfo({});
                return}

            const features = hoverCluster?.objects ?? hoverInfo.prevHullData
            if (hoverCluster?.object) {
                const { cluster, colorCounts, annotStateCounts } = hoverCluster.object;
                o.object = { ...o.object, cluster, colorCounts, annotStateCounts };
            }

            flushSync(()=>{setHoverInfo({...o,
                prevHullData: features })
                closedHint && setClosedHint(false);})

        },
        onClick: ()=> {
            setHoverInfo({})
            setHoverCluster(null)
            setTooltipObject({});
        },
        selectedFeatureIndexes: getSelectedFeIndexes?.[colTypes.Polygons] ?? [],
        getPolygon: d => {
            return d.geometry.coordinates
        },
        getIcon: () => 'marker',
        filled: true,
        stroked: colType !== colTypes.Hull,
        // @ts-ignore
        getFillColor: (d) => {
            if (colType === colTypes.Hull) {
                return toRGB4Array(theme2.isDark ? DARK_HULL_HIGHLIGHT : LIGHT_HULL_HIGHLIGHT)
            }

            const {threshold} = d.properties
            const {color} = threshold
            return toRGB4Array(color)
        },
        extruded: false,
        // lineWidthMaxPixels: 1,
        // getLineWidth: 1,
        // getLineColor: [42, 89, 191],
        getLineWidth: (d)=> d.properties?.threshold?.lineWidth,
    });
};

export { MyPolygonsLayer };
