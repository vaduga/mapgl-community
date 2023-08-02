import {toRGB4Array} from '../../utils';
import { PathLayer } from '@deck.gl/layers/typed';
import {DeckLine, Feature} from "../../store/interfaces";

function MyPathLayer({onHover,data, idx, type }: { data: Array<DeckLine | Feature | null>, onHover: any, idx: number, type: string}) {
    return new PathLayer({
        id: 'path-layer'+type+idx,
        data,
        pickable: true,
        //widthScale: 20,
        widthMinPixels: 2,
        capRounded: true,
        jointRounded: true,
        getDashArray: d=> [2, 2],
        getPath: d => type === 'connections' ? [d.from.coordinates, d.to.coordinates] : d.path,//d.path,
        getColor: (d) => toRGB4Array(d.properties.iconColor),
        getWidth: (d) =>{
            return d.properties.lineWidth;
        },
        onHover,

        //getSourcePosition: (d) => d.from.coordinates,
        //getTargetPosition: (d) => d.to.coordinates,

    })
}

export { MyPathLayer };
