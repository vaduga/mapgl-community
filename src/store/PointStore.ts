import {autorun, makeAutoObservable, toJS} from 'mobx';
import RootStore from './RootStore';
import {AggrTypes, colTypes, DeckFeature, Feature, Info, PointFeatureProperties} from './interfaces';
import {genParentLine} from '../utils';
import {Point, Position} from "geojson";
import {getThresholdForValue} from "../editor/Thresholds/data/threshold_processor";
import {thresholds} from "../components/Mapgl";

class PointStore {
  root: RootStore;
  type: 'icons'|'polygons' = 'icons'
  points: any[] = [];
  polygons: any[] = [];
  path: any[] = [];
  geojson: any = [];
  pLinePoints: any[] = [];
  orgId: null | number = null
  comments: Map<string, string> = new Map()
  isShowCluster = false;
  mode = 'modify'// 'view'
  isShowPoints = true;
  isOffset = true;
  selectedIp = '';
  selFeature: Feature | undefined = undefined;
  nodesCons: Map<string, [string]> = new Map()

  updatedHost: Feature | null = null;
  blankHoverInfo: Info = {
    x: -3000,
    y: -3000,
    cluster: false,
    object: {
      isShowTooltip: false,
      cluster: false
    },
    objects: []
  }

  tooltipObject: Info = this.blankHoverInfo;
  logTooltipObject: Info = this.blankHoverInfo;


  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
    //autorun(() => console.log('pts', toJS(this.points.filter(el=>el.properties.locName==='U1').map(el=> toJS(el.properties.parPath)))));
    autorun(() => console.log('oofs', toJS(this.isOffset)));
    //  autorun(() => console.log('selfeature', toJS(this.selFeature)));
    //autorun(() => console.log('pl', toJS(this.pLinePoints)));
    //autorun(() => console.log('update host auto ', toJS(this.updatedHost)));
    //autorun(() => console.log('tootlip auto ', toJS(this.tooltipObject)));
    //    autorun(() => console.log('cmts ', toJS(this.comments)));
    //autorun(() => console.log('pts ', toJS(this.points)));

  }

  get getMode(): string {
    return this.mode;
  }

  get getBlankInfo(): Info{
    return this.blankHoverInfo
  }

  get getOrgId() {
    return this.orgId;
  }

  setOrgId = (orgId: number)=>  {
    this.orgId = orgId;
  }

  setMode = (mode: string) => {
    this.mode = mode;
  };

  get getisOffset() {
    return this.isOffset;
  }

  get getTooltipObject() {
    return this.tooltipObject;
  }

  get getLogTooltipObject() {
    return this.logTooltipObject;
  }

  setComment = (key, comment) =>{
    this.comments.set(key, comment)
  }

  delComment = (key) =>{
    this.comments.delete(key)
  }

  setAllComments = (comments)=>{
    this.comments = comments
  }

  setTooltipObject = (info: any) => {
    this.tooltipObject = {
      ...info,
      cluster: false,
      object: info.object ?? {},
    };
  };

  setLogTooltipObject = (info: any) => {
    this.logTooltipObject = {
      ...info,
      cluster: false,
      object: info.object ?? {},
    };
  };


  get getSelectedFeIndexes(): Map<string,[number]> {
    const { id: index, properties } = this.selFeature || {};
    const {colType} = properties || {}

    const selectedIndexes: Map<string,[number]> = new Map()

    if (colType && index !== undefined) {
      selectedIndexes.set(colType, [index]);
      colType === colTypes.Points && selectedIndexes.set(colTypes.Lines, [index]);
    }
    return selectedIndexes;
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

  get getGeoJson() {
    return this.geojson;
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

  get getNodeConnections() {
    const nodeConnections = new Map()
    this.points.reduce((acc,curr)=> acc.concat(curr), []).forEach((p) => {
      const pProps = p?.properties
      pProps?.parPath.forEach((pp, i) => {
        if (Array.isArray(pp) || i === 0) {
          return
        }
        const aggrType = this.switchMap?.get(pp)?.properties.aggrType
        if (AggrTypes.includes(aggrType as string)) {

          const prevValue = nodeConnections.get(pp)

          const locName = this.switchMap?.get(pProps.locName)
          if (!AggrTypes.includes(locName?.properties.aggrType as string)) {

            const fromSet = new Set(prevValue?.from || []);
            const toSet = new Set(prevValue?.to || []);


            fromSet.add(p?.properties);
            nodeConnections.set(p, {
              from: Array.from(fromSet),
              to: Array.from(toSet)
            });

            toSet.add(this.switchMap?.get(pProps.parName)?.properties);
            nodeConnections.set(pp, {
              from: Array.from(fromSet),
              to: Array.from(toSet)
            });

          }
        }
      })
    })
    return nodeConnections
  }

  get switchMap(): Map<string, Feature> | undefined {
    const { points, polygons, path, geojson } = this;
    const features = [points, polygons, path, geojson].reduce((acc,curr)=> acc.concat(curr), []); // Don't flatten the arrays yet

    type f = [string, Feature]
    const relArr: f[] = [];

    features.forEach((point) => {
      if (point && point.properties) {
        relArr.push([point.properties.locName, point]);
      }
    })

    if (relArr.length === 0) {
      return;
    }
    return new Map(relArr);
  }

  get getParPathText() {
    const selFeature = this.switchMap?.get(this.selectedIp)
    const parPath = selFeature?.properties.parPath
    const parPathExists = Array.isArray(parPath)
    const parPathText = parPathExists? parPath.map((el, i) => {

      const geometry = typeof el === 'string' ? this.switchMap?.get(el)?.geometry as Point : null;
      const coordinates = geometry?.coordinates ?? el;
      return {text: i+1+'', coordinates, color: 'rgb(237, 71, 59)'} //selFeature?.properties.iconColor}
    }) : []

    return parPathText
  }


  toggleShowCluster = (flag: boolean) => {
    this.isShowCluster = flag;
  };

  toggleShowPoints = (flag: boolean) => {
    this.isShowPoints = flag;
  };

  toggleOffset = (flag) => {
    this.isOffset = flag;
  };

  setSelectedIp = (ip) => {
    this.selectedIp = ip;
    this.selFeature = this.switchMap?.get(ip)
    this.setpLinePoints(this.selFeature);
  };

  setNodeConnections = (node, connection) => {
    this.nodesCons.set(node, connection);
  }

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

  setpLinePoints = (selFeature) => {
    const lineSwitchMap = this.switchMap

    let prev = this.pLinePoints.slice();

    prev.forEach((p) => {
      if (p && p.properties?.isInParentLine) {
        p.properties.isInParentLine = false;
      }
    });

    const [pLinePoints] = genParentLine(selFeature, this.switchMap)

    pLinePoints?.forEach(el=> {
      el.properties.isInParentLine = true;
    })
    this.pLinePoints = pLinePoints ?? []
  }


}

export default PointStore;


