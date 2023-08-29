import lineString from "turf-linestring";
import lineOffset from "@turf/line-offset";
import bearing from "@turf/bearing";
import turfbbox from "@turf/bbox";
import {Point, Position} from "geojson";
import {toJS} from "mobx";
import {DEFAULT_NUMS_COLOR} from "../components/defaults";
import {AggrTypes} from "../store/interfaces";

function toHex(rgbaColor) {
    // Parse the rgbaColor string to extract the red, green, blue, and alpha values
    const rgbaMatch = rgbaColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
    if (!rgbaMatch) {
        throw new Error('Invalid RGBA color string: ' + rgbaColor);
    }
    const red = parseInt(rgbaMatch[1], 10);
    const green = parseInt(rgbaMatch[2], 10);
    const blue = parseInt(rgbaMatch[3], 10);
    const alpha = parseFloat(rgbaMatch[4]);

    // Convert the red, green, and blue values to hexadecimal format
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');

    // Combine the hexadecimal values into a single string
    const hexColor = `#${redHex}${greenHex}${blueHex}`;

    // If the alpha value is not 1, add it to the end of the hexadecimal color code
    if (alpha !== 1) {
        const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return `${hexColor}${alphaHex}`;
    }

    return hexColor;
}

function makeColorLighter(color) {
    if (!color) {return `rgb(${[100,100,0].join(", ")})`;}
    const colorArr = color.match(/\d+/g); // extract the RGB values as an array
    const lightenedColorArr = colorArr.map(value => Math.min(Number(value) + 45, 255)); // add 25 to each value, ensuring the result is at most 255
    return `rgb(${lightenedColorArr.join(", ")})`; // convert the array back to a string and return it
}

function invertColor(color){
    const colorArr = color.match(/\d+/g); // extract the RGB values as an array
    const invertedColorArr = colorArr.map(value => 255 - Number(value)); // invert each value by subtracting it from 255
    return `rgb(${invertedColorArr.join(", ")})`; // convert the array back to a string and return it
}

const toRGB4Array = (rgbStr: string) => {
    const matches = rgbStr.match(/[\d.]+/g);
    if (matches === null || matches.length < 3) {
        return [0, 0, 0]
    }

    const rgba = matches.slice(0).map(Number) as number[]//RGBAColor;
    rgba[3] = (rgba[3] || 1) * 255;
    return rgba;
};

