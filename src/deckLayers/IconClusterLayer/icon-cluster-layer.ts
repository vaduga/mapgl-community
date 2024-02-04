import { CompositeLayer } from '@deck.gl/core';
import {GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import Supercluster from 'supercluster';
import { svgToDataURL, createDonutChart } from './donutChart';
import {Feature} from "geojson";
import {MyIconLayer} from "../IconLayer/icon-layer";
import {MarkersGeoJsonLayer} from "../MarkersLines/geo-json-layer";
import {toJS} from "mobx";
import {colTypes} from "../../store/interfaces";
import {toRGB4Array} from "../../utils";
import { CollisionFilterExtension } from '@deck.gl/extensions/typed';
//import iconAtlas from '/img/location-icon-atlas.png';

import mySvg from '/img/content-switch.svg';


const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 49, height: 65, mask: false},
};

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

  constructor(props) {
    super(props);
    this.layerProps = props.layerProps;
    this.selectedIp = props.getSelectedIp;
    this.zoom = props.zoom
    this.isVisible = props.isVisible;
    this.getSelectedFeIndexes = props.getSelectedFeIndexes


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
            geometry: { coordinates: d.coordinates, type: "Point" },
            properties: {...d.properties, id: d.id },
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
    const featureCollection = {
      type: 'FeatureCollection',
      features: data,
    };

    // const {
    //   onHover,
    //   highlightColor,
    // } = this.props;


    return new GeoJsonLayer(this.getSubLayerProps({
      visible: true, //this.isVisible,
      // highlightColor,
      // onHover,
      id: colTypes.Points,
      data: featureCollection,
      selectedFeatureIndexes:   this.getSelectedFeIndexes?.get(colTypes.Points) ?? [],
      getText: (f: any) => f.properties.locName,
      getTextAlignmentBaseline: 'center',
      getTextPixelOffset: [0, 15],
      // @ts-ignore
      getTextColor: (d) => {
        // @ts-ignore
        const {threshold, cluster} = d.properties
        if (cluster) {return [0,0,0]}
        const {color} = threshold
        return toRGB4Array(color)
      },
      getTextSize: 12,

      pointType: 'icon+text',
     // iconAtlas: mySvg,
      loadOptions: {
        imagebitmap: {
          resizeWidth: 28,
          resizeHeight: 28,
          resizeQuality: 'high'
        }},
      //iconMapping: ICON_MAPPING,


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
        } else {

          return {
            url: mySvg,
            width: isSelected ? 256 : 51,
            height: isSelected ? 256 : 81,
          };
          // single point, not a cluster

          const {threshold} = d.properties
          const {color, label} = threshold

          const singleColor = color;
          colorCounts[singleColor] =   {
            count : 1,
            label
          }
        }
        return {
          url: svgToDataURL(createDonutChart(colorCounts)),
          width: isSelected ? 256 : 128,
          height: isSelected ? 256 : 128,
        };
      },

      sizeScale: 2,
      getIconSize: (d) => {
        const isHead = this.selectedIp === d.properties?.locName
        const {cluster} = d.properties
        if (cluster) {
          return 30
        }
        else {return isHead ? 30 : 15}


      },
      iconSizeUnits: 'pixels',
      // @ts-ignore
      getIconColor: (d) => {
        // @ts-ignore
        const {threshold, cluster} = d.properties
        if (cluster) {return [0,0,0]}
        const {color} = threshold
        return toRGB4Array(color)
      },

      _subLayerProps: {
        "points-text": {
          extensions: [new CollisionFilterExtension()],
          collisionTestProps:
              {
                sizeScale: 4,
                radiusScale: 4,
              }
        },
      },

      // Interactive props
      pickable: true,
      autoHighlight: true,
    }))


  }
}
