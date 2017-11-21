const browserSync = require('browser-sync').create();

browserSync.watch('build/mParticle-dev.js').on('change', browserSync.reload);
browserSync.watch('test/index.html').on('change', browserSync.reload);
browserSync.watch('test/test-bundle.js').on('change', browserSync.reload);

browserSync.init({
  port: 3000,
  startPath: '/test/index.html',
  server: {
    index: 'test/index.html'
  }
});
