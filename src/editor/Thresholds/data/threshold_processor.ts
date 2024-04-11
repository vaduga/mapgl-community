import {
  DEFAULT_COLOR_LABEL,
  DEFAULT_LINE_WIDTH,
  DEFAULT_NO_DATA_COLOR_RGBA,
} from '../../../components/defaults';
import {OverField, Threshold} from '../threshold-types';
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

const getThresholdsWithOverridesCounts = (properties, thresholds) => thresholds.map((item) => ({
  ...item, overrides: countMatchingKeysAndValues(properties, item.overrides),
})).filter((item) => item.overrides !== -1)

function getThresholdForValue(
    properties: any,
    value: number | null | undefined,
    thresh: Threshold[] = [],
    defaultColor: string = DEFAULT_NO_DATA_COLOR_RGBA,
    defaultLineWidth: number = DEFAULT_LINE_WIDTH,
    defaultColorLabel: string = DEFAULT_COLOR_LABEL
): { color: string; lineWidth: number, label: string } {
  const thresholds = getThresholdsWithOverridesCounts(properties, thresh).sort((a, b) => {
    if (a.value === b.value) {
      return a.overrides - b.overrides;
    } else {
      return a.value - b.value;
    }


  });
  //console.log(thresholds)
  let currentColor = defaultColor;
  let currentLineWidth = defaultLineWidth;
  let currentColorLabel = 'unknown'//defaultColorLabel;
  let currentLevel = -1;

  if (value === null || value === undefined) {
    return {
      color: defaultColor,
      lineWidth: defaultLineWidth,
      label: defaultColorLabel,
    }; // No Data
  }

  const thresholdCount = thresholds.length;

  if (thresholdCount === 0) {
    return {
      color: defaultColor,
      lineWidth: defaultLineWidth,
      label: defaultColorLabel,
    };
  }


  for (let i = thresholdCount - 1; i >= 0; i--) {
    const threshold = thresholds[i];
    if (threshold.value <= value) {
      currentLevel = threshold.overrides;
      currentColor = threshold.color;
      currentLineWidth = threshold.lineWidth;
      currentColorLabel = threshold.label;

      break;

    }
  }

  return {
    color: currentColor,
    lineWidth: currentLineWidth,
    label: currentColorLabel,
  };

}

export { getThresholdForValue };
