import './geocoder.css';
import maplibregl from 'maplibre-gl';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import React, {useEffect, useMemo} from 'react';
import {flushSync} from "react-dom";

const MapGeocoder = ({setViewState, setSelCoord, geocoderRef}) => {

    const mapTilerApiKey = 'gZx3gkwqa9aBXw49KK8x'


    // Functions should return Carmen GeoJSON https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
// View config definitions in our [documentation](https://github.com/maplibre/maplibre-gl-geocoder/blob/master/API.md#setgeocoderapi)
    const GeoApi = {
        // required
        forwardGeocode: async (config) => {
            const res = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(
                    config.query
                )}.json?key=${mapTilerApiKey}`
            );

            return await res.json();
        },

        // forwardGeocode: async (config) => { /* definition here */
        //
        //     const {query} = config
        //     const matchingFeatures: any = [];
        //     for (const feature of customData.features) {
        //         if (
        //             feature.properties.title
        //                 .toLowerCase()
        //                 .includes(query.toLowerCase())
        //         ) {
        //             feature['place_name'] = `🌲 ${feature.properties.title}`;
        //             feature['center'] = feature.geometry.coordinates;
        //             feature['place_type'] = ['park'];
        //             matchingFeatures.push(feature);
        //
        //         }
        //     }
        //     console.log('matchingFeatures', matchingFeatures)
        //     return {type: "FeatureCollection",  query: [query],features: matchingFeatures};
        //
        // },

        // optional

        reverseGeocode: async (config) => { /* definition here */ }, // reverse geocoding API

        getSuggestions: async (config) => {
            const res = await fetch(
                "https://api.maptiler.com/geocoding/" +
                encodeURIComponent(config.query) +
                ".json?key=" +
                mapTilerApiKey
            );

            return {
                suggestions: (await res.json()).features
            };
        }


        // getSuggestions: async (config) => { /* definition here */
        //
        //     const {query} = config
        //     const matchingFeatures: any = [];
        //     for (const feature of customData.features) {
        //         if (
        //             feature.properties.title
        //                 .toLowerCase()
        //                 .includes(query.toLowerCase())
        //         ) {
        //
        //             feature['place_name'] = `🌲 ${feature.properties.title}`;
        //             feature['center'] = feature.geometry.coordinates;
        //             feature['place_type'] = ['park'];
        //             matchingFeatures.push(feature);
        //         }
        //     }
        //     console.log('matchingFeatures', matchingFeatures)
        //     return { suggestions:  matchingFeatures  }
        //
        // }

        , // suggestion API

        searchByPlaceId: async (config) => { /* definition here */ } // search by Place ID API
    };

    const geocoder = useMemo(()=> {
        return new MaplibreGeocoder(GeoApi, { maplibregl,
            showResultsWhileTyping: true, collapsed: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
const container = document.getElementById('geocoder-container')
        if (container && container.childNodes?.length === 0) { geocoder.addTo('#geocoder-container') }

        geocoder.on('result', (res)=> {
            console.log('result', res)
const {result} = res
            if (!result.geometry) {return}
            const fixedCoords = result.geometry.coordinates.map(e=>parseFloat(e.toFixed(6)))
            const [longitude,latitude] = fixedCoords
            const newState = {
                longitude,
                latitude,
                transitionDuration: 250,
                zoom: 18,
            }
            flushSync(()=>{
                setViewState({...newState}); // bug:doesnt trigger forced rerender
                setSelCoord({...result.geometry, coordinates: fixedCoords })
            })

        })


// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geocoder, setViewState, setSelCoord]);

    return null;
};

export default React.memo(MapGeocoder);


// Load custom data to supplement the search results.


const customData = {
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'title': 'Lincoln Park is special'
            },
            'geometry': {
                'coordinates': [-87.637596, 41.940403],
                'type': 'Point'
            }
        },
        {
            'type': 'Feature',
            'properties': {
                'title': 'Burnham Park is special'
            },
            'geometry': {
                'coordinates': [-87.603735, 41.829985],
                'type': 'Point'
            }
        },
        {
            'type': 'Feature',
            'properties': {
                'title': 'Millennium Park is special'
            },
            'geometry': {
                'coordinates': [-87.622554, 41.882534],
                'type': 'Point'
            }
        }
    ],
    'type': 'FeatureCollection'
};
