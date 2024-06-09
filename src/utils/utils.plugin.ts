import bearing from "@turf/bearing";
import turfbbox from "@turf/bbox";
import {Geometry, LineString, Point, Position} from "geojson";
import {toJS} from "mobx";
import {ALERTING_STATES, DEFAULT_NUMS_COLOR, parDelimiter} from "../components/defaults";
import {
    AggrTypes,
    DeckLine,
    Feature,
    ParentInfo,
    PointFeatureProperties,
    RGBAColor,
    Sources,
    Vertices
} from "../store/interfaces";

import {SelectableValue} from "@grafana/data";



function parseObjFromString(str) {
    // Regular expression to extract key-value pairs
    const regex = /(\w+)\s*=\s*(\w+)/g;
    const matches = str.match(regex);

    if (!matches) {
        return null; // Return null if no matches found
    }

    // Create an object to store key-value pairs
    const obj = {};

    // Iterate over matches and populate the object
    matches.forEach(match => {
        const [_, key, value] = match.match(/(\w+)\s*=\s*(\w+)/);
        obj[key] = value;
    });

    return obj;
}

function findClosestAnnotations(annotations, selectedTime): [] {

    if (!annotations?.length) {
        return []
    }
    if (!selectedTime) {
        return annotations.map(innerArray => innerArray.at(-1))
    }

    const closestAnnotations: any = [];

    for (const innerArray of annotations) {
        let left = 0;
        let right = innerArray.length - 1;
        let closestAnnotation: any = null;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const annotation = innerArray[mid];

            if (annotation.timeEnd <= selectedTime) {
                closestAnnotation = annotation;
                left = mid + 1; // Look in the right half
            } else {
                right = mid - 1; // Look in the left half
            }
        }

        if (closestAnnotation) {
            closestAnnotations.push(closestAnnotation);
        }
    }

    const sortedClosestAnnotations = closestAnnotations.sort((a, b) => {
        const stateOrder = { 'Alerting': 1, 'Pending': 2, 'Normal': 3 };

        const stateA = a.newState.startsWith('Alerting') ? 'Alerting' :
            a.newState.startsWith('Pending') ? 'Pending' : 'Normal';

        const stateB = b.newState.startsWith('Alerting') ? 'Alerting' :
            b.newState.startsWith('Pending') ? 'Pending' : 'Normal';

        return stateOrder[stateA] - stateOrder[stateB];
    });
    return sortedClosestAnnotations
}


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
    if (!color) {
        return `rgba(${[100, 100, 0, 1].join(", ")})`; // default to opaque yellow if color is not provided
    }
    const colorArr = color.match(/\d+(\.\d+)?/g);
    if (colorArr.length === 3) {
        colorArr.push('1');
    }
    const lightenedColorArr = colorArr.map((value, index) => {
        if (index === 3) {return Math.min(Number(value), 1);} // don't lighten opacity
        return Math.min(Number(value) + 45, 255); // lighten RGB values
    });
    return `rgba(${lightenedColorArr.join(", ")})`
}

function makeColorDarker(color) {
    if (!color) {
        return `rgba(${[100, 100, 0, 1].join(", ")})`; // default to opaque yellow if color is not provided
    }
    const colorArr = color.match(/\d+(\.\d+)?/g);
    if (colorArr.length === 3) { // if only RGB values are provided, assume opacity 1 (fully opaque)
        colorArr.push('1');
    }
    const darkenedColorArr = colorArr.map((value, index) => {
        if (index === 3) {return Math.min(Number(value), 1);} // don't darken opacity
        return Math.max(Number(value) - 45, 0); // darken RGB values
    });
    return `rgba(${darkenedColorArr.join(", ")})`;
}

function invertColor(color){
    const colorArr = color.match(/\d+/g); // extract the RGB values as an array
    const invertedColorArr = colorArr.map(value => 255 - Number(value)); // invert each value by subtracting it from 255
    return `rgb(${invertedColorArr.join(", ")})`; // convert the array back to a string and return it
}

