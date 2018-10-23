var gulp = require('gulp');
// var pug = require('gulp-pug');
// var less = require('gulp-less');
var minifyCSS = require('gulp-csso');
// var concat = require('gulp-concat');
// var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var webserver = require('gulp-webserver');

gulp.task('html', function(){
  return gulp.src('src/html/*.html')
    .pipe(gulp.dest('build/'));
});

gulp.task('css', function(){
  return gulp.src('src/css/*.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/css'));
});

gulp.task('img', function(){
  return gulp.src(['src/img/*.jpg', 'src/img/*.png'])
    .pipe(gulp.dest('build/img'));
});


gulp.task('js:dist', function(){
  return gulp.src('src/js/dist/*.js')
    // .pipe(sourcemaps.init())
    // .pipe(concat('app.min.js'))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js/dist'));
});

gulp.task('js', function(){
  return gulp.src(['src/js/*.js', '!src/js/sw.js'])
      .pipe(gulp.dest('build/js/'));
});

gulp.task('sw', function(){
  return gulp.src('src/js/sw.js')
      .pipe(gulp.dest('build/'));
});

gulp.task('sw:dep', function(){
  return gulp.src('src/js/sw/*.js')
    .pipe(gulp.dest('build/js/sw'));
});


gulp.task('misc', function(){
  return gulp.src('src/manifest.json')
      .pipe(gulp.dest('build/'));
});

gulp.task('clean', function() {
    return del('build');
});

gulp.task('default', [
    'html',
    'css',
    'img',
    'js',
    'js:dist',
    'sw',
    'sw:dep',
    'misc'
]);

gulp.task('serve', function() {
    gulp.src('build')
        .pipe(webserver({
            livereload: true,
            open: true,
            port: 8888
        }));
})