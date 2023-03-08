import {
  DEFAULT_COLOR_LABEL,
  DEFAULT_LINE_WIDTH,
  DEFAULT_NO_DATA_COLOR_RGBA,
  DEFAULT_NO_DATA_COLOR_SELECTED_RGBA
} from '../../../components/defaults';
import {Threshold} from '../types';

function getThresholdForValue(
    properties: any,
    value: number | null | undefined,
    thresh: Threshold[] = [],
    defaultColor: string = DEFAULT_NO_DATA_COLOR_RGBA,
    defaultSelColor: string = DEFAULT_NO_DATA_COLOR_SELECTED_RGBA,
    defaultLineWidth: number = DEFAULT_LINE_WIDTH,
    defaultColorLabel: string = DEFAULT_COLOR_LABEL
): { color: string; selColor: string; lineWidth: number, label: string } {
  const thresholds = thresh.sort((a, b) => a.value - b.value)

  let currentColor = defaultColor;
  let currentSelColor = defaultSelColor;
  let currentLineWidth = defaultLineWidth;
  let currentColorLabel = 'ok'//defaultColorLabel;


  if (value === null || value === undefined) {
    return {
      color: defaultColor,
      selColor: defaultSelColor,
      lineWidth: defaultLineWidth,
      label: defaultColorLabel,
    }; // No Data
  }

  const thresholdCount = thresholds.length;

  if (thresholdCount === 0) {
    return {
      color: defaultColor,
      selColor: defaultSelColor,
      lineWidth: defaultLineWidth,
      label: defaultColorLabel,
    };
  }


  for (let i = thresholdCount - 1; i >= 0; i--) {
    const threshold = thresholds[i];
    if (threshold.value <= value) {
      currentColor = threshold.color;
      currentSelColor = threshold.selColor;
      currentLineWidth = threshold.lineWidth;
      currentColorLabel = threshold.label;
      break;
    }
  }

  return {
    color: currentColor,
    selColor: currentSelColor,
    lineWidth: currentLineWidth,
    label: currentColorLabel,
  };

}

export { getThresholdForValue };
