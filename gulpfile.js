var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var gulpStylelint = require('gulp-stylelint');
var eslint = require('gulp-eslint');
var imagemin = require('gulp-imagemin');
var plumber = require('gulp-plumber');
var watch = require('gulp-watch');
var styleguide = require('sc5-styleguide');
var pngquant = require('imagemin-pngquant');
var rimraf = require('rimraf');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var path = {
  build: {
    common: './build',
    html: './build/',
    js: './build/js/',
    css: './build/css/',
    img: './build/img/',
    fonts: './build/fonts/'
  },
  src: {
    html: './src/*.html',
    js: './src/js/main.js',
    jss: './src/js/**/*.js',
    style: './src/styles/**/*.scss',
    css: './src/**/*.css',
    img: './src/img/**/*.*',
    fonts: './src/fonts/**/*.*'
  },
  clean: './build'
};

gulp.task('styleguide:generate', function () {
  return gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(styleguide.generate({
      title: 'EE Styleguide',
      server: true,
      rootPath: path.build.common,
      disableEncapsulation: true,
      overviewPath: 'README.md',
      extraHead: [
        '<link rel="stylesheet" href="/sc5.css" />'
      ],
      afterBody: [
        '<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>',
        '<script src="/js/main.min.js"></script>'
      ]
    }))
    .pipe(gulp.dest(path.build.common));
});

gulp.task('styleguide:applystyles', function () {
  return gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(styleguide.applyStyles())
    .pipe(gulp.dest(path.build.common));
});

gulp.task('html:build', function () {
  gulp.src(path.src.html)
    .pipe(gulp.dest(path.build.html));
});

gulp.task('js:build', function () {
  browserify({
    entries: path.src.js,
    debug: true
  })
    .bundle()
    .pipe(source('main.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(path.build.js));
});

gulp.task('image:build', function () {
  gulp.src(path.src.img)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [pngquant()],
      interlaced: true
    }))
    .pipe(gulp.dest(path.build.img));
});

gulp.task('fonts:build', function () {
  gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts));
});

gulp.task('css:build', function () {
  gulp.src(path.src.css)
    .pipe(gulp.dest(path.build.common));
});

gulp.task('lint:css', function () {
  return gulp.src(path.src.style)
    .pipe(gulpStylelint({
      reporters: [
        { formatter: 'string', console: true }
      ]
    }));
});

gulp.task('lint:js', function () {
  return gulp.src([path.src.jss, '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('watch', ['styleguide'], function () {
  watch([path.src.html], function () {
    gulp.start('html:build');
  });
  watch([path.src.style], function () {
    gulp.start('styleguide');
  });
  watch([path.src.js], function () {
    gulp.start('js:build');
  });
  watch([path.src.img], function () {
    gulp.start('image:build');
  });
  watch([path.src.fonts], function () {
    gulp.start('fonts:build');
  });
});

gulp.task('build', [
  'html:build',
  'js:build',
  'css:build',
  'lint:js',
  'lint:css',
  'fonts:build',
  'image:build'
]);

gulp.task('styleguide', [
  'styleguide:generate',
  'styleguide:applystyles'
]);

gulp.task('clean', function (cb) {
  rimraf(path.clean, cb);
});

gulp.task('default', ['build', 'watch']);
