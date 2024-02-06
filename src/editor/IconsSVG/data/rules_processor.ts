import {
  DEFAULT_ICON_NAME2, DEFAULT_ICON_SIZE, DEFAULT_SVG_ICON_V_OFFSET
} from '../../../components/defaults';
import {OverField} from '../svg-types';
import {FieldType} from "@grafana/data";
import {toJS} from "mobx";


function countMatchingKeysAndValues(props, overrides) {
  //console.log('overrides', overrides)
  const allKeysMatched = overrides.every((override) => {
    const key = override.name;
    return props.hasOwnProperty(key);
  });

  if (allKeysMatched) {
    const allValuesMatched = overrides.every((override: OverField) => {
      const key = override.name;
      let valuesArr: any = [];
      if (override.type === FieldType.number) {
        valuesArr = override.value.split(',').map(el => parseInt(el, 10));
      } else {
        valuesArr = override.value.split(',').map(el=>el.trim());
      }

      const pointValue = props[key];
      return valuesArr.includes(pointValue);

    });

    if (allValuesMatched) {
      return overrides.length;
    }
  }

  return -1;
}

const getRulesWithOverridesCounts = (properties, thresholds) => thresholds.map((item) => ({
  ...item, overrides: countMatchingKeysAndValues(properties, item.overrides),
})).filter((item) => item.overrides !== -1)

function getIconRuleForFeature(
    properties: any,
    thresh: [] = [],
    defaultIconName: string = DEFAULT_ICON_NAME2,
    defaultIconSize: number = DEFAULT_ICON_SIZE,
    defaultIconVOffset: number = DEFAULT_SVG_ICON_V_OFFSET
): { svgColor?: string; iconName: string, iconSize: number, iconVOffset: number} {

  const thresholds = getRulesWithOverridesCounts(properties, thresh).sort((a, b) => {
      return b.overrides - a.overrides
  });

  let currentIconName = defaultIconName;
  let currentIconSize = defaultIconSize;
  let currentIconVOffset = defaultIconVOffset
  //let currentColor
  //let currentLevel = -1;

  if (!thresh.length || !thresholds.length) {
    return {
      //svgColor: currentColor,
      iconName: defaultIconName,
      iconSize: defaultIconSize,
      iconVOffset: defaultIconVOffset
    }; // No Data
  }



  if (thresholds[0] && !thresholds?.[0]?.overrides) {
    const threshold: any = thresh.find((el: any)=> el.overrides.length === 0)
    if (threshold) {
      return {
        //svgColor: threshold.svgColor,
        iconName: threshold.iconName,
        iconSize: threshold.iconSize,
        iconVOffset: threshold.iconVOffset
      };
    }
    else {
      return {
        //svgColor: currentColor,
        iconName: defaultIconName,
        iconSize: defaultIconSize,
        iconVOffset: defaultIconVOffset
      };
    }

  }

    const threshold = thresholds[0];
    if (true) {
      //currentLevel = threshold.overrides;
      currentIconName = threshold.iconName;
      currentIconSize = threshold.iconSize;
      currentIconVOffset = threshold.iconVOffset;
      //currentColor = threshold.svgColor;
    }


  return {
    //svgColor: currentColor,
    iconName: currentIconName,
    iconSize: currentIconSize,
    iconVOffset: currentIconVOffset

  };

}

export { getIconRuleForFeature };
