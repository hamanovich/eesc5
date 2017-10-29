import gulp from 'gulp';
import sass from 'gulp-sass';
import gulpStylelint from 'gulp-stylelint';
import eslint from 'gulp-eslint';
import imagemin from 'gulp-imagemin';
import plumber from 'gulp-plumber';
import styleguide from 'sc5-styleguide';
import pngquant from 'imagemin-pngquant';
import rimraf from 'rimraf';
import browserify from 'browserify';
import babelify from 'babelify';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import injectVersion from 'gulp-inject-version';

import { version } from './package.json';

const path = {
  build: {
    common: `./build-v${version}`,
    html: `./build-v${version}/`,
    js: `./build-v${version}/js/`,
    css: `./build-v${version}/css/`,
    img: `./build-v${version}/img/`,
    fonts: `./build-v${version}/fonts/`
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
  clean: `./build-v${version}`
};

const styleguideOptsDev = {
  title: 'EE Styleguide',
  server: true,
  rootPath: path.build.common,
  disableEncapsulation: true,
  overviewPath: 'README.md',
  extraHead: [
    '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">',
    '<link rel="stylesheet" href="/sc5.css" />'
  ],
  afterBody: [
    '<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>',
    '<script src="/js/main.min.js"></script>'
  ]
};

const styleguideOptsBuild = {
  ...styleguideOptsDev,
  appRoot: '/styleguide',
  extraHead: [
    '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">',
    '<link rel="stylesheet" href="/styleguide/sc5.css" />'
  ],
  afterBody: [
    '<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>',
    '<script src="/styleguide/js/main.min.js"></script>'
  ]
};

gulp.task('styleguide:generate', () =>
  gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(styleguide.generate(styleguideOptsDev))
    .pipe(injectVersion())
    .pipe(gulp.dest(path.build.common)));

gulp.task('styleguide:generate:build', () =>
  gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(styleguide.generate(styleguideOptsBuild))
    .pipe(injectVersion())
    .pipe(gulp.dest(path.build.common)));

gulp.task('styleguide:applystyles', gulp.series('styleguide:generate', function () {
  return gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(sass().on('error', (err) => {
      console.log(err.stack);
      this.emit('end');
    }))
    .pipe(styleguide.applyStyles())
    .pipe(gulp.dest(path.build.common));
}));

gulp.task('styleguide:build', gulp.series(
  'styleguide:generate:build',
  'styleguide:applystyles'
));
gulp.task('styleguide', gulp.series(
  'styleguide:generate',
  'styleguide:applystyles'
));
gulp.task('html:build', () =>
  gulp.src(path.src.html)
    .pipe(gulp.dest(path.build.html)));

gulp.task('js:build', function () {
  return browserify({
    entries: path.src.js,
    debug: true
  })
    .transform(babelify)
    .bundle()
    .on('error', (err) => {
      console.log(err.stack);
      this.emit('end');
    })
    .pipe(source('main.min.js'))
    .pipe(buffer())
    .pipe(gulp.dest(path.build.js));
});

gulp.task('image:build', () =>
  gulp.src(path.src.img)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [pngquant()],
      interlaced: true
    }))
    .pipe(gulp.dest(path.build.img)));

gulp.task('fonts:build', () =>
  gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts)));

gulp.task('css:build', () =>
  gulp.src(path.src.css)
    .pipe(gulp.dest(path.build.common)));

gulp.task('lint:css', () =>
  gulp.src(path.src.style)
    .pipe(gulpStylelint({
      reporters: [
        { formatter: 'string', console: true }
      ]
    })));

gulp.task('lint:js', () =>
  gulp.src([path.src.jss, '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('watch', gulp.parallel('styleguide', () => {
  gulp.watch([path.src.html], { delay: 3000 }, gulp.parallel('html:build'));
  gulp.watch([path.src.style], { delay: 3000 }, gulp.parallel('styleguide'));
  gulp.watch([path.src.jss], { delay: 3000 }, gulp.parallel('js:build'));
  gulp.watch([path.src.img], gulp.parallel('image:build'));
  gulp.watch([path.src.fonts], gulp.parallel('fonts:build'));
}));

gulp.task('build', gulp.parallel(
  'html:build',
  'js:build',
  'css:build',
  'fonts:build',
  'image:build'
));

gulp.task('lint', gulp.parallel(
  'lint:js',
  'lint:css'
));

gulp.task('clean', cb => rimraf(path.clean, cb));

gulp.task('deploy', gulp.parallel('build', 'styleguide:build'));

gulp.task('default', gulp.series('build', 'watch'));
