import {Point} from "geojson";

function getMiddleCoords(coord1, coord2) {
    return [(coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2].map(c => parseFloat(c.toFixed(6)));
}

function get2MiddleCoords(coord1, coord2) {
    const segment1 = [
        (2 * coord1[0] + coord2[0]) / 3,
        (2 * coord1[1] + coord2[1]) / 3
    ];

    const segment2 = [
        (coord1[0] + 2 * coord2[0]) / 3,
        (coord1[1] + 2 * coord2[1]) / 3
    ];

    return [segment1, segment2];
}

function SingleCoordsConvert(pathItem, switchMap) {

    if (typeof pathItem === 'string') {
        const feature = switchMap?.get(pathItem)
        const geometry = feature?.geometry as Point
        const coord = geometry?.coordinates

        return coord ? coord : null
    } else if (Array.isArray(pathItem)) {
        return pathItem} else {return null}

}

function CoordsConvert(subPath, switchMap) {
    return subPath.map(p=> {
        return SingleCoordsConvert(p.item, switchMap)
    }).filter(el=>el)
}

export {
    CoordsConvert, SingleCoordsConvert, get2MiddleCoords, getMiddleCoords
}

