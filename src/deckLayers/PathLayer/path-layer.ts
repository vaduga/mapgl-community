import {makeColorLighter, toRGB4Array} from '../../utils';
import { PathLayer } from '@deck.gl/layers/typed';
import {DeckLine, Feature, colTypes} from "../../store/interfaces";
import {DEFAULT_SEL_LINE_WIDTH, SEL_LINE_WIDTH_MULTIPLIER} from "../../components/defaults";
import {PathStyleExtension} from "@deck.gl/extensions";
import {toJS} from "mobx";

// @ts-ignore
function MyPathLayer({onHover, highlightColor, selFeature, data, type }: { data: [DeckLine | Feature | null], highlightColor: any, onHover: any, idx: number, type: string}) {
    // @ts-ignore
    return new PathLayer({
        id: colTypes.Path + '-'+ type,
        data,
        autoHighlight: true,
        highlightColor,
        pickable: !['par-path-extension', 'par-path-line'].includes(type),
        //widthScale: 20,
        widthMinPixels: 2,
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

        //@ts-ignore
        getColor: d => {

            let color
            switch (type) {
                case 'par-path-extension':
                    color = makeColorLighter(d[1]) //selFeature?.properties?.iconColor
                    //color = 'rgba(237, 129, 40, 1)'
                    break
                case 'par-path-line':
                    color =  makeColorLighter(d[1]) //d[1] // color
                    break
                default:
                    color =  d.properties?.threshold?.color
            }
            return Array.from(toRGB4Array(color))
        },
        widthScale: 1.1,
        getWidth: (d) => {
            const base = selFeature?.properties?.threshold?.lineWidth * SEL_LINE_WIDTH_MULTIPLIER
            switch (type) {
                case 'par-path-extension':
                    return base / 10
                    break
                case 'par-path-line':
                    return base
                    break
                default:
                    return base
            }
        },
        widthMaxPixels: 7
        ,
        onHover,
    })
}

export { MyPathLayer };
