import turfbbox from "@turf/bbox";
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
    const colorArr = color.match(/\d+/g); // extract the RGB values as an array
    const lightenedColorArr = colorArr.map(value => Math.min(Number(value) + 45, 255)); // add 25 to each value, ensuring the result is at most 255
    return `rgb(${lightenedColorArr.join(", ")})`; // convert the array back to a string and return it
}

function invertColor(color){
    const colorArr = color.match(/\d+/g); // extract the RGB values as an array
    const invertedColorArr = colorArr.map(value => 255 - Number(value)); // invert each value by subtracting it from 255
    return `rgb(${invertedColorArr.join(", ")})`; // convert the array back to a string and return it
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

const toRGB4Array = (rgbStr: string) => {
    const matches = rgbStr.match(/[\d.]+/g);
    if (matches === null || matches.length < 3) {
        return new Uint8Array([0, 0, 0]);
    }

    const rgba = matches.slice(0, 4).map(Number);
    rgba[3] = (rgba[3] || 1) * 255;
    return new Uint8Array(rgba);
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

const defaultCenter = {
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [-74.0060, 40.7128],  // New York
    },
    properties: {}
}

function getBounds(points) {
    const featureCollection = {
        type: 'FeatureCollection',
        features: points,
    };
    const bounds = turfbbox(featureCollection)
    return bounds;
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




export {
    toRGB4Array, toHex, hexToRgba, getBounds, colorToRGBA, getFirstCoordinate
}
