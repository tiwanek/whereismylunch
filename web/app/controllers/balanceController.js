(function () {
  "use strict";

  app.controller("balanceController", ["$scope", "$location", "loginService", "wimlService", "popupFactory",
                                       function($scope, $location, loginService, wimlService, popupFactory) {
    $scope.balancesDisplay = [];
    $scope.balances = [];
    $scope.hasLoaded = false;

    $scope.addBalance = function() {
      $location.path("/balance/add");
    };

    var init = function() {
      if (!loginService.isLoggedIn()) {
        $scope.hasLoaded = true;
        return;
      }

      var id = loginService.getId();
      wimlService.getBalances(id, function(data) {
        $scope.balances = data.map(function(item) {
          if (item.first_user.id === id) {
            return {"user": item.second_user.name, "value": item.value};
          } else {
            return {"user": item.first_user.name, "value": item.value};
          }
        });
        $scope.hasLoaded = true;
      }, function(status) {
        popupFactory.error("Failed to fetch data from server");
      })
    };

    init();
  }]);

  app.controller("balanceAddFormController", ["$scope", "$location", "loginService", "wimlService", "popupFactory",
                                              function($scope, $location, loginService, wimlService, popupFactory) {
    $scope.balanceValue = null;
    $scope.userId = null;
    $scope.users = [];

    $scope.submitBalance = function() {
      wimlService.addBalance($scope.userId, $scope.balanceValue * 100, function(data) {
        $location.path("/balance");
      }, function(status) {
        popupFactory.error("Failed to add balance");
      });
    };

    var init = function() {
      var id = loginService.getId();
      wimlService.getUsers(function(data){
        $scope.users = data.filter(function(item) { return item.id != id; });
      }, function(status) {
        popupFactory.error("Failed to fetch data from server");
      });
    };

    init();
  }]);
}());