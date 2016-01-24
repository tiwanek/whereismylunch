(function () {
  "use strict";

  app.controller("lunchController", ["$scope", "$location", "loginService", "wimlService", "popupFactory",
                                     function($scope, $location, loginService, wimlService, popupFactory) {
    $scope.hasLoaded = false;
    $scope.lunchesDisplay = [];
    $scope.lunches = [];
    $scope.canShow = false;

    $scope.addLunch = function() {
      if (!loginService.assureSession()) {
        return;
      }
      $location.path("/lunch/new");
    };

    $scope.showLunch = function() {
      var selection = $scope.lunches.filter(function(item) {
        return item.isSelected;
      });
      if (selection.length) {
        $location.path("/lunch/" + selection[0].id + "/order");
      }
    };

    var init = function() {
      wimlService.getLunches(function(data) {
        $scope.lunches = data;
        $scope.hasLoaded = true;
      }, function(status) {
        popupFactory.error("Failed to fetch data from server");
      });

      $scope.$watch('lunches', function(newVal) {
        var selection = newVal.filter(function(item) {
          return item.isSelected;
        });
        $scope.canShow = selection.length == 1;
      }, true);
    };

    init();
  }]);

  app.controller("lunchAddFormController", ["$scope", "$location", "loginService", "wimlService", "popupFactory",
                                            function($scope, $location, loginService, wimlService, popupFactory) {
    $scope.restaurants = [];
    $scope.lunchRestaurant = null;
    $scope.lunchOrderDate = null;
    $scope.lunchDeliveryDate = null;

    $scope.submitLunch = function() {
      if (!loginService.assureSession()) {
        return;
      }
      wimlService.postLunch($scope.lunchRestaurant, $scope.lunchOrderDate, $scope.lunchDeliveryDate, function() {
        $location.path("/lunch/");
      }, function() {
        popupFactory.error("Failed to create lunch");
      });
    };

    var init = function() {
      wimlService.getRestaurants(function(data) {
        $scope.restaurants = data;
      }, function(status) {
        popupFactory.error("Failed to fetch data from server");
      });

      $("#orderDatePicker").datetimepicker("setDate", new Date());
      $("#deliveryDatePicker").datetimepicker("setDate", new Date());
    };

    init();
  }]);
}());
