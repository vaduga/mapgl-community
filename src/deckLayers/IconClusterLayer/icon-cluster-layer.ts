import { CompositeLayer } from '@deck.gl/core';
import {IconLayer } from '@deck.gl/layers';
import Supercluster from 'supercluster';
import { svgToDataURL, createDonutChart } from './donutChart';
import {Feature} from "geojson";
import {toJS} from "mobx";
import {colTypes} from "../../store/interfaces";
import {DataFilterExtension} from "@deck.gl/extensions";
import {DEFAULT_CLUSTER_ICON_SIZE} from "../../components/defaults";

type params =
{
  selectedIp: string;
  zoom: number;
  uPoint: Feature | null;
  layerProps: any;
}

export class IconClusterLayer extends CompositeLayer<params> {
  selectedIp;
  zoom;
  layerProps;
  isVisible;
  getSelectedFeIndexes;
  getSvgIcons

  constructor(props) {
    super(props);
    this.layerProps = props.layerProps;
    this.selectedIp = props.getSelectedIp;
    this.zoom = props.zoom
    this.isVisible = props.isVisible;
    this.getSelectedFeIndexes = props.getSelectedFeIndexes
    this.getSvgIcons = props.getSvgIcons

  }
  shouldUpdateState({ changeFlags }) {
    return changeFlags.somethingChanged;
  }

  updateState({ props, oldProps, changeFlags }) {
    const rebuildIndex =
        changeFlags.dataChanged || props.sizeScale !== oldProps.sizeScale || props.maxZoom !== oldProps.maxZoom;

    if (rebuildIndex) {
      const index = new Supercluster({
        maxZoom: props.maxZoom,
        radius: props.sizeScale * Math.sqrt(2),
      });

      index.load(
        props.data.map((d) => {
          return {
            geometry: { coordinates: d.coordinates, type: "Point" },
            properties: {...d.properties, id: d.id },
          };
        }),
      );
      this.setState({ index });
    }

    const z = Math.floor(this.context.viewport.zoom + 1);
    if ((rebuildIndex || z !== this.state.z) && z < props.maxZoom) {
      this.setState({
        data: this.state.index.getClusters([-180, -85, 180, 85], z),
        z,
      });
    } else if (z >= props.maxZoom) {
      this.setState({
        data: [],
        z,
      })
    }
  }

  getPickingInfo({ info, mode }) {
    const pickedObject = info.object && info.object.properties;
    if (pickedObject) {
      if (pickedObject.cluster) {
        info.objects = this.state.index
          .getLeaves(pickedObject.cluster_id, 'infinity')
          //.map((f) => f.properties);
        info.expZoom = this.state.index
            .getClusterExpansionZoom(pickedObject.cluster_id)
      }
      info.object = pickedObject;
    }
    return info;  // clicked blank space
  }

  renderLayers() {
    const { data } = this.state;

    return new IconLayer(this.getSubLayerProps({
      visible: this.isVisible,
      // highlightColor,
      // onHover,
      id: colTypes.Points,
      data: data,
      getFilterValue: f => f.properties.cluster ? 1 : 0,
      filterRange: [1, 1],
      selectedFeatureIndexes:   this.getSelectedFeIndexes?.get(colTypes.Points) ?? [],
      getPosition: d => d.geometry.coordinates,
      getIcon: (d) => {
        const isSelected = this.selectedIp === d.properties?.locName;
        const colorCounts = {};
        let clPoints = d.properties.cluster
            ? this.state.index.getLeaves(d.properties.cluster_id, 'infinity')
            : '';
        if (clPoints) {
          clPoints.forEach((p) => {
            const { color, label } = p.properties?.threshold;
            colorCounts[color] = colorCounts[color] ?
                {
                  count : colorCounts[color].count +1,
                  label : colorCounts[color].label
                } :
                {
                  count : 1,
                  label
                }
          })
          d.properties.colorCounts = colorCounts
          return {
            url: svgToDataURL(createDonutChart(colorCounts)),
            width: isSelected ? 256 : 128,
            height: isSelected ? 256 : 128,
          };
        }
//// blank svg icon if no cluster

return        {
          url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">  
</svg>`),
          width: 1,
          height: 1,
  id: 'blank'
        };
      },

      iconSizeScale: 1,
      getSize: (d) => {
        const isSelected = this.selectedIp === d.properties?.locName;
        const {cluster, threshold} = d.properties
        if (cluster) {
          return DEFAULT_CLUSTER_ICON_SIZE
        }
        else {
          const {iconSize} = threshold
          return iconSize ? isSelected ? iconSize*1.5 : iconSize : 30}
      },
      iconSizeUnits: 'pixels',
      parameters: {
        depthTest: false
      },
      extensions: [new DataFilterExtension({filterSize: 1})],
      pickable: true,
      autoHighlight: true,
    }))

  }
}
