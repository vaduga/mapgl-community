
import { TextLayer } from '@deck.gl/layers/typed';
import {toRGB4Array} from "../../utils";
import {RGBAColor} from "@deck.gl/core/utils/color";
import {colTypes} from "../../store/interfaces";
import {toJS} from "mobx";


const LineTextLayer = ({ data, type = 'nums', dir ='to'}: {data: any, type: 'nums'|'unames'|'list1'|'list2|', dir: 'from'|'to'}) => {
  const isList = ['list1','list2'].includes(type)
  return new TextLayer({
    data,
    id: colTypes.Text+'-'+type,
    getText: (d) => d.text, //d.properties.label,
    getPosition: (d) => {
      switch (type) {
        case 'unames':
          return [d.coordinates[0], d.coordinates[1] + 0.00005]
          break;
        case 'nums':
          return [d.coordinates[0], d.coordinates[1] - 0.00005]
          break;
        default:  // list1 or list2
          const [from, to] = d.coordinates
          return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
          break;
      }


    },
    getAngle: (d) => {
      return d.angle ?? 0
    }, //,
    getAlignmentBaseline: isList ? dir === 'to'? 'top' : 'bottom' : 'center',
    //anchor: top,
    getTextAnchor: isList ? 'start':'middle',
    sizeUnits: 'meters',
    sizeScale: isList ? 1 : 1.1,
    getSize: ()=> {
      switch (type) {
        case 'unames':
          return 5
          break;
        case 'nums':
          return 3
          break;
        default:  // list1 or list2
          return 2
          break;
      }
    },
    // @ts-ignore
    getColor: (d) => {
      return toRGB4Array(d.color)
    },
  });
};

export { LineTextLayer };
