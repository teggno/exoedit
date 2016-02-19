var gulp = require('gulp');
var exec = require('child_process').exec;

gulp.task('compileExtension', function(cb) {
  exec('node ./node_modules/vscode/bin/compile -p ./', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb();
  });
});

gulp.task('compileWidgetClient', function(cb) {
  exec('node ./node_modules/vscode/bin/compile -p ./widgetClient', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb();
  });
});

gulp.task('watch', function(){
    gulp.watch('./src/**/*', ['compileExtension']); 
    gulp.watch('./widgetClient/src/**/*', ['compileWidgetClient']); 
});

gulp.task('compile', ['compileExtension', 'compileWidgetClient'], function(){
});

 
