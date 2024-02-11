import {
  toRGB4Array,
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { CollisionFilterExtension } from '@deck.gl/extensions/typed';
import {FEATURE_EDIT_HANDLE_COLOR, DEFAULT_EDIT_HANDLE_COLOR} from '../../components/defaults';
import {toJS} from "mobx";
import {colTypes, pEditActions} from "../../store/interfaces";


import {svgToDataURL} from "../IconClusterLayer/donutChart";

const IconsGeoJsonLayer = (props) => {
  const {
    featureCollection,
    getSelectedFeIndexes,
    getisShowSVG,
    getSvgIcons,
    getSelectedIp,
    onHover,
    highlightColor,
  } = props;

  return new GeoJsonLayer({
    highlightColor,
    onHover,
    id: colTypes.Points,
    data: featureCollection,
    selectedFeatureIndexes: getSelectedFeIndexes?.get(colTypes.Points) ?? [],
    parameters: {
      depthTest: false
    },
        pointType: getisShowSVG ? 'circle+icon+text' : 'circle+text',
        //pointType: 'circle+text',
        getText: (f: any) => f.properties.locName,
        getTextAlignmentBaseline: 'center',
        getTextPixelOffset: [0, 15],
        // @ts-ignore
        getTextColor: (d) => {
          // @ts-ignore
          const {threshold, cluster} = d.properties
          if (cluster) {
            return [0, 0, 0]
          }
          const {color} = threshold
          return toRGB4Array(color)
        },
        getTextSize: 12,
        //@ts-ignore
        getFillColor: (d: any) => {
          const {threshold} = d.properties
          const {color} = threshold
          return toRGB4Array(color)
        },
        getPointRadius: (d) => {
          const isHead = getSelectedIp === d.properties?.locName
          return isHead ? 10 : 8 //4 : 2
        },
        pointRadiusScale: 0.3, //1,


        getIcon: (d) => {
          const colorCounts = {};
          const {threshold} = d.properties
          const {color, label, iconName} = threshold

          const svgIcon = getSvgIcons[iconName]

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
          colorCounts[singleColor] = {
            count: 1,
            label
          }


          return {
            url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <!-- Add any additional attributes or elements as needed -->
</svg>`),
            width: 1,
            height: 1,
            id: 'blank'
          };
        },

        iconSizeScale: 1,
        getIconPixelOffset: (d) => {
          // @ts-ignore
          const {threshold, cluster} = d.properties
          if (cluster) {
            return [0, 0]
          }
          const {iconVOffset} = threshold
          return [0, iconVOffset ?? 0]
        },
        getIconSize: (d) => {
          const isSelected = getSelectedIp === d.properties?.locName;
          // @ts-ignore
          const {cluster, threshold} = d.properties
          if (cluster) {
            return 40
          } else {
            const {iconSize} = threshold
            return iconSize ? isSelected ? iconSize * 1.5 : iconSize : 30
          }


        },
        iconSizeUnits: 'pixels',
        // @ts-ignore
        getIconColor: (d) => {
          // @ts-ignore
          const {threshold, cluster} = d.properties
          if (cluster) {
            return [0, 0, 0]
          }
          const {color} = threshold
          return toRGB4Array(color)
        },
        _subLayerProps: {
          "points-text": {
            extensions: [new CollisionFilterExtension()],
            //           background: true,
            //           _subLayerProps: {
            //             "background":
            // {
            //   getFillColor: () => toRGB4Array(GLOBAL_FILL_COLOR_HEX),
            // }
            //},
            collisionGroup: 'text',
            collisionTestProps:
                {
                  sizeScale: 4,

                }
          },
          "points-icon": {
            extensions: [new CollisionFilterExtension()],
            collisionGroup: 'icons',
            collisionTestProps:
                {
                  sizeScale: 4,
                }
          },
        },

    // Styles
    filled: true,
    stroked: false,

    // Interactive props
    pickable: true,
    pickingDepth: 0,
    autoHighlight: true,
  })
}

export { IconsGeoJsonLayer }


