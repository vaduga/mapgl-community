import {toRGB4Array} from '../../utils';
import { PathLayer } from '@deck.gl/layers/typed';
import {DeckLine, Feature} from "../../store/interfaces";

function MyPathLayer({onHover, highlightColor, data, idx, type }: { data: Array<DeckLine | Feature | null>, highlightColor: any, onHover: any, idx: number, type: string}) {
    return new PathLayer({
        id: 'path-layer'+'-'+type+idx,
        data,
        autoHighlight: true,
        highlightColor,
        pickable: true,
        //widthScale: 20,
        widthMinPixels: 2,
        capRounded: true,
        jointRounded: true,
        getPath: d => type === 'connections' ? [d.from.coordinates, d.to.coordinates] : d.path,
        getColor: (d) => toRGB4Array(d.properties.iconColor),
        getWidth: (d) =>{
            return d.properties.lineWidth;
        },
        onHover,
    })
}

export { MyPathLayer };
