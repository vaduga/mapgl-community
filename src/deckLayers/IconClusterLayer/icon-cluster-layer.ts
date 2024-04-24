import { CompositeLayer } from '@deck.gl/core';
import {IconLayer } from '@deck.gl/layers';
import Supercluster from 'supercluster';
import { svgToDataURL, createDonutChart } from './donutChart';
import {Feature} from "geojson";
import {colTypes} from "../../store/interfaces";
import {DataFilterExtension} from "@deck.gl/extensions";
import {ALERTING_STATES, DEFAULT_CLUSTER_ICON_SIZE} from "../../components/defaults";
import {findClosestAnnotations} from "../../utils";

type params =
{
  selectedIp: string;
  zoom: number;
  uPoint: Feature | null;
  layerProps: any;
}

export class IconClusterLayer extends CompositeLayer<params> {
  selectedIp;
  pickable;
  getisShowPoints
  getSelectedFeIndexes;
  time
  cluster_id
  id
  legendItems


  constructor(props) {
    super(props);
    this.onHover = (o) => {
        if (!o.object) {
            props.setHoverInfo({})
            return false}
        const clusterProps = o.object.properties
        if (clusterProps.cluster_id !== props.hoverCluster?.object?.cluster_id) {
            props.setHoverCluster(o)
        }
        props.setClosedHint(false);
        props.setHoverInfo(o)
        return true
    }
    this.cluster_id = props.hoverCluster?.object?.cluster_id
    this.id = props.id
    this.selectedIp = props.getSelectedIp;
    this.pickable = props.pickable
    //this.getisShowPoints = props.getisShowPoints;
    //this.getMode = props.getMode
    this.legendItems = props.legendItems
    this.time = props.time


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
        props.data
      );
      this.setState({ index });
    }

    const z = Math.floor(this.context.viewport.zoom + 1);
    if ((rebuildIndex || z !== this.state.z)) {  ///&& z < props.maxZoom

        this.setState({
            // @ts-ignore
        data: this.state.index.getClusters([-180, -85, 180, 85], z),
        z,
      });
    }

    // else if (z >= props.maxZoom) {
    //   this.setState({
    //     data: [],
    //     z,
    //   })
    // }
  }

    getPickingInfo({ info, mode }) {
        const pickedObject = info.object
        if (pickedObject) {
            const cluster_id = pickedObject.properties?.cluster_id
            if (cluster_id) {
                // @ts-ignore
                pickedObject.properties.expZoom = this.state.index.getClusterExpansionZoom(cluster_id)
            }
        }
        return info;
    }

  renderLayers() {
      const categories: string[] = []

      this.legendItems?.forEach(item=> {
          if (!item.disabled) {
              categories.push(item.label)
          }
      })
    const { data } = this.state;

    return new IconLayer(this.getSubLayerProps({
      //visible: this.getisShowPoints,
      id: colTypes.Points,
      data: data,
        updateTriggers: {
            getIcon: this.time,
        },
      getFilterValue: f => f.properties.cluster ? 1 : 0,
      filterRange: [1, 1],
      selectedFeatureIndexes:   this.getSelectedFeIndexes?.get(colTypes.Points) ?? [],
      getPosition: d => d.geometry.coordinates,
      getIcon: (d) => {
        const colorCounts = {};
        const annotStateCounts = {};
          let clPoints = d.properties.cluster
              // @ts-ignore
            ? this.state.index.getLeaves(d.properties.cluster_id, 'infinity')
            : '';
        if (Array.isArray(clPoints)) {
          d.properties.objects = clPoints
          let total = 0
          let stTotal = 0
          clPoints.forEach((p) => {
            const { color, label } = p.properties?.threshold;
            if (categories.length && !categories.includes(label)) {
                return
            }
            const {all_annots} = p.properties
            if (all_annots && !this.legendItems.at(-1)?.disabled) {
                const annots: any = findClosestAnnotations(all_annots, this.time)
                const annotState = annots?.[0]?.newState
              const state = Object.keys(ALERTING_STATES).find(st=> annotState?.startsWith(st))

             if (state)
              {

                const color = ALERTING_STATES[state]
                annotStateCounts[color] = annotStateCounts[color] ?
                    {
                      count: annotStateCounts[color].count + 1,
                      label: state
                    } :
                    {
                      count: 1,
                      label: state
                    }
                stTotal += 1 /// annot + point itself
              } else {total +=1}
            }
              else {
                total += 1
            }
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
          d.properties.annotStateCounts = annotStateCounts

            if (total>1) {
                return {
                    url: svgToDataURL(createDonutChart({
                        colorCounts,
                        annotStateCounts,
                        allTotal: total,
                        allStTotal: stTotal
                    })),
                    width: 128,
                    height: 128,
                };
            }
        }
//// blank svg icon if no cluster .Fallback if above data-filtering is removed.

return        {
          url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">  
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
      pickable: this.pickable,
      autoHighlight: false,
    }))

  }
}