const toRGB4Array = (rgbStr: string) => {
    const matches = rgbStr.match(/[\d.]+/g);
    if (matches === null || matches.length < 3) {
        return [0, 0, 0] as RGBAColor
    }

    const rgba = matches.slice(0).map(Number) as number[]//RGBAColor;
    rgba[3] = (rgba[3] || 1) * 255;
    return rgba as RGBAColor;
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

function getBounds(points) {
    const featureCollection = {
        type: 'FeatureCollection',
        features: points,
    };
    const bounds = turfbbox(featureCollection as any)
    return bounds;
}

function parseIfPossible(dsParents) {
    if (dsParents && (dsParents.startsWith('[') || !parseInt(dsParents, 10))) {
        try {
            return JSON.parse(dsParents) ?? dsParents;
        } catch (error) {
            return dsParents ?? null;
        }
    } else {
        return dsParents ?? null;
    }
}

function genParPathText(lineFeatures) {
    if (!Array.isArray(lineFeatures) || lineFeatures.length === 0) {return []}

const textCollection: any = []
    lineFeatures.forEach((lineFeature)=> {
        if (!lineFeature?.properties) {return}
        const path = lineFeature?.properties.parPathCoords
        const flatArr = Array.isArray(path) && path.length>1 ? path : []

        const parPathText = flatArr?.length > 0 ? flatArr.map((coord, i) => {

            return {
                text: i + 1 + '',
                coordinates: coord,
                color: DEFAULT_NUMS_COLOR
            }
        }) : []

        if (parPathText) {
            textCollection.push(parPathText)
        }
    })
    return textCollection.reduce((acc, curr)=> acc.concat(curr), [])
}

type CoordsAndProps = [Position[], string, number]
function genParentLine({features:lineFeatures, switchMap, lineSwitchMap, getisOffset, time
}): [DeckLine<Geometry, PointFeatureProperties>[], CoordsAndProps[]] {
if (!lineFeatures || !Array.isArray(lineFeatures) || lineFeatures?.length < 1) { return [[],[]]}
    const lineStringCoords: CoordsAndProps[] = [];
    const pLinePoints = [...lineFeatures]

    lineFeatures.forEach((lFeature, pathIdx ) => {
    if (!lFeature?.properties) {return}
    const {parPath} = lFeature?.properties
    if (!parPath || parPath?.length < 1) {return}

    if (!getisOffset) {          // straight lines
        const lastFeature = lineSwitchMap.get(parPath.at(-1))
        pLinePoints.push(lFeature)
        pLinePoints.push(lastFeature)
        const geom = lFeature?.geometry
        const coords = geom?.coordinates
        const coords1 = coords[0]?.[0]
        const lastSegment = coords[coords.length-1]
        const coords2 = lastSegment?.at(-1)
        const color = coords1 && coords2 && lFeature?.properties?.threshold?.color
        const lineWidth = coords1 && coords2 && lFeature?.properties?.threshold?.lineWidth
if (coords1 && coords2 && color)
        {
            lineStringCoords.push([[coords1, coords2], color, lineWidth]);
        }
        return
    }

    for (let i = 1; i < parPath?.length; i++) {
        let p: any = parPath[i] ;
        let prevP: any = parPath[i - 1];

        const pPt = typeof p === 'string' && switchMap.get(p?.split(parDelimiter)[0])
        const prevPt =  typeof prevP === 'string' && switchMap.get(prevP?.split(parDelimiter)[0])
        const pSources = (pPt?.properties?.sources && Object.values(pPt.properties.sources) as ParentInfo[]) ?? [] //.findIndex((el=> el.at(-1) === p)) : null
        const prevPSources = (prevPt?.properties?.sources && Object.values(prevPt.properties.sources) as ParentInfo[]) ?? []
        let fromPrevToCurr: (string|Position)[] | null = null
        let fromCurrToPrev: (string|Position)[] | null = null
        if (pSources?.length>0 && prevPSources?.length>0) {
                pSources.forEach((info, i) => {
                    const {parPath: currFeaturePath} = info
                    prevPSources.forEach((prevInfo, k) => {
                        const {parPath: prevFeaturePath} = prevInfo
                        if (prevFeaturePath[0] === currFeaturePath?.at(-1)) {
                            fromPrevToCurr = currFeaturePath
                        }
                        if (currFeaturePath[0] === prevFeaturePath?.at(-1)) {
                            fromCurrToPrev = prevFeaturePath
                        }
                    })
                })
        }
    else if (pSources?.length<1 && prevPSources?.length>0) {
            prevPSources.forEach((prevInfo, i) => {
                const {parPath: prevFeaturePath} = prevInfo

                if (prevFeaturePath.at(-1) === p) {
                    fromPrevToCurr = prevFeaturePath

            }})
        }

        const feature = typeof p === 'string' ? switchMap?.get(p) : null;   // id=0 is reserve for main real point
            pLinePoints.push(feature);
            let addFeatIconColor = feature?.properties?.threshold?.color
            let addFeatLineWidth = feature?.properties?.threshold?.lineWidth
            const currType = feature?.properties.aggrType;

        const prevFeature = typeof prevP === 'string' ? switchMap?.get(prevP): null;
        const prevType = prevFeature?.properties?.aggrType
        let addPrevFeatIconColor = prevFeature?.properties?.threshold?.color
        let addPrevFeatLineWidth = prevFeature?.properties?.threshold?.lineWidth

        if (
            (typeof p === 'string' && typeof prevP === 'string') ||
            Array.isArray(p) || Array.isArray(prevP) && (feature || prevFeature)
        ) {
            let coordinates;
            if (AggrTypes.includes(prevType) &&
                AggrTypes.includes(currType)
            ) {
                if (fromPrevToCurr || fromCurrToPrev) {
                    const path = fromPrevToCurr ? fromPrevToCurr : fromCurrToPrev ?? []
                    const iconColor = addPrevFeatIconColor ? addPrevFeatIconColor : addFeatIconColor
                    const lineWidth = addPrevFeatLineWidth ? addPrevFeatLineWidth : addFeatLineWidth
                    const addon: Position[] = []
                        path?.forEach((a) => {

                        if (typeof a === 'string') {
                            const addFeature = lineSwitchMap?.get(a) ?? lineSwitchMap?.get(a+parDelimiter+0)
                            const type = addFeature?.properties.aggrType
                            const geometry = addFeature?.geometry as Point
                            const addCoord = (geometry && geometry.coordinates && geometry.coordinates.length > 0)
                                ? geometry.coordinates[0][0] : switchMap?.get(a)?.geometry.coordinates ?? null

                            if (addCoord) {
                                addon.push(addCoord)
                            }

                        } else if (Array.isArray(a)) {
                            addon.push(a)
                        } else {
                            return null
                        }
                        return
                    })
                    //console.log('addon', addon)
                    lineStringCoords.push([addon, iconColor, lineWidth])  //?? lFeature.properties?.threshold?.color
                    if (path) {
                        continue
                    }
                }

            }
            let featIconColor, featLineWidth, prevFeatIconColor, prevFeatLineWidth
            if (typeof p === 'string') {
                const feature = lineSwitchMap?.get(p) ?? lineSwitchMap?.get(p+parDelimiter+0);
                featIconColor = feature?.properties?.threshold?.color
                featLineWidth = feature?.properties?.threshold?.lineWidth
                const geometry = feature?.geometry as Point;
                coordinates = (geometry?.coordinates?.length > 0)
                    ? geometry.coordinates[0][0] : switchMap?.get(p)?.geometry.coordinates ?? null
            } else {
                coordinates = p
            }

            let prevCoordinates;
            if (typeof prevP === 'string') {
                const prevFeature = lineSwitchMap?.get(prevP) ?? lineSwitchMap?.get(prevP+parDelimiter+0);
                prevFeatIconColor = prevFeature?.properties?.threshold?.color
                prevFeatLineWidth = prevFeature?.properties?.threshold?.lineWidth
                const prevGeometry = prevFeature?.geometry as Point;
                prevCoordinates = (prevGeometry && prevGeometry.coordinates && prevGeometry.coordinates.length > 0)
                    ? prevGeometry.coordinates[0][0] : switchMap?.get(prevP)?.geometry.coordinates ?? null
            } else {
                prevCoordinates = prevP;
            }

            lineStringCoords.push([[prevCoordinates, coordinates], (AggrTypes.includes(prevType) &&
            AggrTypes.includes(currType)) ? prevFeatIconColor : lFeature?.properties?.threshold?.color, (AggrTypes.includes(prevType)) ? prevFeatLineWidth : lFeature?.properties?.threshold?.lineWidth]);
        }
    }
})
        return [pLinePoints.filter(el=> el !== null), lineStringCoords.filter(el=> el[0].every(l=> l !== null))]
}

function genExtendedPLine({features, switchMap, lineSwitchMap, getisOffset, time}) {
     let pathCoords: Position[] = [];
     let nextSegment
    const occurences: string[] = []

features.forEach((feature, pathIdx)=>{
    if (feature && feature.properties?.locName) {
        const {locName, parPath} = feature.properties
        const parName = parPath?.at(-1)
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
                break;
            }
            occurences.push(locName)

            nextSegment = genParentLine({features:[nextParent], switchMap, lineSwitchMap, getisOffset, time})[1] || undefined;

            if (nextSegment?.length > 0) {
                pathCoords.push(nextSegment)
            }
            const {parPath} = nextParent?.properties

            nextParent = parPath && lineSwitchMap?.get(parPath.at(-1))
        }

    }})


    return pathCoords.reduce((acc,cur)=> acc.concat(cur), [])

  };

