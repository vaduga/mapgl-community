
# Map.gl Grafana panel plugin

Geospatial map for large datasets using deck.gl

[![Telegram Url](https://img.shields.io/badge/Telegram-chat-blue?logo=telegram)](https://t.me/grafanista)
[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl-community/blob/main/CHANGELOG.md)
[![Project Site](https://img.shields.io/badge/Project-site-red)](https://mapgl.org)

This plugin uses [Deck.gl](https://deck.gl/) framework at its core and features:

* Optimized rendering of large datasets using WebGL
* Composite donut-chart cluster icons layer with fallback to icon layer
* Pop up for a specific point or cluster with customizable fields
* Colored thresholds for metrics with pop up labels
* Parent/child connections line layer with path to root on select
* Selectable properties for pop up
* Search for your points by customized fields

## Required fields
* Coordinates for points in any popular format
* Metric field if you wish to set color thresholds

![Overview](https://mapgl.org/img/screenshot1.png)
![Overview2](https://mapgl.org/img/screenshot2.png)


## Getting started

### Frontend

1. Install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   yarn dev
   ```

3. Build plugin in production mode

   ```bash
   yarn build
   ```

4. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   yarn server
   ```

# Signing the plugin

_Note: It's not necessary to sign a plugin during development. The docker development environment that is scaffolded with `@grafana/create-plugin` caters for running the plugin without a signature._

