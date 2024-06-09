import { toJS, makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';
import {
    AggrTypes, DeckLine, Vertices,
    ParentInfo, pEditActions,
} from "./interfaces";
import {Point} from "geojson";
import {findChildLines, hexToRgba} from "../utils";
import lineOffset from "@turf/line-offset";
import lineString from "turf-linestring";
import {parDelimiter} from "../components/defaults";
import {CoordsConvert, get2MiddleCoords, getMiddleCoords} from "../utils/utils.turf";
import {getThresholdForValue} from "../editor/Thresholds/data/threshold_processor";
import {thresholds} from "../components/Mapgl";
import {isNumber} from "lodash";
import {useTheme2} from "@grafana/ui";


function isNode(item, switchMap){

  if (typeof item === 'string') {
    const type = switchMap.get(item)?.properties.aggrType
    return (AggrTypes.includes(type))
  }
  return false
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

    if (currentSubarray.length > 0) {
        subarrays.push(currentSubarray);
    }
    return subarrays;
}


class LineStore {
  root: RootStore;
  isShowLines = true;
  vertices: Vertices = {};
  direction: "target" | "source" | undefined = "target"
  constructor(root: RootStore) {
    this.root = root;
      const isDir = ['target', 'source'].includes(root.replaceVariables('$locRole'))
      this.direction = isDir ? root.replaceVariables(`$locRole`) : "target"
    makeAutoObservable(this);
    //autorun(() => console.log('lines', toJS(this.lines)));
  }
  get getVertices() {
      return this.vertices;
  }

  setVertices = (vertices: any) => {
      this.vertices = vertices;
  }

  get getDirection() {
     return this.direction
  }

  setDirection = (direction) => {
      this.direction = direction
  }


  get getEditableLines() {
const {getPoints, switchMap, getisOffset, editCoords} = this.root.pointStore

    const {theme2} = this.root

    const features: DeckLine[] = []
    let counter = 0
      this.vertices && Object.keys(this.vertices).forEach((lkey, i) => {
          const {ptId } = this.vertices[lkey]

          const fromPoint = getPoints?.[ptId as number]
          if (!fromPoint?.properties) {return}
          const {sources} = fromPoint?.properties


          sources && Object.values(sources)?.forEach((info: ParentInfo, k)=> {
              // optional
               //const {parPath, properties: extraProps} = s

              const {locName} = fromPoint.properties
              const extraProps = info?.lineExtraProps
              let threshold
              const ownMetric = extraProps?.metric
              if (ownMetric) {
                  const fixedColor = fromPoint.properties?.style?.fixedColor
                  const hexColor = fixedColor && theme2.visualization.getColorByName(fixedColor)
                  const defaultColor = hexColor ? hexToRgba(hexColor) : undefined
                  threshold = isNumber(ownMetric) && getThresholdForValue({...fromPoint.properties, ...extraProps}, ownMetric, thresholds, defaultColor)
              }

              const parName = info.parPath?.at(-1) as string //.at(-1) as string
              // optional
                  // const parInfo = sources && sources[parName]
              const parPath = info?.parPath

              const toPoint = parName ? switchMap?.get(parName) : null;
              const fromPointGeometry = fromPoint.geometry as Point;
              let toPointGeometry

              if (toPoint) {
                  toPointGeometry = toPoint.geometry as Point;
              }
              const fromPtType = fromPoint.properties.aggrType
              const segrPath = Array.isArray(parPath) && parPath.length > 0 ? segregatePath(parPath, switchMap) : []

              const segrPathVisible = !fromPtType || !AggrTypes.includes(fromPtType) ? segrPath

                  .filter((subarray, i) => {
                  const flag1 = i !== 0 && (subarray.length === 2 && isNode(subarray[0].item, switchMap) && isNode(subarray[subarray.length - 1].item, switchMap));
                  const flag2 = subarray.some(el => typeof el.item === 'string')
                  return !flag1
              }) : segrPath

              const coordinates = (getisOffset || fromPtType && AggrTypes.includes(fromPtType)) ? segrPathVisible.filter(sp => sp.length > 1).map(subPath => CoordsConvert(subPath, switchMap)) : toPointGeometry ? [[fromPointGeometry.coordinates, toPointGeometry.coordinates]] : null
              if (!coordinates) {
                  return
              }

              const parPathFormatted = Array.isArray(parPath) && parPath?.map((el, i) => ({item: el, gIdx: i}))
              const parPathCoords = parPathFormatted && parPathFormatted?.length ? CoordsConvert(parPathFormatted, switchMap) : []

              const name = this.direction === "target" ? locName : locName//parName

              features.push(
                  {
                      id: counter, //fromPoint.id,
                      type: 'Feature',
                      geometry: {
                          type: 'MultiLineString',
                          coordinates
                      },
                      properties: {
                          ...fromPoint.properties,
                          ...extraProps,
                          ...(threshold && {threshold}),
                          locName: sources && Object.keys(sources).length === 1 ? name : name + parDelimiter + k,
                          ptId,
                          parPath: Array.isArray(parPath) ? [...parPath] : null,   /// copying parPath for pathLine dragging skipping mobx
                          parPathCoords,
                          segrPathVisible: segrPathVisible.length > 0 ? segrPathVisible : Array.isArray(parPath) ? [[{
                              item: locName,
                              gIdx: 0
                          }, {item: parPath.at(-1), gIdx: 1}]] : null,

                      }
                  })

              if (info.parPath?.length) {
                  editCoords(fromPoint, counter, pEditActions.SetLineId, parName as string)
              }
              counter++
          })


      })

    if (!getisOffset) {return features}

      features.forEach((line, i) => {
if (!line) {
    return
}
        const {locName, ptId, aggrType, parPath, isOffset} = line.properties

        const secondPoint = parPath ? parPath[1] : null
        const lastPoint =  parPath ? parPath[length-2] : null
        const parType = secondPoint ? switchMap?.get(secondPoint as string)?.properties.aggrType : ''
        const parType2 = lastPoint ? switchMap?.get(lastPoint as string)?.properties.aggrType : ''
        const isAttached = parType ? AggrTypes.includes(parType) : false
        const isAttached2 = parType2 ? AggrTypes.includes(parType2) : false

        // offsetting parent lines only directly connected to nodes
        if (aggrType && AggrTypes.includes(aggrType as string)) {return}
        if (!isAttached) {return}

        const relLines = findChildLines({
            locName: ptId ? getPoints?.[ptId]?.properties.locName : null,
            lineFeatures: features, direction: this.direction
        })

        if (relLines?.length < 1) {return}

        let corr = 0
        relLines.forEach((feat, index) => {
            const lineCoords = feat.geometry.coordinates
            const segrPathVisible = feat.properties.segrPathVisible
            const editedMultiLine = lineCoords.at(this.direction === "target" ? -1 : 0)

            const {locName: relLocName, parPath, aggrType} = feat.properties

            if (AggrTypes.includes(aggrType)) {return}

            const dirPos = this.direction === 'target' ? parPath.length - 2 : 1
            const attachedToAggrType = switchMap?.get(parPath[dirPos])?.properties.aggrType
            if (!AggrTypes.includes(attachedToAggrType as string)) {return}

            const geom = line?.geometry
            const coords = geom.coordinates
            if (coords && coords?.length>0) {
                const first = editedMultiLine[0]
                const last = coords[0].at(this.direction === "target"? 0 : -1)
                if (first && last && relLocName !== locName) {
                    const mixedLine = [first, last]
                    const totalLines = relLines.length
                    // skip distance 0 for main locName
                    if ((index - Math.floor(totalLines / 2)) * 0.7 === 0) {corr++}
                    const offsetDistance = (index + corr - Math.floor(totalLines / 2)) * 0.7
                    const offsetLine = lineOffset(lineString(mixedLine), offsetDistance, {units: 'meters'});

                const [coord1, coord2] = offsetLine?.geometry?.coordinates
                    const offGeom = getMiddleCoords( first, coord2)
                    const off2Geom = get2MiddleCoords(coord1, coord2).map(e=> e.map(c=> parseFloat(c.toFixed(6))));
                const dirPos = this.direction === 'target'? editedMultiLine.length-1 :  1
                    editedMultiLine.splice(dirPos, 0, off2Geom[0], off2Geom[1])
                    const dirPos2 = this.direction === 'target'? parPath.length-1 : 1
                    parPath.splice(dirPos2, 0, off2Geom[0], off2Geom[1])
                    const subline = segrPathVisible[this.direction === 'target'? segrPathVisible.length-1 : 0]

                    const prevGidx = subline[0].gIdx
                    const items = [off2Geom[0], off2Geom[1]].map((el,i)=> ({item: el, gIdx: prevGidx+1 }))
                    const dirPos3 = this.direction === 'target'? subline.length-1 : 1
                    subline.splice(dirPos3, 0, ...items )

                }

            }
        })



  })
      return features
  };


  get getLineSwitchMap(): Map<string, DeckLine> {
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



