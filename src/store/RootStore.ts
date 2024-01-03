import LineStore from './LineStore';
import PointStore from './PointStore';
import ViewStore from './ViewStore';

class RootStore {
  lineStore: LineStore;
  pointStore: PointStore;
  viewStore: ViewStore;
  replaceVariables: any;
  options: any;
  data: any;
  width: any;
  height: any;
  eventBus: any;
  constructor(props) {
    this.replaceVariables = props.replaceVariables
    this.options = props.options
    this.eventBus = props.eventBus
    this.data = props.data
    this.width = props.width
    this.height = props.height
    this.lineStore = new LineStore(this);
    this.pointStore = new PointStore(this);
    this.viewStore = new ViewStore(this);
  }
}

export default RootStore;
