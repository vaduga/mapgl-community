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
      pointType: this.layerProps.getisShowCluster ? 'icon+text' : 'circle+text',
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


          // Example usage:
          const svgFilePath = mySvg;
          // parseSvgFileToString(svgFilePath)
          //     .then(svgString => {
          //       if (svgString) {
          //         console.log('SVG String:', svgString);
          //       } else {
          //         console.error('Failed to fetch SVG file.');
          //       }
          //     });


          function createSVGIcon(color) {

            return `
            <svg width="49" height="65" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 49 65" fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><use xlink:href="#A" x=".5" y=".5"/><symbol id="A" overflow="visible"><g stroke="#fff" stroke-linejoin="miter" fill="${color}" stroke-width=".788"><path d="M47.256 56.313V0L39.38 7.482v56.313l7.876-7.482z"/><path d="M47.256 0L39.38 7.482H0L10.239 0h37.017z"/><path d="M39.38 46.468V7.482H0v38.986h39.38zm0 17.327V46.862H0v16.933h39.38z"/></g><g stroke="none"><path d="M16.146 22.447l-5.907-6.301 1.181-.788-3.938-.788.788 3.544.788-.788 6.301 5.907.788-.788zm-1.969 3.544H5.513v-1.181l-3.15 1.969 3.15 2.363v-1.575h8.664v-1.575zm1.181 4.332l-6.301 6.301-.788-1.181-.788 3.938 3.938-.788-1.181-1.181 5.907-5.907-.788-1.181zm3.938 2.363v8.27h-1.575l1.969 3.15 2.363-3.15h-1.575v-8.27h-1.181zm0-11.42v-8.27h-1.575l1.969-3.15 2.363 3.15h-1.575v8.27h-1.181zm3.938 10.239l6.301 5.907-1.181 1.181 3.938.788-.788-3.938-1.181 1.181-5.907-6.301-1.181 1.181zm2.363-3.938h8.27v1.575l3.544-2.363-3.544-1.969v1.181h-8.27v1.575zm-1.181-4.332l5.907-5.907 1.181.788.788-3.544-3.938.788 1.181.788-6.301 6.301 1.181.788z"/><use xlink:href="#C"/></g><use xlink:href="#C" stroke-linejoin="miter" fill="none" stroke-width=".788"/><path d="M20.083 55.92h8.664v1.575l3.15-2.363-3.15-1.969v1.181h-8.664v1.575zm0-2.363l7.876-2.757.394 1.181 2.363-3.15-3.938-.788.788 1.181-7.876 3.15.394 1.181zm0 3.15l7.876 3.15.394-1.575 2.363 3.15-3.938.788.788-1.181-7.876-3.15.394-1.181zM7.088 55.92h8.27v1.575l3.15-2.363-3.15-1.969v1.181h-8.27v1.575z" stroke="none"/></symbol><defs ><path id="C" d="M24.805 33.874c4.332-2.757 5.119-8.27 2.363-12.208s-8.27-4.725-12.208-1.969-5.119 8.27-2.363 12.208 8.27 4.726 12.208 1.969z"/></defs></svg>
            
            `

            return `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fa1" stroke-width="2"/>
    </svg>
  `;
          }

          const {threshold} = d.properties
          const {color, label} = threshold

          return {
            url: svgToDataURL(createSVGIcon(color)),//mySvg,
            width: isSelected ? 256 : 51,
            height: isSelected ? 256 : 81,
          };
          // single point, not a cluster



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
