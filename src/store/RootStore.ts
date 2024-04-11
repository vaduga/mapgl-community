import LineStore from './LineStore';
import PointStore from './PointStore';
import ViewStore from './ViewStore';

class RootStore {
  lineStore: LineStore;
  pointStore: PointStore;
  viewStore: ViewStore;
  replaceVariables: any;
  theme2: any;
  constructor(props) {
    this.replaceVariables = props.replaceVariables
    this.theme2 = props.theme2
    this.lineStore = new LineStore(this);
    this.pointStore = new PointStore(this);
    this.viewStore = new ViewStore(this);
  }
}

export default RootStore;
