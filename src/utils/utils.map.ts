import {ExtendMapLayerOptions} from "../extension";
import {config} from "@grafana/runtime";
import {DEFAULT_BASEMAP_CONFIG, defaultBaseLayer, geomapLayerRegistry} from "../layers/registry";
import {MapViewConfig} from "../types";
import {centerPointRegistry} from "../view";
import {Position} from "geojson";

const statusGuard = (status) => {
    return (status === null || status === undefined) ? "unknown" :
        ["0", 0].includes(status) ? 0 :
            ["1", 1].includes(status) ? 1 :
                "unknown";
}

const metricGuard =(...args) => {
    let result = 0;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === "number" || /^[0-9]+$/.test(arg)) {
            result = parseInt(arg, 10);
            break;
        }
    }
    return result;
}

const initBasemap = (cfg: ExtendMapLayerOptions, setSource, setHasLoaded, theme2) => {
    // if (!this.map) {
    //     return;
    // }

    if (!cfg?.type || config.geomapDisableCustomBaseLayer) {
        cfg = DEFAULT_BASEMAP_CONFIG;
    }
    const item = geomapLayerRegistry.getIfExists(cfg.type) ?? defaultBaseLayer ?? {};

    const handler = item && item.create ? item?.create(cfg, theme2) : {}
    const layer = handler?.init?.() ?? {};
    setSource(layer)
}

const initMapView = (config: MapViewConfig) => {
    let view = {
        id: config.id,
        longitude: 0,
        latitude: 0,
        zoom: 1,
    }

    const v = centerPointRegistry.getIfExists(config.id);
    if (v) {
        let coord: Position | undefined = undefined;
        let zoom: number | undefined

        if (v.lat === undefined || config.zoom !== 4) {
            coord = [config.lon ?? 0, config.lat ?? 0];
            zoom = config.zoom;
        } else {
            coord = [v.lon ?? 0, v.lat ?? 0];
            zoom = v.zoom;
        }
        if (coord) {
            view.longitude = coord[0]
            view.latitude = coord[1]
        }
        if (zoom) {
            view.zoom = zoom;
        }
    }
    return view;
}




export { initBasemap, initMapView
}
