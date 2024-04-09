import LineStore from './LineStore';
import PointStore from './PointStore';
import ViewStore from './ViewStore';

class RootStore {
  lineStore: LineStore;
  pointStore: PointStore;
  viewStore: ViewStore;
  replaceVariables: any;
  constructor(props) {
    this.replaceVariables = props.replaceVariables
    this.lineStore = new LineStore(this);
    this.pointStore = new PointStore(this);
    this.viewStore = new ViewStore(this);
  }
}

export default RootStore;
