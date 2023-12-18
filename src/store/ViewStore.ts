import { makeAutoObservable, autorun } from 'mobx';
import RootStore from './RootStore';
import {ViewState} from "./interfaces";

class ViewStore {
  root: RootStore;

  viewState: ViewState | undefined =  undefined


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
