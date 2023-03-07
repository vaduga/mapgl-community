<!-- This README file is going to be the one displayed on the Grafana.com website for your plugin -->

# Map.gl panel plugin

Geospatial map for large datasets using deck.gl

[![Telegram Url](https://img.shields.io/badge/Telegram-chat-blue?logo=telegram)](https://t.me/grafanista)
[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md)
[![Project Site](https://img.shields.io/badge/Project-site-red)](https://mapgl.org)

Map.gl panel plugin extends basemap config options of
[Orchestra Cities Map](https://grafana.com/grafana/plugins/orchestracities-map-panel/)
and [Grafana Geomap](https://grafana.com/docs/grafana/latest/visualizations/geomap/)   
with different data layer rendering technology. 
This plugin uses [Deck.gl](https://deck.gl/) framework at its core and features:

* Optimized rendering of large datasets using WebGL
* Composite donut-chart cluster icons layer with fallback to icon layer
* Pop up for a specific point or cluster with customizable fields 
* Colored thresholds for metrics with pop up labels
* Parent/child connections line layer with path to root on select
* Selectable properties for pop up 
* Search for your points by customized fields 

## Required fields: 
* Coordinates for points in any popular format
* Metric field if you wish to set color thresholds

![Overview](https://mapgl.org/img/screenshot1.png)
![Overview2](https://mapgl.org/img/screenshot2.png)

## Usage with PostGis

To use the plugin with PostGis, you need either to query longitude and latitude from a stored `Point`, e.g.:
* `ST_X(ST_GeomFromEWKT(location_centroid)) AS \"longitude\"`
* `ST_Y(ST_GeomFromEWKT(location_centroid)) AS \"latitude\"`

Or query the GeoJSON shape, e.g.:
* `ST_AsGeoJSON(ST_GeomFromEWKT(location)) AS \"geojson\"`

## Usage with CrateDB

To use the plugin with CrateDB, you need either to query longitude and latitude from a stored `Point`, e.g.:
* `longitude(location_centroid) AS \"longitude\"`
* `latitude(location_centroid) AS \"latitude\"`

Or query the GeoJSON field, e.g.:
* `location AS \"geojson\"`
