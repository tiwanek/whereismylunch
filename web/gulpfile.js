"usr strict";

var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var plumber = require("gulp-plumber");
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var webserver = require('gulp-webserver');
var del = require("del");

gulp.task("clean", function(done) {
  del("dist/").then(function() { done(); });
});

gulp.task("deps-js", function() {
  gulp.src(["node_modules/bootstrap/dist/css/bootstrap.min.css",
           "node_modules/bootstrap/dist/css/bootstrap-theme.min.css",
           "node_modules/bootstrap-datetimepicker.js/css/bootstrap-datetimepicker.min.css",
           "node_modules/crypto-js/crypto-js.js",
           "node_modules/jquery/dist/jquery.min.js",
           "node_modules/bootstrap/dist/js/bootstrap.min.js",
           "node_modules/bootstrap-datetimepicker.js/js/bootstrap-datetimepicker.min.js",
           "node_modules/angular/angular.min.js",
           "node_modules/angular-route/angular-route.min.js",
           "node_modules/angular-cookies/angular-cookies.min.js",
           "node_modules/angular-messages/angular-messages.min.js",
           "node_modules/angular-sanitize/angular-sanitize.min.js",
           "node_modules/angular-smart-table/dist/smart-table.min.js"])
  .pipe(gulp.dest("dist/deps/js/"));
});

gulp.task("deps-css", function() {
  gulp.src(["node_modules/bootstrap/dist/css/bootstrap.min.css",
            "node_modules/bootstrap/dist/css/bootstrap-theme.min.css",
            "node_modules/bootstrap-datetimepicker.js/css/bootstrap-datetimepicker.min.css"])
  .pipe(gulp.dest("dist/deps/css/"));
});

gulp.task("deps-fonts", function() {
  gulp.src(["node_modules/bootstrap/fonts/*"])
  .pipe(gulp.dest("dist/deps/fonts/"));
});

gulp.task("html", function() {
  gulp.src("index.html")
  .pipe(gulp.dest("dist/"));
  gulp.src("app/partials/*.html")
  .pipe(gulp.dest("dist/app/partials/"));
});

gulp.task("scripts", function() {
  gulp.src("app/**/*.js")
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(concat('app.js'))
  .pipe(rename({suffix: ".min"}))
  .pipe(sourcemaps.write("."))
  .pipe(gulp.dest("dist/app/js/"));
});

gulp.task("dist", ["deps-css", "deps-js", "deps-fonts", "scripts", "html"], function(done) {
  done();
});

gulp.task("build", ["clean"], function() {
  gulp.start("dist");
});

gulp.task("webserver", ["dist"], function() {
  gulp.src("dist/")
  .pipe(webserver({
    port: 8000
  }));
});

gulp.task("watch", function() {
  gulp.watch("app/**/*.js", ["scripts"]);
  gulp.watch(["**/*.html", "!dist/**/*.html"], ["html"]);
});

gulp.task("default", ["dist", "watch", "webserver"]);