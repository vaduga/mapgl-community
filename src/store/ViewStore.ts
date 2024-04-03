import { makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';
import {ViewState} from "./interfaces";
import {DEFAULT_CLUSTER_MAX_ZOOM} from "../components/defaults";

class ViewStore {
  root: RootStore;

  viewState: ViewState | undefined =  undefined
  clusterMaxZoom = DEFAULT_CLUSTER_MAX_ZOOM

  constructor(root: RootStore) {
    this.root = root;
    const zoomVar = root.replaceVariables(`$cluster_max_zoom`)
    const zoom = parseInt(zoomVar, 10)

    if (zoom > 1 && zoom < 19) {
      this.clusterMaxZoom = zoom
    }

    makeAutoObservable(this);
    //autorun(() => console.log('viewState', toJS(this.viewState)));
  }

  get getClusterMaxZoom () {
    return this.clusterMaxZoom;
  }
  get getViewState() {
    return this.viewState;
  }
  setViewState = (viewState) => {
    this.viewState = viewState;
  };
  setClusterMaxZoom = (maxZoom: number) => {
    this.clusterMaxZoom = maxZoom
  }

}

export default ViewStore;
