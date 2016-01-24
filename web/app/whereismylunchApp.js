var app = (function () {
  "use strict";

  var app = angular.module("whereismylunchApp", ['ngRoute', 'ngCookies', 'ngMessages', 'ngSanitize', 'smart-table']);
  app.config(["$routeProvider", function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: "app/partials/home.html"
      })
      .when('/user', {
        templateUrl: "app/partials/login_form.html",
        controller: "loginFormController"
      })
      .when('/user/reset_password/:token', {
        templateUrl: "app/partials/login_form_reset.html",
        controller: "loginResetFormController"
      })
      .when('/lunch', {
        templateUrl: "app/partials/lunch.html",
        controller: "lunchController"
      })
      .when('/lunch/new', {
        templateUrl: "app/partials/lunch_form.html",
        controller: "lunchAddFormController"
      })
      .when('/lunch/:id/order', {
        templateUrl: "app/partials/order.html",
        controller: "orderController"
      })
      .when('/lunch/:id/order/new', {
        templateUrl: "app/partials/order_form.html",
        controller: "orderAddFormController"
      })
      .when('/restaurant', {
        templateUrl: "app/partials/restaurant.html",
        controller: "restaurantContoller"
      })
      .when('/restaurant/new', {
        templateUrl: "app/partials/restaurant_form.html",
        controller: "restaurantAddFormContoller"
      })
      .when('/restaurant/:id/edit', {
        templateUrl: "app/partials/restaurant_form.html",
        controller: "restaurantEditFormContoller"
      })
      .when('/balance', {
        templateUrl: "app/partials/balance.html",
        controller: "balanceController"
      })
      .when('/balance/add', {
        templateUrl: "app/partials/balance_form.html",
        controller: "balanceAddFormController"
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
  app.constant("wimlConfig", {
    version: 1.0
  });
  app.factory("backendAddress", ["$location", function($location) {
    return $location.protocol() + "://" + $location.host() + ":5000";
  }]);

  return app;
}());