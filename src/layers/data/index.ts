import { markersLayer } from './markersLayer';
import { polygonsLayer } from './polygonsLayer';
import { geojsonLayer } from './geojsonLayer';
import { pathLayer } from './pathLayer';


/**
 * Registry for layer handlers
 */
export const dataLayers = [
    markersLayer,
    polygonsLayer,
    pathLayer,
    geojsonLayer
];
