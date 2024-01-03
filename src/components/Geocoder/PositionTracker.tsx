import {HorizontalGroup, Icon, useStyles2} from "@grafana/ui";
import React, {useEffect, useState} from "react";
import {useRootStore} from "../../utils";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";

export const PositionTracker = () => {
    const s = useStyles2(getStyles);
    const {pointStore, viewStore} = useRootStore()
    const {getSelCoord } = pointStore;

    const [isShowCoord, setIsShowCoord] = useState(true)
    useEffect(() => {
        setIsShowCoord(getSelCoord?.coordinates?.length > 0)
    }, [getSelCoord])


    return (
        <div className={s.posTracker}>
        {isShowCoord && (

                <HorizontalGroup>
                    lon/lat: <span>[{getSelCoord?.coordinates?.[0]}, {getSelCoord?.coordinates?.[1]}]&nbsp;
                    <CopyToClipboard
                        text={JSON.stringify(getSelCoord)}
                        onCopy={() => setIsShowCoord(false)}
                    >
                        <Icon name="copy" size="xs" title="Copy GeoJSON" />
                    </CopyToClipboard>
                    </span>
                </HorizontalGroup>
        ) }
        </div>
);
}

const getStyles = (theme: GrafanaTheme2) => ({
    posTracker: css`          
          position: absolute;
          z-index: 1;
          bottom: 20px;
      left: 2%;
      transform: translateX(-2%);
        `

})