function genLinksText(selLine, switchMap, options, theme2) {

    if (!selLine) {
        return []
    }

    const {properties } = selLine
    const geometry = selLine.geometry as Point
    //const cons = getNodeConnections.get(properties.locName)
    const parent = switchMap?.get(properties.parPath?.at(-1))
    const parGeometry = parent?.geometry as Point

    const locCoords = (geometry && geometry.coordinates && geometry.coordinates.length > 0)
        ? geometry.coordinates[0][0] ?? null : null
    const parCoords = (parGeometry && parGeometry.coordinates && parGeometry.coordinates.length > 0)
        ? parGeometry.coordinates ?? null : null

    if (!locCoords || !parCoords) {
        return []
    }

    const angle = getTurfAngle(locCoords, parCoords)
    let color = properties?.threshold?.color

    const {bandNumber, bandWidth, throughput} = properties
    if ((bandWidth || bandNumber) && throughput) {

        let metricPercentage;

        if (bandWidth) {
            metricPercentage = (throughput / bandWidth) * 100;
        } else if (bandNumber) {
            metricPercentage = (throughput / bandNumber) * 100;
        }

        color = getColorByMetric(metricPercentage);
    }

const {locName, edgeField} = selLine.properties
     let toText = selLine.properties[edgeField] //?? locName //cons?.to.map(el=>el.locName)

    if (typeof toText === 'number') {
        const {value, unit} = convertBitsPerSecond(toText)
        toText = value+unit
    }
// optional flip side edge text label

    // if (toText?.length>0) {
    //     toText.splice(0,0,'<\n' )
    //     toText[toText.length - 1] = toText.at(-1) + '\n<'
    // }

    //let fromText = cons?.from.map(el=>el.locName)
    // if (fromText?.length>0) {
    //     fromText[0] = '>\n' + fromText[0]
    //     fromText[fromText.length - 1] = fromText.at(-1) + '\n'+'>\n'
    // }

    const fontSize = properties?.style?.textConfig?.fontSize

    const nodeConnectionsText = selLine && toText ?

        {to: [{text: toText+'\n', coordinates: [locCoords, parCoords ], color, angle, fontSize
            }],
            // from: [{text: fromText.join('\n'), coordinates: [locCoords, parCoords ], color, angle
            // }]
        } : {to: []
            // , from: []
    }



    return nodeConnectionsText
}


