import { toJS, makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';
import {AggrTypes, DeckLine} from "./interfaces";
import {Point} from "geojson";
import {findChildLines} from "../utils";
import lineOffset from "@turf/line-offset";
import lineString from "turf-linestring";


function isNode(item, switchMap){

  if (typeof item === 'string') {
    const type = switchMap.get(item)?.properties.aggrType
    return (AggrTypes.includes(type))
  }
  return false
}

function getMiddleCoords(coord1, coord2) {
  return [(coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2].map(c => parseFloat(c.toFixed(6)));
}

function get2MiddleCoords(coord1, coord2) {
  const segment1 = [
    (2 * coord1[0] + coord2[0]) / 3,
    (2 * coord1[1] + coord2[1]) / 3
  ];

  const segment2 = [
    (coord1[0] + 2 * coord2[0]) / 3,
    (coord1[1] + 2 * coord2[1]) / 3
  ];

  return [segment1, segment2];
}

function CoordsConvert(subPath, switchMap) {
  return subPath.map(p=> {
    if (typeof p.item === 'string') {
      const feature = switchMap?.get(p.item)
      const geometry = feature?.geometry as Point
      const coord = geometry?.coordinates

      return coord ? coord : null
    } else if (Array.isArray(p.item)) {
      return p.item} else {return null}
  }).filter(el=>el)
}


export function segregatePath(path: any[], switchMap): any[] {
  if (path.length === 0) {return [[]]}

  const subarrays: any[] = [];
  let currentSubarray: any[] = [];

  let currType = isNode(path[0], switchMap)
  for (let i = 0; i < path.length; i++) {
    const item = path[i];

    const isIsNode = isNode(item, switchMap)
    if (isIsNode && currType !== isIsNode) {

      if (currentSubarray.length > 0) {     // at least fromPoint already exists
        currentSubarray.push({item, gIdx: i})
        subarrays.push(currentSubarray);
        currentSubarray = [];
        currType = !isIsNode
      }

    }

    currentSubarray.push({item,gIdx: i});

  }

  if (currentSubarray.length > 1) {
    subarrays.push(currentSubarray);
  }

  return subarrays;
}



class LineStore {
  root: RootStore;
  isShowLines = true;
  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
    //autorun(() => console.log('lines', toJS(this.lines)));
  }

  get getEditableLines() {
    const {getPoints, switchMap, getisOffset} = this.root.pointStore

    const initLines = getPoints.map((fromPoint: DeckLine | null) =>
    {
      if (fromPoint) {

        const {locName, parName, parPath} = fromPoint.properties
        const toPoint = parName && switchMap?.get(parName);
        const fromPointGeometry = fromPoint.geometry as Point;
        let toPointGeometry

        if (toPoint) {
          toPointGeometry = toPoint.geometry as Point;
        }

        const fromPtType = fromPoint.properties.aggrType

        const segrPath = parPath && parPath.length > 0 ? segregatePath(parPath, switchMap) : []
        const segrPathVisible = !fromPtType || !AggrTypes.includes(fromPtType) ? segrPath.filter((subarray,i) => {
          const flag1 = subarray.length===2 && isNode(subarray[0].item, switchMap) && isNode(subarray[subarray.length - 1].item, switchMap);
          const flag2 = subarray.some(el=> typeof el.item === 'string')
          return !flag1
        }) :segrPath
        const coordinates = (getisOffset || fromPtType && AggrTypes.includes(fromPtType))  ? segrPathVisible.map(subPath => CoordsConvert(subPath, switchMap)) : toPointGeometry ? [[fromPointGeometry.coordinates, toPointGeometry.coordinates]] : null
        if (!coordinates) {
          return null
        };
        const parPathFormatted = parPath?.map((el,i)=> ({item: el, gIdx: i}))
        const parPathCoords = parPath && parPath.length> 0 ? CoordsConvert(parPathFormatted, switchMap) : [{item: locName, gIdx: 0},{item:parName, gIdx: 1}]


        return {
          id: fromPoint.id,
          type: 'Feature',
          geometry: {
            type: 'MultiLineString',
            coordinates
          },
          properties: {
            ...fromPoint.properties,
            parPath: parPath && parPath.length> 0 ? [...parPath] : [locName,parName],   /// copying parPath for pathLine dragging skipping mobx
            parPathCoords,
            segrPathVisible: segrPathVisible.length> 0 ? segrPathVisible : [[{item: locName, gIdx: 0},{item:parName, gIdx: 1}]] ,
          }
        };

      } else {

        return null;
      }
    })
        .filter((e) => e !== null)

    if (!getisOffset) {return initLines}

    initLines.forEach((line) => {
      if (!line) {
        return
      }
      const {locName, aggrType, parPath} = line.properties

      const parType = (parPath && switchMap?.get(parPath[1] as string)?.properties.aggrType) ?? ''
      const isAttached = parType && AggrTypes.includes(parType)

      // offsetting parent lines only directly connected to nodes
      if (AggrTypes.includes(aggrType as string) || !isAttached) {return}

      const relLines = findChildLines({
        locName,
        lineFeatures: initLines,
      })

      if (relLines?.length < 1) {return}

      let corr = 0
      relLines.forEach((feat, index) => {
        const lineCoords = feat.geometry.coordinates
        const segrPathVisible = feat.properties.segrPathVisible
        const lastMultiLine = lineCoords[lineCoords.length-1]

        const {locName: relLocName, parPath, type} = feat.properties

        if (AggrTypes.includes(type)) {return}
        if (!parPath || (typeof parPath[parPath.length - 2] !== 'string')) {return}

        const coords = line?.geometry.coordinates
        if (coords && coords?.length>0) {
          const first = lastMultiLine[0]
          const last = line?.geometry.coordinates[0][0]
          if (first && last && relLocName !== locName) {
            const mixedLine = [first, last]
            const totalLines = relLines.length
            // skip distance 0 for main locName
            if ((index - Math.floor(totalLines / 2)) * 0.7 === 0) {corr++}
            const offsetDistance = (index + corr - Math.floor(totalLines / 2)) * 0.7
            const offsetLine = lineOffset(lineString(mixedLine), offsetDistance, {units: 'meters'});

            const [coord1, coord2] = offsetLine?.geometry?.coordinates
            const offGeom = getMiddleCoords( first, coord2)
            const off2Geom = get2MiddleCoords(coord1, coord2);
            lastMultiLine.splice(lastMultiLine.length-1, 0, off2Geom[0], off2Geom[1])
            parPath.splice(parPath.length-1, 0, off2Geom[0], off2Geom[1])
            const lastSubline = segrPathVisible[segrPathVisible.length-1]
            const lastPtCoord = lastSubline[lastSubline.length-1]
            const prevGidx = lastSubline[0].gIdx
            const items = [off2Geom[0], off2Geom[1]].map((el,i)=> ({item: el, gIdx: prevGidx+1 }))
            lastSubline.splice(lastSubline.length-1, 0, ...items )

            feat.properties.isOffset = true

          }

        }
      })

      return initLines

    })
    return initLines
  };



  get getLineSwitchMap() {
    const lineFeatures = this.getEditableLines

    const relArr = []
    lineFeatures?.forEach(point => {
      if (point?.properties) {
        relArr.push([point.properties.locName, point] as never);
      }
    });
    return new Map(relArr);
  }

  get getisShowLines() {
    return this.isShowLines;
  }

  toggleShowLines = (flag) => {
    this.isShowLines = flag;
  };


}

export default LineStore;



