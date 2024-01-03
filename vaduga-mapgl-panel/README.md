# Map.gl panel plugin

Geospatial map for large datasets using Deck.gl

[![Telegram Url](https://img.shields.io/badge/Telegram-chat-blue?logo=telegram)](https://t.me/grafanista)
[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md)
[![Project Site](https://img.shields.io/badge/Project-site-red)](https://mapgl.org)

Map.gl panel plugin extends basemap config options of
[Orchestra Cities Map](https://grafana.com/grafana/plugins/orchestracities-map-panel/)
and [Grafana Geomap](https://grafana.com/docs/grafana/latest/visualizations/geomap/)   
with different data layer rendering technology. 
This plugin uses [Deck.gl](https://deck.gl/) framework at its core and features:

* Optimized rendering of large datasets using WebGL
* Parent/child relation lineStrings with path to root
* New: support for parent path as an array of coordinates or location names
* New: aggregation nodes and offset for overlapping lines in parent path.
* Multi layers support
* Clusters, Polygons, Path (LineStrings)
* Static GeoJson from file url
* Composite donut-chart cluster icons layer with fallback to icon layer  
* Color thresholds customizable for any set of properties 
* Aggregated threshold labels for clusters
* Customizable tooltip properties 
* Customizable features search 

## Required fields: 
* Coordinates for points in any popular format
* Numeric metric field to set color thresholds

![Overview](https://mapgl.org/img/aggr.gif)
![Overview1](https://mapgl.org/img/screenshot1.png)
![Overview2](https://mapgl.org/img/screenshot2.png)