function convertBitsPerSecond(toText) {
    if (typeof toText === 'number') {
        // Convert to kilobits per second (Kbps) and megabits per second (Mbps)
        const kbps = toText / 1000; // 1 Kbps = 1000 bps
        const mbps = kbps / 1000;   // 1 Mbps = 1000 Kbps

        let result;

        if (mbps >= 1) {
            result = {
                value: mbps.toFixed(2),
                unit: ' Mbps',
            };
        } else if (kbps >= 1) {
            result = {
                value: kbps.toFixed(1),
                unit: ' Kbps',
            };
        } else {
            // Display in bits per second
            result = {
                value: toText, //.toFixed(2),
                unit: ' bps',
            };
        }

        return result;
    } else {
        console.error('Invalid input. Please provide a number.');
        return null;
    }
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

function findChildLines({   locName,
                            lineFeatures, direction}){
    if (!lineFeatures.length) {return []}
    return lineFeatures.filter(lineFeat=> {
        const {parPath} = lineFeat.properties
        //const parent = parPath?.length > 0 && Array.isArray(parents[0]) ? parents[0] : parents;
        //console.log(parPath?.at(-1) === locName , locName, parPath?.at(-1))
        return parPath?.at(direction === "target" ? -1 : 0) === locName } )
}

function mergeVertices(first: Vertices, second: Vertices): Vertices {
    const merged: Vertices = {};

    for (const key in first) {
        if (first.hasOwnProperty(key)) {
            merged[key] = { ...first[key] };
        }
    }

    for (const key in second) {
        if (second.hasOwnProperty(key)) {
            if (merged[key]) {
                // Merge ptId, tarCoords
                merged[key].ptId = merged[key].ptId || second[key].ptId;
                merged[key].tarCoords = merged[key].tarCoords || second[key].tarCoords;

                // Merge sources
                merged[key].sources = {
                    ...merged[key].sources,
                    ...Object.entries(second[key].sources || {}).reduce((acc, [sourceKey, sourceValue]) => {
                        const existingSource: any = merged[key]?.sources?.[sourceKey] || {};
                        acc[sourceKey] = {
                            ...existingSource,
                            ...sourceValue,
                            lineExtraProps: {
                                ...(existingSource.lineExtraProps || {}),
                                ...(sourceValue.lineExtraProps ?
                                    Object.entries(sourceValue.lineExtraProps).reduce((lineAcc, [lineKey, lineValue]) => {
                                        if (lineValue !== undefined && lineValue !== null && lineValue !== '') {
                                            lineAcc[lineKey] = lineValue;
                                        }
                                        return lineAcc;
                                    }, {}) :
                                    {}),
                            },
                        };
                        return acc;
                    }, {}),
                };

            } else {
                // If the key doesn't exist in the first object, simply copy it
                merged[key] = { ...second[key] };
            }
        }
    }

    return merged;
}


function getColorByMetric(metricPercentage) {
    if (metricPercentage >= 0 && metricPercentage <= 20) {
        return 'rgba(14, 205, 50,1)';
    }
    if (metricPercentage <= 30) {
        return 'rgba(255, 221, 87, 0.9)';
    }
    if (metricPercentage <= 40) {
        return 'rgba(237, 129, 40, 1)';
    }
    if (metricPercentage <= 50) {
        return 'rgba(219, 92, 158,1)';
    }
    if (metricPercentage <= 75) {
        return 'rgba(163, 27, 50,1)';
    }
    if (metricPercentage <= 100) {
        return 'rgba(164, 50, 168,1)';
    }
    // Handle invalid metricPercentage values
    return'rgb(72, 190, 194)'; // Default color for invalid values
}

function findComments(vertices) {
    const comments: any = [];
    for (const vertexKey in vertices) {
        const vertex = vertices[vertexKey];
        const sources = vertex.sources;

        if (sources) {
            for (const sourceKey in sources) {
                const parentInfo = sources[sourceKey];
                const parPath = parentInfo.parPath;

                if (Array.isArray(parPath)) {
                    parPath.forEach((element, i) => {
                        if (Array.isArray(element) && element.length > 2) {
                            const text = element[3];
                            const iconColor = element[4];
                            const [tar, src, orderId] = [parPath[0], parPath.at(-1), i ]

                            if (text !== undefined) {
                                comments.push({
                                    text,
                                    iconColor,
                                    orderId: i,
                                    coords: element.slice(0,2),
                                    tar, src
                                });
                            }
                        }
                    });
                }
            }
        }
    }

    return comments;
}

export function addSVGattributes(svgText: string, replaceUse = false) {

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svgText, 'image/svg+xml');

    if (replaceUse) { // Find the first symbol element
        const symbol = xmlDoc.querySelector('symbol');

        const useElements = xmlDoc.querySelectorAll('use');
        // Iterate over each use element
        useElements.forEach((useElement) => {
            const href = useElement.getAttribute('xlink:href');
            // Check if the use element references a symbol
            if (href && href.startsWith('#')) {
                // Find the corresponding symbol
                const symbolId = href.substring(1);
                const symbol = xmlDoc.getElementById(symbolId);
                if (symbol) {
                    // Replace the use element with the content of the symbol
                    const symbolContent = symbol.innerHTML;
                    useElement.parentNode?.replaceChild(parser.parseFromString(symbolContent, 'image/svg+xml').documentElement, useElement);
                }
            }
        });
    }

    //// add width and height

    let svgElement = xmlDoc.getElementsByTagName('svg')[0];

    let width = svgElement.getAttribute('width');
    let height = svgElement.getAttribute('height');
    const viewBox = svgElement.getAttribute('viewBox');
    // If non, get width and height from the viewBox attribute
    if ((!width || !height) && viewBox) {
        const viewBoxValues = viewBox.split(' ').map(parseFloat);
        width = viewBoxValues[2]?.toString();
        height = viewBoxValues[3]?.toString();

        svgElement.setAttribute('width', width);
        svgElement.setAttribute('height', height);
    }

    const svgTextMod = new XMLSerializer().serializeToString(xmlDoc);
  return {svgText: svgTextMod, width, height}

}

