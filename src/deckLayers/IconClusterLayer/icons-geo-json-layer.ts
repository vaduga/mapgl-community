import {
    toRGB4Array, findClosestAnnotations, hexToRgba
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers';
import { CollisionFilterExtension } from '@deck.gl/extensions';
import {
  ALERTING_STATES
} from '../../components/defaults';
import {toJS} from "mobx";
import {colTypes, pEditActions} from "../../store/interfaces";


import {svgToDataURL} from "../IconClusterLayer/donutChart";

const IconsGeoJsonLayer = (props) => {
  const {
    featureCollection,
    getSelectedFeIndexes,
    getisShowSVG,
    getSvgIcons,
    getisShowPoints,
    getSelectedIp,
    pickable,
    time,
    onHover,
    highlightColor,
    options,
      theme2,
      legendItems
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
        pointType: 'circle+icon+text',
        updateTriggers: {
          getIcon: getSvgIcons,
      },
        getText: (d: any) => d.properties?.style?.text,

      // conflicts with collision filter

        // getTextAlignmentBaseline: (d)=> {
        //    return d.properties?.style?.textConfig?.textBaseline ?? 'center'
        // },
        // getTextAnchor: (d)=> {
        //     return d.properties?.style?.textConfig?.textAlign ?? 'middle'
        // },

        getTextPixelOffset: (d)=> {

            let offsetX = 0
            let offsetY = 15
            // if (d.properties?.style?.textConfig) {
            //     ({offsetX, offsetY} = d.properties?.style?.textConfig)
            // }

            return [offsetX,offsetY]

        },
      getTextColor: (d) => {
          // @ts-ignore
          const {threshold, cluster, all_annots} = d.properties
          if (cluster) {return [0,0,0]}
          const {color: thresholdColor} = threshold
          if (all_annots && !legendItems.at(-1)?.disabled) {
              const annots: any = findClosestAnnotations(all_annots, time)
              const annotState = annots?.[0]?.newState

              const color = annotState?.startsWith('Normal') ? ALERTING_STATES.Normal : annotState === 'Alerting' ? ALERTING_STATES.Alerting : ALERTING_STATES.Pending
              return toRGB4Array(color)
          }
          return toRGB4Array(thresholdColor)
      },
        getTextSize: (d)=> {
            const size = d.properties?.style?.textConfig?.fontSize
        return size ?? 12
        },
      getFillColor: (d: any) => {

          const {threshold, all_annots} = d.properties
          const {color: thresholdColor} = threshold
          if (all_annots && !legendItems.at(-1)?.disabled) {
              const annots: any = findClosestAnnotations(all_annots, time)
              const annotState = annots?.[0]?.newState
              const color = annotState?.startsWith('Normal') ? ALERTING_STATES.Normal : annotState === 'Alerting' ? ALERTING_STATES.Alerting : ALERTING_STATES.Pending
              return toRGB4Array(color)
          }

          const opacity = d.properties?.style?.opacity
          const rgb4 = toRGB4Array(thresholdColor)
          if (opacity) {
              rgb4[3] = Math.round(opacity * 255);
          }

          return rgb4

      },
      stroke: true,
      getLineWidth: 0.5,
      // @ts-ignore
      getLineColor: (d: any) => {
          const {threshold, all_annots} = d.properties

          const {color: thresholdColor} = threshold
          if (all_annots && !legendItems?.at(-1)?.disabled) {
              const annots: any = findClosestAnnotations(all_annots, time)
              const annotState = annots?.[0]?.newState
              const color = annotState?.startsWith('Normal') ? ALERTING_STATES.Normal : annotState === 'Alerting' ? ALERTING_STATES.Alerting : ALERTING_STATES.Pending
              return toRGB4Array(color).slice(0,3)
          }

          const opacity = d.properties?.style?.opacity
          const rgb4 = toRGB4Array(thresholdColor)
          if (opacity) {
              rgb4[3] = Math.round(opacity * 255);
          }
          return rgb4
      },
        getPointRadius: (d) => {
          const isHead = getSelectedIp === d.properties?.locName

          const size =  d.properties?.style?.size

          return isHead ? size/2 * 1.3 : size/2
        },
        //pointRadiusScale: 0.3, //1,
        getIcon: (d) => {
          const {threshold} = d.properties
          const {iconName} = threshold

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

          // no custom svg icon loaded
          return {
            url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">  
</svg>`),
            width: 1,
            height: 1,
            id: 'blank'
          };
        },

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
       //alphaCutoff: -1,
        _subLayerProps: {
          "points-text": {
            extensions: [new CollisionFilterExtension()],
              collisionGroup: 'text',
              collisionTestProps:
                  {
                      sizeScale: 2.5,
                  },
             // unexpected effect with this on - some text invisible
             // fontSettings: {sdf: true},
          },
          "points-icon": {
            visible: getisShowSVG,
            extensions: [new CollisionFilterExtension()],
              collisionGroup: 'icons',
              // looks like props are shared across the group
              collisionTestProps:
                  {
                      sizeScale: 1.5,
                  }
          },
            "points-circle": {
                visible: getisShowPoints,
            },
        },

    // Styles
    filled: true,

    // Interactive props
    pickable,
    pickingDepth: 0,
    autoHighlight: true,
  })
}

export { IconsGeoJsonLayer }


