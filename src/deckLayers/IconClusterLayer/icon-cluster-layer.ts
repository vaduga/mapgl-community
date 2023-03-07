import { CompositeLayer } from '@deck.gl/core';
import { IconLayer } from '@deck.gl/layers';
import Supercluster from 'supercluster';
import { svgToDataURL, createDonutChart } from './donutChart';
import {Feature} from "geojson";
import {getThresholdForValue} from "../../editor/Thresholds/data/threshold_processor";
import {metricName, thresholds} from "../../layers/data/markersLayer";
import {toJS} from "mobx";

type params =
{
  selectedIp: string;
  zoom: number;
  uPoint: Feature | null;

}

export class IconClusterLayer extends CompositeLayer<params> {
  selectedIp;
  zoom;
  uPoint

  constructor(props) {
    super(props);
    this.uPoint = props.uPoint;
    this.selectedIp = props.selectedIp;
    this.zoom = props.zoom
  }
  shouldUpdateState({ changeFlags }) {
    return changeFlags.somethingChanged;
  }

  updateState({ props, oldProps, changeFlags }) {
    const rebuildIndex =
      changeFlags.dataChanged || props.sizeScale !== oldProps.sizeScale;

    if (rebuildIndex) {
      const index = new Supercluster({
        maxZoom: 15,
        radius: props.sizeScale * Math.sqrt(2),
      });

      index.load(
        props.data.map((d) => {
          return {
            geometry: { coordinates: d.coordinates },
            properties: d.properties,
          };
        }),
      );
      this.setState({ index });
    }

    const z = Math.floor(this.context.viewport.zoom + 1);
    if (rebuildIndex || z !== this.state.z) {
      this.setState({
        data: this.state.index.getClusters([-180, -85, 180, 85], z),
        z,
      });
    }
  }

  getPickingInfo({ info, mode }) {
    const pickedObject = info.object && info.object.properties;
    if (pickedObject) {
      if (pickedObject.cluster) {
        info.objects = this.state.index
          .getLeaves(pickedObject.cluster_id, 'infinity')
          //.map((f) => f.properties);
      }
      info.object = pickedObject;
    }
    return info;  // clicked blank space
  }

  renderLayers() {
    const { data } = this.state;

    return new IconLayer( /// cluster sublayer
      this.getSubLayerProps({
        id: 'icon',
        data,
        stroked: true,
        sizeScale: 1.1,
        getSize: (d) => (this.selectedIp === d.properties?.locName ? 50 : 30),
        getPosition: (d) => d.geometry.coordinates,
        getIcon: (d) => {
          const isSelected = this.selectedIp === d.properties?.locName;
          const colorCounts = {};
          let clPoints = d.properties.cluster
            ? this.state.index.getLeaves(d.properties.cluster_id, 'infinity')
            : '';
          if (clPoints) {
            clPoints.forEach((p) => {
              const { iconColor, colorLabel } = p.properties;
              colorCounts[iconColor] = colorCounts[iconColor] ?
                  {
                    count : colorCounts[iconColor].count +1,
                    label : colorCounts[iconColor].label
                  } :
                  {
                    count : 1,
                    label : colorLabel
                  }
              })
           d.properties.colorCounts = colorCounts
          } else {
            // single point, not a cluster
            const {locName, colorLabel } = d.properties
            const isSelected = locName === this.selectedIp
            const color = isSelected ? getThresholdForValue(d.properties, d.properties[metricName], thresholds).selColor : d.properties.iconColor;
            colorCounts[color] =   {
              count : 1,
              label : colorLabel
            }
            }
          return {
            url: svgToDataURL(createDonutChart(colorCounts)),
            width: isSelected ? 256 : 128,
            height: isSelected ? 256 : 128,
          };
        },
      }),
    );
  }
}
