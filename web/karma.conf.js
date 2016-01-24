// Karma configuration
// Generated on Sun Feb 14 2016 21:31:29 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/crypto-js/crypto-js.js',
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/bootstrap/dist/js/bootstrap.min.js',
      'node_modules/bootstrap-datetimepicker.js/js/bootstrap-datetimepicker.min.js',
      'node_modules/angular/angular.min.js',
      'node_modules/angular-route/angular-route.min.js',
      'node_modules/angular-cookies/angular-cookies.min.js',
      'node_modules/angular-messages/angular-messages.min.js',
      'node_modules/angular-sanitize/angular-sanitize.min.js',
      'node_modules/angular-smart-table/dist/smart-table.min.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/karma-read-json/karma-read-json.js',
      
      'app/whereismylunchApp.js',
      'app/services/loginService.js',
      'app/services/wimlService.js',
      'app/factories/popupFactory.js',
      'app/controllers/balanceController.js',
      'app/controllers/lunchController.js',
      'app/controllers/restaurantController.js',
      'app/controllers/loginController.js',
      'app/controllers/orderController.js',
      'app/controllers/popupController.js',
      'app/directives/loginDirective.js',
      'app/directives/popupDirective.js',
      'app/filters/statusFilter.js',
      
      'tests/*Spec.js',
      
      {pattern: "tests/responses/*.json", included: false}
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox', 'Opera'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
