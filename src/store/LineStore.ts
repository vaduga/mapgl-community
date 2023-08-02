import { toJS, makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';
import {DeckLine} from "./interfaces";
import {Point} from "geojson";
import {getThresholdForValue} from "../editor/Thresholds/data/threshold_processor";
import {SEL_LINE_WIDTH_MULTIPLIER} from "../components/defaults";
import {metricName, thresholds} from "../layers/data/markersLayer";

class LineStore {
  root: RootStore;
  isShowLines = true;
  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
    //autorun(() => console.log('lines', toJS(this.lines)));
  }

  get getLines() {
    const res = this.root.pointStore.getPoints.map(gp=>
       gp.map((fromPoint): DeckLine | null => {
          if (fromPoint) {
            const {locName, parentName, isInParentLine, iconColor, lineWidth} = fromPoint.properties
            const metric = fromPoint.properties[metricName]
            const toPoint = this.root.pointStore.switchMap?.get(parentName);
            if (toPoint) {
              let selColor
              if (isInParentLine) {
              const threshold = getThresholdForValue(fromPoint.properties, metric as number, thresholds as [])
              selColor = threshold.selColor
              }
              const fromPointGeometry = fromPoint.geometry as Point;
              const toPointGeometry = toPoint.geometry as Point;
              return {
                from: {
                  coordinates: fromPointGeometry.coordinates,
                },
                to: {
                  coordinates: toPointGeometry.coordinates,
                },
                properties: {
                  locName,
                  isInParentLine,
                  lineWidth: isInParentLine ? lineWidth * SEL_LINE_WIDTH_MULTIPLIER : lineWidth,
                  iconColor: selColor ?? iconColor,
                }
              };

            } else {


              return null} } else {

            return null;
          }
        }).filter((e) => e !== null)
    )
    return res
  };

  // get getpLines() {
  //   const res = this.root.pointStore.pLinePoints.map(plp=> {
  //     plp?.map((fromPoint): DeckLine | null => {
  //         if (fromPoint) {
  //           const {parentName, isInParentLine, iconColor, lineWidth} = fromPoint.properties
  //           const metric = fromPoint.properties[metricName]
  //           const toPoint = this.root.pointStore.switchMap?.get(parentName);
  //           if (toPoint) {
  //             let selColor
  //             if (isInParentLine) {
  //               const threshold = getThresholdForValue(fromPoint.properties, metric as number, thresholds as [])
  //               selColor = threshold.selColor
  //             }
  //             const fromPointGeometry = fromPoint.geometry as Point;
  //             const toPointGeometry = toPoint.geometry as Point;
  //             return {
  //               from: {
  //                 coordinates: fromPointGeometry.coordinates,
  //               },
  //               to: {
  //                 coordinates: toPointGeometry.coordinates,
  //               },
  //               properties: {
  //                 isInParentLine,
  //                 lineWidth: isInParentLine ? DEFAULT_SEL_LINE_WIDTH : lineWidth,
  //                 iconColor: selColor ?? iconColor,
  //               }
  //             };
  //
  //           } else {
  //
  //
  //             return null} } else {
  //
  //           return null;
  //         }
  //       })
  //       .filter((e) => e !== null);
  //   })
  //   return res
  // }

  get getisShowLines() {
    return this.isShowLines;
  }
  toggleShowLines = (flag) => {
    this.isShowLines = flag;
  };

}

export default LineStore;
