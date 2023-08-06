import {toRGB4Array} from '../../utils';
import { PathLayer } from '@deck.gl/layers/typed';
import {colTypes, DeckLine, Feature} from "../../store/interfaces";

function MyPathLayer({onHover, highlightColor, data, colIdx, type }: { data: Array<DeckLine | Feature | null>, highlightColor: any, onHover: any, colIdx: number, type: string}) {
    return new PathLayer({
        id: colTypes.Path + '-' + type +'-'+ colIdx,
        data,
        autoHighlight: true,
        highlightColor,
        pickable: true,
        //widthScale: 20,
        widthMinPixels: 2,
        // capRounded: true,
        // jointRounded: true,
        getPath: d => {
            switch (type) {
                case 'connections':
                    return [d.from.coordinates, d.to.coordinates]
                    break
                case 'parent-path':
                    return d
                    break
                default:
                    return d.geometry.coordinates
            }
            return d.geometry.coordinates
        },
        getColor: (d) => toRGB4Array(d.properties.iconColor),
        getWidth: (d) =>{
            return d.properties.lineWidth;
        },
        onHover,
    })
}

export { MyPathLayer };
