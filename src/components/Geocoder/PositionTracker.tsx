import {HorizontalGroup, Icon, Stack, useStyles2} from "@grafana/ui";
import React, {useEffect, useState} from "react";
import {useRootStore} from "../../utils";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {dateTime, GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";

export const PositionTracker = () => {

    const s = useStyles2(getStyles);
    const {pointStore, viewStore} = useRootStore()
    const {getSelCoord } = pointStore;

    const [isShowCoord, setIsShowCoord] = useState(true)
    useEffect(() => {
        setIsShowCoord(getSelCoord?.coordinates?.length > 0)
    }, [getSelCoord])

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

    return (
        <div className={s.posTracker}>
        {isShowCoord && (

                <div>
                    {getSelCoord && isShowCoord && <span onDoubleClick={()=>handleTextClick('coordinates')}>lon,lat: <span id="coordinates">[<span onClick={()=>handleTextClick('lon')}><span id="lon">{getSelCoord?.coordinates?.[0]}</span></span>,<span onClick={()=>handleTextClick('lat')}><span id="lat">{getSelCoord?.coordinates?.[1]}</span></span>]</span>&nbsp;
                    <CopyToClipboard
                        text={JSON.stringify(getSelCoord)}
                        onCopy={() => setIsShowCoord(false)}
                    >
                        <Icon name="copy" size="xs" title="Copy GeoJSON" />
                    </CopyToClipboard>&nbsp;

                        </span>
                    }
                </div>
        ) }
        </div>
);
}

const getStyles = (theme: GrafanaTheme2) => ({
    posTracker: css`          
          position: absolute;
          z-index: 1;
          bottom: 20px;
      font-size: small;
      // color: ${theme.colors.getContrastText(theme.colors.background.primary)};
      left: 1.3%;
      //transform: translateX(-2%);
        `

})
