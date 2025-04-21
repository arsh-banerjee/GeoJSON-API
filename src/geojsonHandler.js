const fs = require('fs');
const path = require('path');
const { LRUCache } = require('lru-cache');

class GeoJSONHandler {
  constructor() {
    this.data = null;
    this.cache = new LRUCache({
      max: 100,            // up to 100 query results
      ttl: 1000 * 60 * 5   // cache entries live for 5 minutes
    });

    this.loadData();
  }

  loadData() {
    const filePath = path.join(__dirname, '..', 'buildings.geojson');

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.data = JSON.parse(content);
    } catch (err) {
      console.error('Failed to load buildings.geojson:', err);
      throw err;
    }
  }

  filterBuildings({ minHeight, type, bbox }) {
    if (!this.data) {
      throw new Error('GeoJSON data not loaded.');
    }

    const cacheKey = JSON.stringify({ minHeight, type, bbox });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let results = this.data.features;

    if (minHeight !== undefined) {
      results = results.filter(f => f.properties.height >= minHeight);
    }

    if (type) {
      results = results.filter(f => f.properties.type === type);
    }

    if (bbox) {
      const bounds = bbox.split(',').map(Number);
      if (bounds.length !== 4 || bounds.some(isNaN)) {
        throw new Error('Invalid bbox. Expected format: minLon,minLat,maxLon,maxLat');
      }

      results = results.filter(f =>
        this.polygonIntersectsBBox(f.geometry.coordinates[0], bounds)
      );
    }

    const filtered = {
      type: 'FeatureCollection',
      features: results
    };

    this.cache.set(cacheKey, filtered);
    return filtered;
  }

  polygonIntersectsBBox(coords, [minLon, minLat, maxLon, maxLat]) {
    return coords.some(([lon, lat]) =>
      lon >= minLon && lon <= maxLon &&
      lat >= minLat && lat <= maxLat
    );
  }

  getSummary() {
    if (!this.data) {
      throw new Error('GeoJSON data not loaded.');
    }

    const types = {};
    let totalHeight = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const { properties: { height, type } } of this.data.features) {
      types[type] = (types[type] || 0) + 1;
      totalHeight += height;
      min = Math.min(min, height);
      max = Math.max(max, height);
    }

    return {
      totalBuildings: this.data.features.length,
      types,
      heightStats: {
        min,
        max,
        avg: totalHeight / this.data.features.length
      }
    };
  }
}

module.exports = new GeoJSONHandler();
