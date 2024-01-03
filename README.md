
# Map.gl Grafana panel plugin

[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&amp;color=blue&amp;label=downloads&amp;query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22vaduga-mapgl-panel%22%29%5D.downloads&amp;url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/vaduga-mapgl-panel)
[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md)
[![Discord](https://img.shields.io/discord/973739619118088232?logo=discord&logoColor=%232490D7)](https://discord.gg/DZCAfzYwjC)
[![Telegram Url](https://img.shields.io/badge/Telegram-blue?logo=telegram )](https://t.me/mapgrafana)
[![Project Site](https://img.shields.io/badge/Project-site-red)](https://mapgl.org)
[✉️][email]

[//]: # ([![Change Log]&#40;https://img.shields.io/badge/Change-log-blue.svg?style=flat&#41;]&#40;https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md&#41;)
[//]: # ([![GitHub]&#40;https://img.shields.io/github/stars/vaduga/mapgl-community?style=social&#41;]&#40;https://github.com/vaduga/mapgl-community&#41;)

extends basemap config options of Grafana Geomap with [Deck.gl](https://deck.gl/) rendering and other features
### Features
* network topology with nodes and links (edges)
* path to source/target as an array of coordinates or refs to intermediate locations
* multi-source support
* switch path direction by declaring dashboard variable 'locRole'.
* data-links: icon in tooltip to set values for 'target' and 'source' dashboard variables. Lets you show charts dynamically in other panels.
* donut-chart clusters with arc lengths by color threshold labels set by metric and other user-defined properties
* comment icons for intermediate locations from text and color inlined in coordinates (ex.: [37.560447,55.550818, 0, "comment", "green"])
* aggregation nodes and offset for overlapping lines.
* stat1/stat2 switch to disable offset and show secondary metric
* edge labels in stat2 mode , aggregation nodes labels.
* optimized rendering of large datasets using WebGL
* multi layers support of Clusters, Polygons, LineStrings (path)
* tooltips with customizable fields
* customizable nodes search

[Tutorial: Observing Zabbix events on a Geospatial Map](https://mapgl.org/zabbix)<br/>

Required datasource fields:<br/>
* Coordinates for points in geojson, **lon / lat** or geohash format<br/>
* Metric field for color thresholds

![Overview](https://mapgl.org/img/aggr.gif)
![Overview](https://mapgl.org/img/screenshot1.png)
![Overview2](https://mapgl.org/img/screenshot2.png)

[email]: mailto:arbitr38@gmail.com

### Test Mapgl with provisioned example dashboards in docker environment 

```
npm install
npm run build
docker-compose up
```
And go to http://localhost:3000/




