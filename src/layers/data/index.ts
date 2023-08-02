import { markersLayer } from './markersLayer';
import { polygonsLayer } from './polygonsLayer';
import { pathLayer } from './pathLayer';


/**
 * Registry for layer handlers
 */
export const dataLayers = [
    markersLayer,
    polygonsLayer,
    pathLayer
];
