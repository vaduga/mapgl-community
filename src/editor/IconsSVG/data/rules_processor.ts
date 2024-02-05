import {
  DEFAULT_ICON_HEIGHT,
  DEFAULT_ICON_NAME2, DEFAULT_ICON_WIDTH,
} from '../../../components/defaults';
import {OverField} from '../svg-types';
import {FieldType} from "@grafana/data";


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
    defaultIconWidth: number = DEFAULT_ICON_WIDTH,
    defaultIconHeight: number = DEFAULT_ICON_HEIGHT
): { svgColor?: string; iconName: string, iconWidth: number, iconHeight: number} {

  const thresholds = getRulesWithOverridesCounts(properties, thresh).sort((a, b) => {
      return b.overrides - a.overrides
  });

  let currentIconName = defaultIconName;
  let currentIconWidth = defaultIconWidth;
  let currentIconHeight = defaultIconHeight;
  let currentColor
  let currentLevel = -1;

  if (!thresh.length || !thresholds.length) {
    return {
      svgColor: currentColor,
      iconName: defaultIconName,
      iconWidth: defaultIconWidth,
      iconHeight: defaultIconHeight
    }; // No Data
  }



  if (thresholds[0] && !thresholds?.[0]?.overrides) {
    return {
      svgColor: currentColor,
      iconName: defaultIconName,
      iconWidth: defaultIconWidth,
      iconHeight: defaultIconHeight
    };
  }

    const threshold = thresholds[0];
    if (true) {
      currentLevel = threshold.overrides;
      currentIconName = threshold.iconName;
      currentColor = threshold.svgColor;
    }


  return {
    svgColor: currentColor,
    iconName: currentIconName,
    iconWidth: currentIconWidth,
    iconHeight: currentIconHeight

  };

}

export { getIconRuleForFeature };