async function parseSvgFileToString(options) {
    const {iconName: svgIconName, svgColor: svgIconColor} = options
    if (!svgIconName) {return null}
    const isPublic = svgIconName.startsWith('public/')
    let localName = isPublic ? svgIconName : 'public/plugins/vaduga-mapgl-panel/img/icons/'+svgIconName+'.svg'

    const svgFilePath = svgIconName.startsWith('http') ? svgIconName : localName

    try {
        const response = await fetch(svgFilePath);

        if (!response.ok) {
            throw new Error(`Failed to fetch SVG file. Status: ${response.status}`);
        }

        let svgString = await response.text();
const {svgText,width,height} = addSVGattributes(svgString)

        return [svgIconName, {svgText, width, height}];
    } catch (error) {
        console.error('Error fetching SVG file:', error);
        return null;
    }
}

async function loadSvgIcons(svgIconRules) {
    if (svgIconRules.length) {
        const promises = svgIconRules.filter(el=>el).map(parseSvgFileToString)
        const res = await Promise.all(promises)
        const pairs = res.filter(el=>el)
        return pairs.length ? Object.fromEntries(pairs) : {}
    } else {
        return {}
    }
}

const generateValuesWithIncrement = (start: number, end: number, increment: number, slowStart=false): SelectableValue[] => {
    const values: SelectableValue[] = [];
    let currentIncrement = slowStart? 0.1 : increment;

    for (let value = start; value <= end; value += currentIncrement) {
        const roundedValue = parseFloat(value.toFixed(1));
        values.push({ value: roundedValue, label: roundedValue.toString() });

        // Switch to the provided increment after reaching 1
        if (roundedValue === 1) {
            currentIncrement = increment;
        }
    }

    return values;
};



export {
    toRGB4Array, colorToRGBA, getColorByMetric, getFirstCoordinate, toHex, hexToRgba, getBounds, getTurfAngle, makeColorLighter, makeColorDarker, genParPathText,
    genParentLine, genExtendedPLine, genLinksText, findChildLines, parseIfPossible, mergeVertices, findComments, parseSvgFileToString, generateValuesWithIncrement,
    loadSvgIcons, parseObjFromString, findClosestAnnotations
}
