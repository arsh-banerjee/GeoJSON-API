# GeoJSON Building API

A simple Node.js API to serve and filter building footprint data from a GeoJSON file.

## Getting Started

**Requirements**
- Node.js 14+
- npm

**Install & Run**
```bash
npm install         
npm start         
```

Server runs on http://localhost:3000 by default.

## API Endpoints

### GET /buildings

Returns building data in GeoJSON format.

**Optional filters:**
- `minHeight=50` → buildings with height >= 50
- `type=residential` → filter by building type
- `bbox=minLon,minLat,maxLon,maxLat` → buildings intersecting the bounding box

**Examples**
```
GET /buildings
GET /buildings?minHeight=50
GET /buildings?type=commercial&minHeight=10
GET /buildings?bbox=-74.003,40.699,-73.997,40.71
```

### GET /buildings/summary

Returns:
- Total number of buildings
- Count by type
- Height stats (min, max, average)

**Example response:**
```json
{
  "totalBuildings": 5,
  "types": {
    "residential": 2,
    "commercial": 2,
    "industrial": 1
  },
  "heightStats": {
    "min": 5,
    "max": 100,
    "avg": 50
  }
}
```

## Notes

- The `minHeight` filter is inclusive
- Building `type` matching is case-sensitive
- GeoJSON data is loaded into memory on startup
- Filtered results are cached in memory for 5 minutes
- CORS is enabled
- Bounding box filtering checks if any polygon point is inside the box
