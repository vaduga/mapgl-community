import {findClosestAnnotations, makeColorDarker, makeColorLighter, toRGB4Array} from '../../utils';
import { PathLayer } from '@deck.gl/layers';
import {DeckLine, Feature, colTypes} from "../../store/interfaces";
import {ALERTING_STATES, SEL_LINE_WIDTH_MULTIPLIER} from "../../components/defaults";
import {PathStyleExtension} from "@deck.gl/extensions";
import {toJS} from "mobx";

// @ts-ignore
function MyPathLayer(props)   {
    const {onHover, highlightColor, getSelFeature, data, type, theme2, time } = props

    // @ts-ignore
    return new PathLayer({
        id: colTypes.Path + '-'+ type,
        data,
        autoHighlight: true,
        highlightColor,
        pickable: !['par-path-extension', 'par-path-line'].includes(type),
        //widthScale: 20,
        widthMinPixels: 1,
        capRounded: true,
        jointRounded: true,
        getPath: (d) => {
            switch (type) {
                case 'par-path-extension':
                    return d[0] //.geometry.coordinates.reduce((acc,cur)=> acc.concat(cur), [])//d
                    break
                case 'par-path-line':
                    return d[0] // coords
                    break
                default:
                    return d.geometry.coordinates
            }
        },
        getDashArray: type === 'par-path-extension' ? [5, 8] : null,
        dashJustified: true,
        dashGapPickable: true,
        //@ts-ignore
        extensions: [new PathStyleExtension({dash: true})],

        getColor: d => {

            let color
            switch (type) {
                case 'par-path-extension':
                    color = theme2.isDark ? makeColorLighter(d[1]) : makeColorDarker(d[1])//selFeature?.properties?.iconColor
                    //color = 'rgba(237, 129, 40, 1)'
                    break
                case 'par-path-line':
                    color =  theme2.isDark ? makeColorLighter(d[1]) : makeColorDarker(d[1])//d[1] // color
                    break
                default:
                    const {threshold} = d.properties
                    color = threshold.color

                const opacity = d.properties?.style?.opacity
                    const rgb4 = toRGB4Array(color)
                    if (opacity) {
                        rgb4[3] = Math.round(opacity * 255);
                    }

                    return rgb4


            }
            return toRGB4Array(color)
        },
        widthScale: 1.1,
        getWidth: (d) => {
            switch (type) {
                case 'par-path-extension':
                    return d[2] * SEL_LINE_WIDTH_MULTIPLIER
                    break
                case 'par-path-line':
                    return d[2] * SEL_LINE_WIDTH_MULTIPLIER
                    break
                default:
                    return d?.properties?.threshold?.lineWidth ?? 1
            }
        },
        onHover,
    })
}

export { MyPathLayer };
