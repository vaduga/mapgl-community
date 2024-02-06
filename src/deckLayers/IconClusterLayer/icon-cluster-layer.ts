import { CompositeLayer } from '@deck.gl/core';
import {GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import Supercluster from 'supercluster';
import { svgToDataURL, createDonutChart } from './donutChart';
import {Feature} from "geojson";
import {toJS} from "mobx";
import {colTypes} from "../../store/interfaces";
import {parseSvgFileToString, toRGB4Array} from "../../utils";
import { CollisionFilterExtension } from '@deck.gl/extensions/typed';
//import iconAtlas from '/img/location-icon-atlas.png';

import mySvg from '/img/icons/cisco/atm-switch.svg';


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
      features: data.map((a) => {
        return a.properties?.cluster ? ({...a, geometry: {...a.geometry, coordinates: [...a.geometry.coordinates, 5            ]}}) : a
      })
    };

    // const {
    //   onHover,
    //   highlightColor,
    // } = this.props;


    return new GeoJsonLayer(this.getSubLayerProps({
      visible: this.isVisible,
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
      getFillColor: (d: any) => {
        if (d.properties.cluster) {return}
        const {threshold, isInParentLine} = d.properties
        const {color} = threshold
        return toRGB4Array(color)
      },
      getPointRadius: (d) => {
        const isHead = this.selectedIp === d.properties?.locName
        return isHead? 4 : 2
      } ,
      pointRadiusScale: 1,
      filled: true,
      stroked: false,
      pointType: this.layerProps.getisShowSVG ? 'circle+icon+text' : 'circle+text',
     // iconAtlas: mySvg,
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
          return {
            url: svgToDataURL(createDonutChart(colorCounts)),
            width: isSelected ? 256 : 128,
            height: isSelected ? 256 : 128,
          };
        } else {

          const {threshold} = d.properties
          const {color, label, iconName} = threshold

          const svgIcon = this.getSvgIcons[iconName]
if (svgIcon) {
  const {svgText, width, height} = svgIcon

  return {
    url: svgToDataURL(svgText),
    width,
    height,
    id: iconName
  };
}
// single point no customIcon, not a cluster
          const singleColor = color;
          colorCounts[singleColor] =   {
            count : 1,
            label
          }
        }


return        {
          url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <!-- Add any additional attributes or elements as needed -->
</svg>`),
          width: 1,
          height: 1,
  id: 'blank'
        };
      },

      iconSizeScale: 1.1,
      getIconPixelOffset: [0, -20],
      getIconSize: (d) => {
        const isSelected = this.selectedIp === d.properties?.locName;
        const {cluster, threshold} = d.properties
        if (cluster) {
          return 30
        }
        else {
          const {iconSize} = threshold
          return iconSize ? isSelected ? iconSize*1.5 : iconSize : 30}


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

              }
        },
      },

      // Interactive props
      pickable: true,
      autoHighlight: true,
    }))


  }
}