function hexToRgba(hexColor) {
    // Remove the "#" character from the beginning of the hexColor string
    if (hexColor.startsWith('#')) {
        hexColor = hexColor.slice(1);
    }

    // Check if the hexColor string includes an alpha channel value
    let alpha = 1;
    if (hexColor.length === 8) {
        alpha = parseInt(hexColor.substr(6, 2), 16) / 255;
        hexColor = hexColor.substr(0, 6);
    }

    // Convert the hexColor string to separate red, green, and blue components
    const red = parseInt(hexColor.substr(0, 2), 16);
    const green = parseInt(hexColor.substr(2, 2), 16);
    const blue = parseInt(hexColor.substr(4, 2), 16);

    // Return the RGBA color value in the "rgba(r, g, b, a)" format
    if (alpha !== 1) {
        return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(2)})`;
    } else {
        return `rgb(${red}, ${green}, ${blue})`;
    }
}

const getTurfAngle = (fromPointCoords, toPointCoords) => {
    if (!fromPointCoords || !toPointCoords) {
        return 0
    }
    let angle
    // Calculate the line vector
    const dx = toPointCoords[0] - toPointCoords[0];
    const dy = toPointCoords[1] - toPointCoords[1];

// Calculate the vector from the line to the viewer (assuming the viewer is at [0, 0])
    const vx = -fromPointCoords[0];
    const vy = -fromPointCoords[1];

// Calculate the cross-product of the two vectors
    const crossProduct = dx * vy - dy * vx;
    // Adjust the angle based on the sign of the cross-product
    angle = 90 - bearing(fromPointCoords, toPointCoords);
    if (Math.abs(angle) > 90) {
        if (crossProduct > 0) {
            angle = angle + 180;
        } else {
            angle = angle;
        }
    }
    return angle
}

const defaultCenter = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [-74.0060, 40.7128],  // New York
    },
    properties: {}
}

/// deprecated
const stringify4D = (coords, parPathComments)=> {
    const coords4D = coords
        .map((coord) => {
            const comment = parPathComments?.get(''+coords); // Get the comment from comment map using the lon+lat as the key
            if (Array.isArray(coord[0])) {return JSON.stringify([...coord, 0, comment]) }; // Add the 3D number to the coordinate array
            return JSON.stringify([coord, 0, comment])
        });
    return coords4D
}

// Helper function to find nearby points within a tolerance range
function findNearbyNodes(coordinate, features, tolerance) {

    if (!coordinate.length) {return []}

    const snappedPoint = coordinate;

    // Compare the snapped point with other points in the dataset
    const nearbyPoints = features.filter((dataPoint) => {
        const types = AggrTypes

        if (!types.includes(dataPoint.properties.aggrType)) {return}

        const dataPointCoordinates = dataPoint.geometry.coordinates?.[0]?.[0];
        if (!dataPointCoordinates) {return false}

        // Calculate the absolute difference between coordinates
        const diffX = Math.abs(snappedPoint[0] - dataPointCoordinates[0]);
        const diffY = Math.abs(snappedPoint[1] - dataPointCoordinates[1]);

        // Check if the point falls within the tolerance range

        return diffX <= tolerance && diffY <= tolerance;
    });

    return nearbyPoints;


}

function getBounds(points) {
    const featureCollection = {
        type: 'FeatureCollection',
        features: points,
    };
    const bounds = turfbbox(featureCollection)
    return bounds;
}

function genParPathText(lineFeature) {

    if (!lineFeature) {return null}

    const path = lineFeature?.properties.parPathCoords
    const pathExists = Array.isArray(path)
    let flatArr = pathExists ? path : [] //.reduce((acc, val) => acc.concat(val), []) : []

    const parPathText = flatArr?.length > 0 ? flatArr.map((coord, i) => {

        return {
            text: i + 1 + '',
            coordinates: coord,
            color: DEFAULT_NUMS_COLOR
        }
    }) : []
    return parPathText
}

// used for insta-render of parentPath line onEditing lines/icons
function genParentLine(selFeature, lineSwitchMap){
    if (!selFeature) { return []}
    type CoordsAndColor = [Position[], string]
    const lineStringCoords: CoordsAndColor[] | [] = [];
    const pLinePoints = [selFeature]
    const parPath = selFeature?.properties.parPath


    for (let i = 1; i < parPath?.length; i++) {
        const p = parPath[i];
        const prevP = parPath[i - 1];

        const feature = typeof p === 'string' ? lineSwitchMap?.get(p) : null;
        pLinePoints.push(feature);
        let addFeatIconColor = feature?.properties?.threshold?.color
        const currType = feature?.properties.aggrType;
        const currLoc = feature?.properties.locName
        const currFeaturePath = feature?.properties.parPath

        const prevFeature = typeof prevP === 'string' ? lineSwitchMap?.get(prevP) : null;

        const prevType = prevFeature?.properties?.aggrType
        const prevLoc = prevFeature?.properties?.locName
        let addPrevFeatIconColor = prevFeature?.properties?.threshold?.color
        const prevFeaturePath = prevFeature?.properties.parPath

        if (
            (typeof p === 'string' && typeof prevP === 'string') ||
            Array.isArray(p) || Array.isArray(prevP) && (feature || prevFeature)
        ) {

            let coordinates;
            if (AggrTypes.includes(prevType) &&
                AggrTypes.includes(currType)
            ) {

                const fromPrevToCurr = prevFeaturePath && (prevFeaturePath[prevFeaturePath.length - 1] === currLoc) ? prevFeaturePath : [];
                const fromCurrToPrev = currFeaturePath && (currFeaturePath[currFeaturePath.length - 1] === prevLoc) ? currFeaturePath : [];

                if (fromPrevToCurr.length > 0 || fromCurrToPrev.length > 0) {
                    const path = fromPrevToCurr.length>0 ? fromPrevToCurr : fromCurrToPrev
                    const iconColor = fromPrevToCurr.length>0 ? addPrevFeatIconColor : addFeatIconColor
                    const addon: Position[] = path.map((a) => {

                        if (typeof a === 'string') {
                            const addFeature = lineSwitchMap?.get(a)
                            const type = addFeature?.properties.aggrType
                            const geometry = addFeature?.geometry as Point
                            const addCoord = (geometry && geometry.coordinates && geometry.coordinates.length > 0)
                                ? geometry.coordinates[0][0] ?? null : null

                            return addCoord
                        } else if (Array.isArray(a)) {
                            return a
                        } else {
                            return null
                        }

                    }).filter(el=> el !== null)
                    //console.log('addon', addon)
                    // @ts-ignore
                    lineStringCoords.push([addon, iconColor ?? selFeature.properties?.threshold?.color])
                    continue
                }
            }
            let featIconColor, prevFeatIconColor
            if (typeof p === 'string') {
                const feature = lineSwitchMap?.get(p);
                featIconColor = feature?.properties?.threshold?.color
                const geometry = feature?.geometry as Point;
                coordinates = (geometry?.coordinates?.length > 0)
                    ? geometry.coordinates[0][0] ?? geometry.coordinates ?? null : null
            } else {
                coordinates = p
            }

            let prevCoordinates;
            if (typeof prevP === 'string') {
                const prevFeature = lineSwitchMap?.get(prevP);
                prevFeatIconColor = prevFeature?.properties?.threshold?.color
                const prevGeometry = prevFeature?.geometry as Point;
                prevCoordinates = (prevGeometry && prevGeometry.coordinates && prevGeometry.coordinates.length > 0)
                    ? prevGeometry.coordinates[0][0] ?? prevGeometry.coordinates ?? null : null
            } else {
                prevCoordinates = prevP;
            }

            // @ts-ignore
            lineStringCoords.push([[prevCoordinates, coordinates], AggrTypes.includes(prevType) &&
            AggrTypes.includes(currType) ? prevFeatIconColor : selFeature.properties?.threshold?.color]);
        }
    }

    //console.log('lineStringCoords', toJS(lineStringCoords))
// @ts-ignore
    return [pLinePoints.filter(el=>el), lineStringCoords.filter(el=> !el[0].includes(null))]


}

function genExtendedPLine(selFeature , lineSwitchMap) {
    let pathCoords: Position[] = [];
    let nextSegment
    const occurences: string[] = []
//return pathCoords

    if (selFeature) {
        const {locName, parName} = selFeature.properties
        occurences.push(locName)

        let initParent = lineSwitchMap.get(parName)

        if (!initParent) {
            return;
        }

        let nextParent = initParent;


        while (nextParent) {
            const {locName} = nextParent.properties
            if (occurences.includes(locName)) {
                // Check for infinite loop
                console.log('circuit in pline');   /// #TODO do test for short circuit
                break;
            }
            occurences.push(locName)

            nextSegment = genParentLine(nextParent, lineSwitchMap)[1] || undefined;
            //console.log('nextSegment', toJS(nextSegment))

            if (nextSegment?.length>0) {

                pathCoords.push(nextSegment) //.reduce((acc,cur,i)=> acc.concat(cur), []))

            }

            const parent = nextParent?.properties.parName;
            nextParent = parent && lineSwitchMap?.get(parent)

        }
    }
    return pathCoords.reduce((acc,cur)=> acc.concat(cur), [])

};

function genNodeNamesText(iconFeatures){

    const nodeNames = iconFeatures?.filter(el=>AggrTypes.includes(el?.properties.aggrType))
        .map((node)=> {
            const {locName, isInParentLine, threshold } = node?.properties
            const {color, selColor}= threshold
            const geometry = node?.geometry as Point
            return {text: locName, coordinates: geometry.coordinates ?? [0,0], color: isInParentLine ? selColor:color}
        })
    return nodeNames
}

function genNodeConnectionsText(selFeature, getNodeConnections, switchMap) {

    if (!selFeature) {
        return []
    }
    const selLine = switchMap?.get(selFeature.properties.locName)

    if (!selLine) {
        return []
    }

    const {properties } = selLine
    const geometry = selLine.geometry as Point
    const cons = getNodeConnections.get(properties.locName)
    const parent = switchMap?.get(properties.parName)
    const parGeometry = parent?.geometry as Point

    const locCoords = (geometry && geometry.coordinates && geometry.coordinates.length > 0)
        ? geometry.coordinates[0][0] ?? null : null
    const parCoords = (parGeometry && parGeometry.coordinates && parGeometry.coordinates.length > 0)
        ? parGeometry.coordinates[0][0] ?? null : null

    if (!locCoords || !parCoords) {
        return []
    }

    const angle = getTurfAngle(locCoords, parCoords)
    const color = properties?.threshold?.color




    let toText = cons?.to.map(el=>el.locName)
    if (toText?.length>0) {
        toText.splice(0,0,'<\n' )
        toText[toText.length - 1] = toText.at(-1) + '\n<'
    }

    let fromText = cons?.from.map(el=>el.locName)
    if (fromText?.length>0) {
        fromText[0] = '>\n' + fromText[0]
        fromText[fromText.length - 1] = fromText.at(-1) + '\n'+'>\n'
    }

    const nodeConnectionsText = selFeature && parent && cons ?

        {to: [{text: toText.join('\n'), coordinates: [locCoords, parCoords ], color, angle
            }],
            from: [{text: fromText.join('\n'), coordinates: [locCoords, parCoords ], color, angle
            }]
        } : {to: [], from: []}



    return nodeConnectionsText
}


function isNode(item, switchMap){

    if (typeof item === 'string') {
        const type = switchMap.get(item)?.properties.aggrType
        return (AggrTypes.includes(type))
    }
    return false
}

// Interface to define RGB object
interface RGB {
    r: number;
    g: number;
    b: number;
}

// Dictionary of color names and their corresponding RGB values
const colorNames: { [name: string]: RGB } = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    // Add more colors as needed
};

// Function to convert a color to RGBA string
function colorToRGBA(color: string, alpha = 1): string | null {
    if (!color) {return `rgba(600,200,0)`}
    // Check if the input color is a valid hexadecimal value
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        // If it's a valid hex color, convert it to RGB
        const hexValue = color.length === 4 ? color.substring(1).repeat(2) : color.substring(1);
        const rgb: RGB = {
            r: parseInt(hexValue.substring(0, 2), 16),
            g: parseInt(hexValue.substring(2, 4), 16),
            b: parseInt(hexValue.substring(4, 6), 16),
        };
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    // If the color is not a valid hex, check if it's a valid color name
    const lowercaseColor = color.toLowerCase();
    if (colorNames[lowercaseColor]) {
        const { r, g, b } = colorNames[lowercaseColor];
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // If neither hex nor color name is valid, return null
    return null;
}


function getFirstCoordinate(geojson) {
    if (!geojson) {return undefined;}

    if (geojson.type === 'Point') {
        return geojson.coordinates;
    } else if (geojson.type === 'MultiPoint' || geojson.type === 'LineString') {
        return geojson.coordinates[0];
    } else if (geojson.type === 'Polygon' || geojson.type === 'MultiLineString') {
        return geojson.coordinates[0][0];
    } else if (geojson.type === 'MultiPolygon') {
        return geojson.coordinates[0][0][0];
    }

    return undefined;
}

function findRelatedLines({
                              locName,
                              lineFeatures,
                          }){


    if (!lineFeatures.length) {return []}
    const lines = lineFeatures
    const relLines: any = []
    lineFeatures.forEach((lineFeat, featIdx)=>{
        lineFeat.properties.parPath.forEach((point, pathIdx)=> {
            if (point === locName) {
                const line = lines[featIdx]
                const segrPathVisible = line.properties.segrPathVisible
                segrPathVisible.forEach((segm, multiLineIdx) =>{
                    segm.forEach((p,subLineIdx)=> {
                        if (p.item === locName) {

                            relLines.push({featIdx, ...lineFeat, multiLineIdx, subLineIdx, gIdx: p.gIdx})
                        }})
                })
            }
        })
    })

    return relLines


}

function findChildLines({   locName,
                            lineFeatures,}){
    if (!lineFeatures.length) {return []}
    return lineFeatures.filter(lineFeat=>
        lineFeat.properties.parName === locName  )
}

function offsetRelatedLines({ idx, locName, lineFeatures, newCoord }) {
    if (!lineFeatures?.length) {
        return [];
    }

    const lines = [...lineFeatures];
    const relLines = findChildLines({ locName, lineFeatures:lines });

    const numRelLines = relLines.length;

    relLines.forEach((feat, index) => {
        const coords = feat?.geometry?.coordinates;

        if (coords.length) {
            const lastMultiLine = coords[coords.length - 1];
            const segmLines = lineFeatures[idx].geometry.coordinates
            const length = segmLines.length
            const mixedLine = [segmLines[length-1][0], newCoord]
            const offsetLine = lineOffset(lineString(mixedLine), 0.1*index, {units: 'meters'});

            const offCoords = offsetLine.geometry.coordinates;


            const lastOffSetPoint = offCoords[offCoords.length - 1] //.map(c=>parseFloat(c.toFixed(6)))
            const lastPoint = lastMultiLine[lastMultiLine.length - 1];

            lastPoint[0] = lastOffSetPoint[0]
            lastPoint[1] = lastOffSetPoint[1]

            feat.geometry.coordinates[coords.length - 1] = lastMultiLine;
        }
    });

    return lines;
}


export {
    toRGB4Array, colorToRGBA, getFirstCoordinate, toHex, hexToRgba, getBounds, getTurfAngle, stringify4D, findNearbyNodes, makeColorLighter, genParPathText,
    genParentLine, genExtendedPLine, genNodeNamesText, genNodeConnectionsText,findRelatedLines, offsetRelatedLines, findChildLines
}
