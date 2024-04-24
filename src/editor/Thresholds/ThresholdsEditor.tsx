import React, { useState } from 'react';
import { orderBy } from 'lodash';
import {Button, useStyles2, useTheme, useTheme2} from '@grafana/ui';
import { v4 as uuidv4 } from 'uuid';
import {OverrideTracker, Threshold, ThresholdTracker} from './threshold-types';
import { ThresholdItem } from './ThresholdItem';
import {
  DEFAULT_LINE_WIDTH,
  DEFAULT_OK_COLOR_SELECTED_RGBA, DEFAULT_OK_COLOR_RGBA,
} from '../../components/defaults';
import {hexToRgba} from "../../utils/utils.plugin";
import {GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";
interface Props {
  thresholds: Threshold[];
  setter: any;
  disabled?: boolean;
  context: any
}
export const ThresholdsEditor: React.FC<Props> = (options) => {
  const {context} = options
  const eventBus = context.eventBus;
  const s = useStyles2(thresholdFieldStyles);
  const [tracker, _setTracker] = useState((): ThresholdTracker[] => {
    if (!options.thresholds) {
      const empty: ThresholdTracker[] = [];
      return empty;
    }
    const items: ThresholdTracker[] = [];
    options.thresholds.forEach((value: Threshold, index: number) => {
      items[index] = {
        threshold: value,
        order: index,
        ID: uuidv4(),
      };
    });
    return items;
  });
  // v9 compatible
  const theme2 = useTheme2();
  const oldTheme = useTheme();

  const setTracker = (v: ThresholdTracker[]) => {
    _setTracker(v);
    const allThresholds: Threshold[] = [];
    v.forEach((element) => {
      allThresholds.push(element.threshold);
    });
    eventBus?.publish({type: 'thresholdType', payload: {thresholds: allThresholds}})
    options.setter(allThresholds);
  };

  const updateThresholdOverrides = (index: number, overrides: OverrideTracker, value: number) => {
    if (!overrides) {
      return
    }

    tracker[index].threshold.overrides = overrides ;
    setTracker([...tracker]);
  };

  const updateThresholdValue = (index: number, value: number) => {
    tracker[index].threshold.value = Number(value);
    // reorder
    const allThresholds = [...tracker];
    const orderedThresholds = orderBy(allThresholds, ['threshold.value'], ['asc']) as ThresholdTracker[];
    setTracker([...orderedThresholds]);
  };

  const updateThresholdColor = (index: number, color: string) => {
    let useColor = color;
    if (typeof theme2.visualization !== 'undefined') {
      useColor = theme2.visualization.getColorByName(color);
    }
    tracker[index].threshold.color = hexToRgba(useColor);
    setTracker([...tracker]);
  };



  const updateLineWidth = (index: number, width: number) => {
    tracker[index].threshold.lineWidth = width;
    setTracker([...tracker]);
  };

  const updateThresholdLabel = (index: number, label: string) => {
    tracker[index].threshold.label = label;
    setTracker([...tracker]);
  };

  const removeThreshold = (index: number) => {
    const allThresholds = [...tracker];
    let removeIndex = 0;
    for (let i = 0; i < allThresholds.length; i++) {
      if (allThresholds[i].order === index) {
        removeIndex = i;
        break;
      }
    }
    allThresholds.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allThresholds.length; i++) {
      allThresholds[i].order = i;
    }
    setTracker([...allThresholds]);
  };

  const addItem = () => {
    const order = tracker.length;
    const aThreshold: Threshold = {
      overrides: [],
      color: DEFAULT_OK_COLOR_RGBA,
      lineWidth: DEFAULT_LINE_WIDTH,
      label: '',
      value: 0,
    };
    const aTracker: ThresholdTracker = {
      threshold: aThreshold,
      order: order,
      ID: uuidv4(),
    };
    setTracker([...tracker, aTracker]);
  };

  return (
      <>
        <Button className={s.addBtn} disabled={options.disabled} fill="solid" variant="primary" icon="plus" onClick={addItem}>
          Add Threshold
        </Button>
        {tracker &&
            tracker.map((tracker: ThresholdTracker, index: number) => {

              return (
                  <ThresholdItem
                      disabled={options.disabled || false}
                      key={`threshold-item-index-${tracker.ID}`}
                      ID={tracker.ID}
                      threshold={tracker.threshold}
                      colorSetter={updateThresholdColor}
                      //selColorSetter={updateThresholdSelColor}
                      lineWidthSetter={updateLineWidth}
                      valueSetter={updateThresholdValue}
                      labelSetter={updateThresholdLabel}
                      overrideSetter={updateThresholdOverrides}
                      remover={removeThreshold}
                      index={index}
                      context={options.context}
                  />
              );
            })}
      </>
  );
};

const thresholdFieldStyles = (theme: GrafanaTheme2) => {
  return {
    addBtn: css`
      margin-bottom: ${theme.spacing(1)};;      
    `,
  };
};



