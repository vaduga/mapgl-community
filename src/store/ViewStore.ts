import { makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';

class ViewStore {
  root: RootStore;

  viewState: {
    longitude: number,
    latitude: number,
    zoom: number,
    maxPitch?: number,
    pitch?: number,
    bearing?: number,
  } | undefined =
      {
        longitude: -74.012321,
        latitude: 40.712861,
        zoom: 2

      }

      //undefined

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
