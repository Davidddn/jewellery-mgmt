// workbox-config.js
module.exports = {
  globDirectory: 'frontend/public/',
  globPatterns: [
    '**/*.{html,js,css,png,svg,json}'
  ],
  swDest: 'frontend/public/service-worker.js',
  swSrc: 'frontend/public/service-worker-src.js',
};
