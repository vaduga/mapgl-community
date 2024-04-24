import {Icon, useStyles2} from "@grafana/ui";
import React, {useEffect, useState} from "react";
import {useRootStore} from "../../utils";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {dateTime, GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";

export const PositionTracker = () => {

    const s = useStyles2(getStyles);
    const {pointStore, viewStore} = useRootStore()
    const {getSelCoord } = pointStore;

    function handleTextClick(id) {
        const coordinatesSpan = document.getElementById(id);
        if (coordinatesSpan) {
            const range = document.createRange();
            range.selectNode(coordinatesSpan);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }

    const coords = getSelCoord.coordinates.length? getSelCoord : {coordinates: [' ', ' '
], type: 'Point'
}

    return (
        <div className={s.posTracker}>
                <div>
                    <span onDoubleClick={()=>handleTextClick('coordinates')}>
                        <CopyToClipboard
                            text={JSON.stringify(getSelCoord)}
                            //onCopy={() => }
                        >
                        <Icon name="copy" size="xs" title="Copy GeoJSON" />
                    </CopyToClipboard>&nbsp;

                        <span id="coordinates">[<span onClick={()=>handleTextClick('lon')}><span id="lon">{coords.coordinates?.[0]}</span></span>,<span onClick={()=>handleTextClick('lat')}><span id="lat">{coords?.coordinates?.[1]}</span></span>]</span>
                        &nbsp;lon,lat
                        </span>
                </div>

        </div>
);
}

const getStyles = (theme: GrafanaTheme2) => ({
    posTracker: css`
        //margin-bottom: 5px;        
        margin-right: ${theme.spacing(1)};
          //position: absolute;
          z-index: 1;
          //bottom: ${theme.spacing(0.3)};
      font-size: x-small;
      // color: ${theme.colors.getContrastText(theme.colors.background.primary)};
      
        `

})
