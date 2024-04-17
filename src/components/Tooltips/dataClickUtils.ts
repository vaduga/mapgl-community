import {parDelimiter} from "../defaults";
import {Point} from "geojson";
import {AggrTypes, ViewState} from "../../store/interfaces";
import turfCenter from "@turf/center";
import {libreMapInstance} from "../Mapgl";


export const expandTooltip = (info, event, dataClickProps) => {

    const {setSelCoord,
        setClosedHint,
        switchMap,
        getMode,
        setShowCenter,
        setCPlotCoords,
        setIsRenderNums,
    setTooltipObject,
    setSelectedIp,
        setLocalViewState,
        setHoverCluster,
    setHoverInfo
    } = dataClickProps
    const position = info.coordinate
    if (position) {
        const [longitude, latitude,] = position.map(e => parseFloat(e.toFixed(6)))

        setSelCoord(
            {
                coordinates: [longitude, latitude],
                type: "Point"
            })
    }

    if (info.picked) {
        const {properties, id} = info.object
        const {locName: ip, parPath} = properties

        if (ip) {
            const {aggrType, colType} = properties
            setClosedHint(false);
            const layerId = info.sourceLayer?.id
            const lineId = layerId?.startsWith('edit-lines') ? id : null

            const ipDelimited = ip?.split(parDelimiter)[0]
            const geom = switchMap?.get(ipDelimited)?.geometry as Point

            const OSM = libreMapInstance?.getZoom()
            if (geom && getMode !== 'modify')
            {
                const [longitude, latitude] = geom?.coordinates
                setShowCenter(true)
                setCPlotCoords(
                    {
                        longitude,
                        latitude,
                        zoom: OSM ? OSM : 18,
                        maxPitch: 45 * 0.95,
                        bearing: 0,
                        pitch: 0
                    }
                )
            }

            const isAggr = AggrTypes.includes(aggrType)
            setIsRenderNums(!isAggr)
            setTooltipObject(info); // this pins tooltip
            setSelectedIp(ip, lineId ? [lineId] : null)


        } else if (properties?.objects?.length && !properties?.isHull) {
            // zoom on cluster click
            const featureCollection = {
                type: 'FeatureCollection',
                features: properties.objects,
            };

            // @ts-ignore
            const center = turfCenter(featureCollection)
            const [longitude, latitude] = center.geometry.coordinates;
            const expansionZoom = properties.expZoom
            const newState = {
                longitude,
                latitude,
                zoom: expansionZoom,
                transitionDuration: 250,
                maxPitch: 45 * 0.95,
                rnd: Math.random()   /// to trigger zoom in/out on repeat click the same cluster
            }
            setLocalViewState(newState as ViewState);
        }
    } else {
        // reset tooltip by clicking blank space
        setHoverCluster(null)
        setHoverInfo({})
        setShowCenter(true)
        setSelectedIp('');
        setClosedHint(true);
        setTooltipObject({});

    }
}
