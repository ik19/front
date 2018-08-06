var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var connectSsi = require('gulp-connect-ssi');
var gulp = require('gulp'), includer = require('gulp-html-ssi');
var minify = require('gulp-minifier');

// Development Tasks 
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app',
      middleware: [
                connectSsi({
                    baseDir: 'app',
                    ext: '.html',
                    method: 'readLocal'  // readOnLine|readLocal|readOnLineIfNotExist|downloadIfNotExist
                })
            ]
    }
  })
});

gulp.task('sass', function() {
  return gulp.src('app/assets/sass/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(gulp.dest('app/assets/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }))
     .pipe(gulp.dest('dist/assets/css'));
});

// Watchers
gulp.task('watch', function() {
  gulp.watch('app/assets/sass/**/*.scss', ['sass']);
  gulp.watch('app/**/*.html', browserSync.reload);
  gulp.watch('app/assets/js/**/*.js', browserSync.reload);
});

// Optimization Tasks 
// ------------------

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {

  return gulp.src('app/**/*.html')
    .pipe(useref())
    .pipe(gulpIf('app/assets/js/**/*.js', uglify()))
    .pipe(gulpIf('app/assets/sass/**/*.scss', cssnano()))
    .pipe(gulp.dest('dist'));
});

// Optimizing Images 
gulp.task('images', function() {
  return gulp.src('app/assets/img/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('dist/assets/img'))
});

// Copying fonts 
gulp.task('fonts', function() {
  return gulp.src('app/assets/fonts/**/*')
    .pipe(gulp.dest('dist/assets/fonts'))
});

// Copying js 
gulp.task('js', function() {
  return gulp.src('app/assets/js/**/*.js')
    .pipe(gulp.dest('dist/assets/js'))
});

// Copying css 
gulp.task('css', function() {
  return gulp.src('app/assets/css/**/*.css')
    .pipe(gulp.dest('dist/assets/css'))
});

// Cleaning 
gulp.task('clean', function() {
  return del.sync('dist').then(function(cb) {
    return cache.clearAll(cb);
  });
});

gulp.task('clean:dist', function() {
  return del.sync(['dist/**/*', '!dist/img', '!dist/img/**/*']);
});

//Includes 
gulp.task('htmlSSI', function() {
    gulp.src('app/**/*.html')
        .pipe(includer())
        .pipe(gulp.dest('./dist/'));
});


//Gulp SSI Build
//https://www.npmjs.com/package/gulp-html-ssi
//--------------

gulp.task('minify', function() {
  return gulp.src('dist/assets/**/*.+(css|js)').pipe(minify({
    minify: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyJS: true,
    minifyCSS: true,
    getKeptComment: function (content, filePath) {
        var m = content.match(/\/\*![\s\S]*?\*\//img);
        return m && m.join('\n') + '\n' || '';
    }
  })).pipe(gulp.dest('./dist/assets/'));
});

gulp.task('default', function(callback) {
  runSequence(['sass', 'browserSync'], 'watch',
    callback
  )
});

gulp.task('build', function(callback) {
    runSequence(
        'clean:dist',
        'css',
        'sass',
        'js',
        'htmlSSI',
        ['useref', 'images', 'fonts'],
        'minify',
        callback
      )
    gulp.src('app/**/*.html')
        .pipe(includer())
        .pipe(gulp.dest('./dist/'));
});
