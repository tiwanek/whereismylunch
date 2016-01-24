(function () {
  "use strict";

  app.controller("restaurantContoller", ["$scope", "$location", "loginService", "wimlService", "popupFactory", 
                                         function($scope, $location, loginService, wimlService, popupFactory) {
    $scope.hasLoaded = false;
    $scope.restaurantsDisplay = [];
    $scope.restaurants = [];
    $scope.canEdit = false;

    $scope.addRestaurant = function() {
      if (!loginService.assureSession()) {
        return;
      }
      $location.path("/restaurant/new");
    };

    $scope.editRestaurant = function() {
      if (!loginService.assureSession()) {
        return;
      }
      var selected = null;
      for (var i = 0; i < $scope.restaurants.length; ++i) {
        if ($scope.restaurants[i].isSelected === true) {
          selected = $scope.restaurants[i];
          break;
        }
      }
      if (selected) {
        $location.path("/restaurant/" + selected.id + "/edit");
      }
    };

    var init = function() {
      wimlService.getRestaurants(function(data) {
        $scope.restaurants = data;
        $scope.hasLoaded = true;
      }, function(status) {
        popupFactory.error("Failed to fetch data from server");
      });

      $scope.$watch('restaurants', function(newVal) {
        var selection = newVal.filter(function(item) {
          return item.isSelected;
        });
        $scope.canEdit = selection.length === 1;
      }, true);
    };

    init();
  }]);

  app.controller("restaurantEditFormContoller", ["$scope", "$location", "$routeParams", "loginService", "wimlService", "popupFactory", 
                                                 function($scope, $location, $routeParams, loginService, wimlService, popupFactory) {
    $scope.restaurantName = null;
    $scope.restaurantSite = null;
    $scope.message = "Edit restaurant";

    $scope.submitRestaurant = function() {
      if (!loginService.assureSession()) {
        return;
      }
      var id = parseInt($routeParams.id);  // TODO(t.iwanek): great parsing, fix me...
      wimlService.putRestaurant(id, $scope.restaurantName, $scope.restaurantSite, function() {
        $location.path("/restaurant/");
      }, function() {
        popupFactory.show("Failed to edit restaurant");
      });
    };

    var getRestaurant = function(id) {
      wimlService.getRestaurant(id, function(data) {
        $scope.restaurantName = data.name;
        $scope.restaurantSite = data.site;
      }, function(status) {
        popupFactory.error("Failed to fetch data from server");
      });
    };

    var init = function() {
      var id = parseInt($routeParams.id);  // TODO(t.iwanek): great parsing, fix me...
      getRestaurant(id);
    };

    init();
  }]);

  app.controller("restaurantAddFormContoller", ["$scope", "$location", "loginService", "wimlService", "popupFactory",
                                                function($scope, $location, loginService, wimlService, popupFactory) {
    $scope.restaurantName = null;
    $scope.restaurantSite = null;
    $scope.message = "Add restaurant";

    $scope.submitRestaurant = function() {
      if (!loginService.assureSession()) {
        return;
      }
      wimlService.postRestaurant($scope.restaurantName, $scope.restaurantSite, function() {
        $location.path("/restaurant/");
      }, function() {
        popupFactory.error("Failed to add restaurant");
      });
    };
  }]);
}());