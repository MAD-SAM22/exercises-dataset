const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const exerciseRoutes = require('./routes/exerciseRoutes');

const app = express();

// Enable Security Headers with relaxed CORP for media embedding
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Enable CORS for mobile apps and web clients
app.use(cors());

// Enable Response Compression (Gzip)
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images and videos using process.cwd() for reliable root resolution
const staticOptions = {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
};

const imagesPath = path.join(process.cwd(), 'images');
const videosPath = path.join(process.cwd(), 'videos');

app.use('/images', express.static(imagesPath, staticOptions));
app.use('/videos', express.static(videosPath, staticOptions));

// Register Exercises API routes
app.use('/exercises', exerciseRoutes);
app.use('/v1/exercises', exerciseRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Exercises API',
    version: '1.0.0',
    description: 'Production-ready fitness exercises API dataset with search, pagination, categories, and media assets.',
    endpoints: {
      exercises: '/exercises?page=1&limit=20&body_part=waist&equipment=body%20weight&target=abs&q=sit-up',
      single_exercise: '/exercises/:id',
      batch: '/exercises/batch',
      random: '/exercises/random?count=5&body_part=chest',
      suggestions: '/exercises/suggestions?q=press&limit=5',
      stats: '/exercises/stats',
      categories: '/exercises/categories',
      equipments: '/exercises/equipments',
      targets: '/exercises/targets'
    },
    documentation: 'https://github.com/hasaneyldrm/exercises-dataset'
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

module.exports = app;
