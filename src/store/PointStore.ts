import {action, autorun, makeAutoObservable, toJS} from 'mobx';
import RootStore from './RootStore';
import {
  AggrTypes,
  colTypes,
  ComFeature,
  CoordRef,
  DeckFeature,
  Feature,
  Info,
  pEditActions,
  Sources
} from './interfaces';
import {genParentLine} from '../utils';
import {Point, Position} from "geojson";
import {getThresholdForValue} from "../editor/Thresholds/data/threshold_processor";
import {thresholds} from "../components/Mapgl";
import {parDelimiter} from "../components/defaults";

class PointStore {
  root: RootStore;
  type: 'icons'|'polygons' = 'icons'
  points: Feature[] = [];
  polygons: any[] = [];
  path: any[] = [];
  geojson: any = [];
  pLinePoints: any[] = [];
  orgId: null | number = null
  comments: ComFeature[] | undefined
  isShowCluster = true;
  mode = 'view'
  isShowPoints = true;
  isOffset = true;
  selectedIp = '';
  selIds: number[] = []
  selCoord =  {
    coordinates: [],
    type: "Point"
  }
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
    autorun(() => console.log('pts ', toJS(this.points)));

  }

  get getMode(): string {
    return this.mode;
  }

  get getBlankInfo(): Info{
    return this.blankHoverInfo
  }

  get getSelCoord() {
    return this.selCoord;
  }

  get getSelIds() {
    return this.selIds;
  }

  get getSelFeature() {
    return this.switchMap?.get(this.selectedIp);
  }

  setSelCoord = (newSelCoord) => {
    this.selCoord = newSelCoord;
  }


  setMode = (mode) => {
    this.mode = mode;
  };

  setSelIds =(ids)=> {
    this.selIds = ids
  }
  get getisOffset() {
    return this.isOffset;
  }

  get getTooltipObject() {
    return this.tooltipObject;
  }

  get getLogTooltipObject() {
    return this.logTooltipObject;
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


  get getSelectedFeIndexes(): Map<string,number[]> | null {
    if (!this.getSelFeature) {
      return null
    }
    const { id: index, properties } = this.getSelFeature
    const {colType, locName} = properties
    const {lineStore} = this.root
    const selIds = this.selIds

    const selectedIndexes: Map<string,number[]> = new Map()

    if (colType && index !== undefined) {
      selectedIndexes.set(colType, [index]);
      colType === colTypes.Points && selIds?.length && selectedIndexes.set(colTypes.Lines, selIds as number[]);
    }
    return selectedIndexes;
  }

  get getisShowCluster() {
    return this.isShowCluster;
  }
  get getisShowPoints() {
    return this.isShowPoints;
  }

  get getComments() {
    return this.comments
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

  get switchMap(): Map<string, Feature> | undefined {
    const { points } = this;
    const features = points

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

  setSelectedIp = (ip, selIds: number[] | null = null) => {
    //this.setpLinePoints(this.selFeature);

    if (ip !== null) {
      const delimited = ip?.split(parDelimiter)
      const normIp = delimited?.[0];
      this.selectedIp = normIp ?? ''
      const geom = this.getSelFeature?.geometry
      if (geom) {this.setSelCoord(geom);}
    }
const sources = this.getSelFeature?.properties.sources

  if (sources && Object.values(sources).length) {

      const ids = selIds !== null ? selIds : ip ? Object.values(sources).map(s=>s?.lineId).filter(el=>el !== undefined) : []
    this.setSelIds(ids)
    } else {
    this.setSelIds([])
  }

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

  editCoords = action((editFeature: Feature, value: string | Position | CoordRef[] | number , action: pEditActions, parName?: string) => {

    let sources: Sources | undefined = editFeature?.properties?.sources
    let source = parName && sources && sources[parName]

    switch (action) {

      case pEditActions.SetLineId:
        if (source && value !== undefined) {
          source.lineId = value as number
        }
        break;
    }

  });


}

export default PointStore;


