import {autorun, makeAutoObservable, toJS} from 'mobx';
import RootStore from './RootStore';
import {Feature, Info} from './interfaces';

class PointStore {
  root: RootStore;
  points: Array<Feature | null> = [];
  pLinePoints: { actual: Array<Feature | null >; prev: Array<Feature | null > } = {
    actual: [],
    prev: [],
  };
  isShowCluster = true;
  selectedIp = '';
  tooltipObject: Info = {
  x: -3000,
  y: -3000,
  cluster: false,
  object: {
    cluster: false
  },
  objects: []
}

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
    //autorun(() => console.log('auto points', toJS(this.points)));
  }

  get getTooltipObject() {
    return this.tooltipObject;
  }
  setTooltipObject = (info: any) => {
    this.tooltipObject = {
      ...info,
      cluster: false,
      object: info.object ?? {},
    };
  };
  get getSelectedFeIndexes(): number[] {
    const plinePts = this.pLinePoints.actual;
    const selId = plinePts.length && plinePts[0] ? plinePts[0].id : null;
    return (selId || selId === 0) ? [Number(selId)] : [];
  }

  get getisShowCluster() {
    return this.isShowCluster;
  }
  get getPoints() {
    return this.points;
  }
  get getSelectedIp() {
    return this.selectedIp;
  }
  get getpLinePoints() {
    return this.pLinePoints;
  }

  get switchMap(): Map<string, Feature> | undefined {
    const relArr = this.points.map((point): [string, Feature] | undefined => {
      if (point && point.properties) {
        return [point.properties.locName, point];
      }
      return
    });

    return new Map(relArr.filter((val): val is [string, Feature] => val !== undefined));
  }
  toggleShowCluster = (flag: boolean) => {
    this.isShowCluster = flag;
  };

  setSelectedIp = (ip) => {
    this.selectedIp = ip;
    this.setpLinePoints(ip);

  };

  setpLinePoints = (activeHostName = '') => {
     const pathPoints: Array<Feature | null> = [];
     const updatedFeatures = new Set<Feature | null>(this.pLinePoints.actual);

     let prev = this.pLinePoints.actual.slice();

     prev.forEach((p) => {
      if (p && p.properties.isInParentLine) {
        p.properties.isInParentLine = false;
        updatedFeatures.add(p);
      }
    });

    if (activeHostName) {
      let initPoint = this.switchMap?.get(activeHostName);

      if (!initPoint) {
        // Clear the current path if there is no selected locName
        this.pLinePoints = { actual: [], prev };
        return;
      }
      let nextPoint: Feature | undefined = initPoint;

      while (nextPoint) {
        if (pathPoints.includes(nextPoint)) {
          // Check for infinite loop
          console.log('short-circuit in pline');
          break;
        }

        // Add the current point to the current path and updated features
        pathPoints.push(nextPoint);
        updatedFeatures.add(nextPoint);
        nextPoint.properties.isInParentLine = true;

        nextPoint = this.switchMap?.get(nextPoint.properties.parentName) || undefined;
      }
    }

    pathPoints.forEach((p) => {
      if (p && !updatedFeatures.has(p)) {
        p.properties.isInParentLine = true;
        updatedFeatures.add(p);
      }
    });
    this.pLinePoints = { actual: pathPoints, prev };
  };

  setPoints = (payload: Feature[]) => {
    this.points = payload;
  };

}

export default PointStore;
