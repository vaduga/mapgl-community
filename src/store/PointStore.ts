import {autorun, makeAutoObservable, toJS} from 'mobx';
import RootStore from './RootStore';
import {Feature, Info} from './interfaces';

class PointStore {
  root: RootStore;
  type: 'icons'|'polygons' = 'icons'
  points: Array<Array<Feature | null>> = [];
  polygons: Array<Array<Feature | null>> = [];
  path: Array<Array<Feature | null>> = [];
  pLinePoints: Array<Feature | null > = [];
  isShowCluster = true;
  isShowPoints = true;
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
    const plinePts = this.pLinePoints
    const selId = plinePts.length && plinePts[0] ? plinePts[0].id : null;
    return (selId || selId === 0) ? [Number(selId)] : [];
  }

  get getType() {
    return this.type;
  }

  get getisShowCluster() {
    return this.isShowCluster;
  }
  get getisShowPoints() {
    return this.isShowPoints;
  }
  get getPoints() {
    return this.points;
  }
  get getPolygons() {
    return this.polygons;
  }
  get getPath() {
    return this.path;
  }

  get getSelectedIp() {
    return this.selectedIp;
  }
  get getpLinePoints() {
    return this.pLinePoints;
  }

  get switchMap(): Map<string, Feature> | undefined {
    const {points, polygons, path} = this
    const features = [points.flat(), polygons.flat(), path.flat()]
    const mergedFeatures = features.reduce((r, curr) => {
      return r.concat(curr);
    }, []);
    const relArr = this.points.length>0 && mergedFeatures.map((point): [string, Feature] | undefined => {
      if (point && point.properties) {
        return [point.properties.locName, point];
      }
      return
    });

    if (!relArr) {
      return
    }

    return new Map(relArr.filter((val): val is [string, Feature] => val !== undefined));
  }
  toggleShowCluster = (flag: boolean) => {
    this.isShowCluster = flag;
  };
  toggleShowPoints = (flag: boolean) => {
    this.isShowPoints = flag;
  };

  setSelectedIp = (ip) => {
    this.selectedIp = ip;
    this.setpLinePoints(ip);

  };

  setType = (type) => {
    this.type = type
  }

  setpLinePoints = (activeHostName = '') => {
     const pathPoints: Array<Feature | null> = [];
     const updatedFeatures = new Set<Feature | null>(this.pLinePoints);

     let prev = this.pLinePoints.slice();

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
        this.pLinePoints = prev;
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
    this.pLinePoints = pathPoints;
  };

  setPoints = (payload: Feature[]) => {
    this.points = payload;
  };
  setPolygons = (payload: Feature[]) => {
    this.polygons = payload;
  };

  setPath = (payload: Feature[]) => {
    this.path = payload;
  };
}

export default PointStore;
