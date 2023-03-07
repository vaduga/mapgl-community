import {toRGB4Array} from '../../utils';
import { LineLayer } from '@deck.gl/layers/typed';
import {DeckLine} from "../../store/interfaces";

function MyLineLayer({ data }: { data: Array<DeckLine | null>}) {
  return new LineLayer({
    id: 'line-layer',
    data,
    pickable: false,
    getWidth: (d) =>{
        return d.properties.lineWidth;
    },
    getSourcePosition: (d) => d.from.coordinates,
    getTargetPosition: (d) => d.to.coordinates,
    getColor: (d) => toRGB4Array(d.properties.iconColor),
  })
}

export { MyLineLayer };
