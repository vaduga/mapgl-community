
## Nodes and edges on geo map with metrics & alert states

[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&amp;color=blue&amp;label=downloads&amp;query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22vaduga-mapgl-panel%22%29%5D.downloads&amp;url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/vaduga-mapgl-panel)
[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md)
[![Discord](https://img.shields.io/discord/973739619118088232?logo=discord&logoColor=%232490D7)](https://discord.gg/DZCAfzYwjC)
[![Telegram Url](https://img.shields.io/badge/Telegram-blue?logo=telegram )](https://t.me/mapgrafana)
[![Project Site](https://img.shields.io/badge/Project-site-red)](https://mapgl.org)
[✉️][email]

[//]: # ([![Change Log]&#40;https://img.shields.io/badge/Change-log-blue.svg?style=flat&#41;]&#40;https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md&#41;)
[//]: # ([![GitHub]&#40;https://img.shields.io/github/stars/vaduga/mapgl-community?style=social&#41;]&#40;https://github.com/vaduga/mapgl-community&#41;)

extends base config options of Grafana Geomap with [Deck.gl](https://deck.gl/) rendering and other features:
* network topology with nodes, links and metrics
* **new:** alerting states from built-in Grafana alerting rules
* path to source as an array of coordinates or refs to intermediate locations. Multi-source supported
* bidirectional tar-src paths for selected node. Declare dashboard variable 'locRole' to save state
* donut chart clusters based on the number of color labels typed by metric thresholds and overrides for custom properties
* svg icons, text labels with collision filter
* data-links: icon in tooltip to set values for 'target' and 'source' dashboard variables. Lets you show charts dynamically in other panels.
* comment icons for intermediate coordinates from inlined text and color (ex.: [37.560447,55.550818, 0, "comment", "green"])
* aggregation typed nodes and offset for overlapping lines.
* stat1/stat2 switch to show straight path with secondary metric as a label
* optimized rendering of large datasets using WebGL
* multi layers support of Polygon, GeoJson from url, LineString layers
* tooltips with customizable fields
* customizable nodes search

<br/>
Explore panel and datasource config examples at the [Playground](https://play.mapgl.org)<br/>
[Tutorial: Observing Zabbix events on a geospatial map](https://mapgl.org/zabbix)<br/>

Required datasource fields:<br/>
* Coordinates for points in geojson, **lon / lat** or geohash format<br/>
* Metric field for color thresholds or link your panel to Grafana alerting rules

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




