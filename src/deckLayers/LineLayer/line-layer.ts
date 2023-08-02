import {toRGB4Array} from '../../utils';
import { LineLayer } from '@deck.gl/layers/typed';
import {DeckLine} from "../../store/interfaces";

function MyLineLayer({ onHover, highlightColor, data, type }: { data: Array<DeckLine | null>, onHover: any, highlightColor: any, type: string}) {
  return new LineLayer({
    id: 'line-layer'+type,
    data,
    pickable: true,
    onHover,
    autoHighlight: true,
    highlightColor,
    getWidth: (d) =>{
        return d.properties.lineWidth;
    },
    getSourcePosition: (d) => d.from.coordinates,
    getTargetPosition: (d) => d.to.coordinates,
    getColor: (d) => toRGB4Array(d.properties.iconColor),
  })
}

export { MyLineLayer };
