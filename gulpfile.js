var gulp = require('gulp');
var minifyCSS = require('gulp-csso');
var minify = require('gulp-minify');
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
  return gulp.src(['src/img/*.jpg', 'src/img/*.png', 'src/img/*.svg'])
    .pipe(gulp.dest('build/img'));
});


gulp.task('js:dist', function(){
  return gulp.src('src/js/dist/*.js')
    .pipe(minify())
    .pipe(gulp.dest('build/js/dist'));
});

gulp.task('js', function(){
  return gulp.src(['src/js/*.js', '!src/js/sw.js'])
    .pipe(minify())
    .pipe(gulp.dest('build/js/'));
});

gulp.task('sw', function(){
  return gulp.src('src/js/sw.js')
    .pipe(minify())
    .pipe(gulp.dest('build/'));
});

gulp.task('sw:dep', function(){
  return gulp.src('src/js/sw/*.js')
    .pipe(minify())
    .pipe(gulp.dest('build/js/sw'));
});


gulp.task('misc', function(){
  return gulp.src('src/manifest.json')
      .pipe(gulp.dest('build/'));
});

gulp.task('clean', function() {
    return del('build');
});

gulp.task('build', [
    'html',
    'css',
    'img',
    'js',
    'js:dist',
    'sw',
    'sw:dep',
    'misc'
]);

gulp.task('serve', ['build'], function() {
    gulp.src('build')
        .pipe(webserver({
            open: true,
            port: 8000
        }));
});

gulp.task('default', ['serve']);