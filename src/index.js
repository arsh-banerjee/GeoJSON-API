const express = require('express');
const cors = require('cors');
const geojsonHandler = require('./geojsonHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GET /buildings — optionally filter by minHeight, type, bbox
app.get('/buildings', (req, res) => {
  const { minHeight, type, bbox } = req.query;

  const parsedMinHeight = minHeight !== undefined ? Number(minHeight) : undefined;
  if (minHeight !== undefined && isNaN(parsedMinHeight)) {
    return res.status(400).json({ error: 'minHeight must be a number.' });
  }

  if (bbox) {
    const parts = bbox.split(',').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      return res.status(400).json({
        error: 'bbox must be four comma-separated numbers: minLon,minLat,maxLon,maxLat'
      });
    }
  }

  try {
    const data = geojsonHandler.filterBuildings({ minHeight: parsedMinHeight, type, bbox });
    res.json(data);
  } catch (err) {
    console.error('Error filtering buildings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /buildings/summary — summary statistics
app.get('/buildings/summary', (req, res) => {
  try {
    const summary = geojsonHandler.getSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
