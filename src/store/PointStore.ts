// @ts-nocheck


import {autorun, makeAutoObservable, toJS} from 'mobx';
import RootStore from './RootStore';
import {colTypes, Feature, Info} from './interfaces';

class PointStore {
  root: RootStore;
  type: 'icons'|'polygons' = 'icons'
  points: Array<Array<Feature | null>> = [];
  polygons: Array<Array<Feature | null>> = [];
  path: Array<Array<Feature | null>> = [];
  geojson: any = [];
  pLinePoints: Array<Feature | null > = [];
  isShowCluster = true;
  isShowPoints = true;
  selectedIp = '';
  tooltipObject: Info = {
  x: -3000,
  y: -3000,
  cluster: false,
  object: {
    isShowTooltip: false,
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
  get getSelectedFeIndexes(): Map<string,[number]> {
    const { id: index, colType, colIdx } = this.switchMap?.get(this.selectedIp) || {};

    const selectedIndexes: Map<string,[number]> = new Map()

    if (colType && (colIdx !== undefined && colIdx >-1) && index !== undefined) {
      selectedIndexes.set(colType+colIdx, [index]);
      selectedIndexes.set(colTypes.Lines+colIdx, [index]);
    }

    console.log(toJS(selectedIndexes), toJS(colType), toJS(colIdx), index)
    return selectedIndexes;
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
  get getGeoJson() {
    return this.geojson;
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
    const { points, polygons, path, geojson } = this;
    //const features = [points, polygons, path, geojson]; // Don't flatten the arrays yet

    type f = [string, Feature]
    const relArr: f[] = [];

    const processCollection = (collection, type) => {
      if (Array.isArray(collection)) {
        collection.forEach((pointsArray, i) => {
          pointsArray.forEach((point) => {
            if (point && point.properties) {
              relArr.push([point.properties.locName, { ...point, colIdx: i, colType: type }]);

            }
          });
        });
      }
    };
    processCollection(points, colTypes.Icons);
    processCollection(polygons, colTypes.Polygons);
    processCollection(path, colTypes.Path);
    processCollection(geojson, colTypes.GeoJson);

    if (relArr.length === 0) {
      return;
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

  setGeoJson = (payload: Feature[]) => {
    this.geojson = payload;
  };
}

export default PointStore;
