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



export {
    toRGB4Array, toHex, hexToRgba, getBounds
}
