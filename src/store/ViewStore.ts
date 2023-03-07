import { makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';

class ViewStore {
  root: RootStore;

  viewState: {
    longitude: number,
    latitude: number,
    zoom: number,
    maxPitch: number,
    pitch?: number,
    bearing?: number,
  } | undefined =  undefined

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
    //autorun(() => console.log('viewState', toJS(this.viewState)));
  }

  get getViewState() {
    return this.viewState;
  }
  setViewState = (viewState) => {
    this.viewState = viewState;
  };

}

export default ViewStore;
