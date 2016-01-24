(function () {
  "use strict";

  app.controller("orderController", ["$scope", "$routeParams", "$location", "wimlService", "popupFactory", "loginService", 
                                     function($scope, $routeParams, $location, wimlService, popupFactory, loginService) {
    $scope.hasLoaded = false;
    $scope.orders = [];
    $scope.orderTotal = 0;
    $scope.lunch = null;
    $scope.canJoin = false;
    $scope.canDelete = false;
    $scope.canOrder = false;
    $scope.canDeliver = false;
    $scope.canCancel = false;
    $scope.canRefresh = false;

    var getLunch = function() {
          wimlService.getLunch(parseInt($routeParams.id), function(data) {
        $scope.lunch = data;
        $scope.canJoin = $scope.lunch.status == 0;

        $scope.$watch('orders', function(newVal) {
          var selection = newVal.filter(function(item) {
            return item.isSelected;
          });
          $scope.canDelete = false;
          $scope.canOrder = false;
          $scope.canDeliver = false;
          $scope.canCancel = false;
          if (selection.length) {
            if (loginService.isLoggedIn) {
              // participant panel
              $scope.canDelete = selection[0].user.id == loginService.getId() && $scope.lunch.status == 0;
            }
          }

          // order creator panel
          if ($scope.lunch.creator.id === loginService.getId()) {
            switch ($scope.lunch.status) {
              case 0: {
                $scope.canOrder = true;
                $scope.canCancel = true;
                break;
              }
              case 1: {
                $scope.canDeliver = true;
                $scope.canCancel = true;
                break;
              }
            }
          }

          $scope.canRefresh = $scope.canDeliver || $scope.canCancel || $scope.canOrder;
        }, true);
      }, function() {
        popupFactory.error("Failed to fetch data from server");
      });
    };

    $scope.getOrders = function() {
      wimlService.getOrders(parseInt($routeParams.id), function(data) {
        $scope.orders = data;
        $scope.hasLoaded = true;
        $scope.orderTotal = $scope.orders.reduce(function(previous, item) { return previous + item.price; }, 0);
      }, function() {
        popupFactory.error("Failed to fetch data from server");
      });
    };

    $scope.joinLunch = function() {
      if (!loginService.assureSession()) {
        return;
      }
      $location.path("/lunch/" + $routeParams.id + "/order/new");
    };

    $scope.deleteOrder = function() {
      var selection = $scope.orders.filter(function(item) {
        return item.isSelected;
      });
      if (selection.length) {
        wimlService.deleteOrder(selection[0].id, function() {
          $scope.getOrders();
        }, function() {
          popupFactory.error("Failed to delete order");
        });
      }
    };

    var changeOrderStatus = function(status) {
      wimlService.putLunch($scope.lunch.id, status, function() {
        getLunch();
      }, function() {
        popupFactory.error("Failed to change state of lunch");
      });
    };

    $scope.orderLunch = function() {
      changeOrderStatus(1);
    };

    $scope.deliverLunch = function() {
      changeOrderStatus(2);
    };

    $scope.cancelLunch = function() {
      changeOrderStatus(3);
    };

    var init = function() {
      getLunch();
      $scope.getOrders();
    };

    init();
  }]);

  app.controller("orderAddFormController", ["$scope", "$routeParams", "$location", "wimlService", "popupFactory", "loginService",
                                            function($scope, $routeParams, $location, wimlService, popupFactory, loginService) {
    $scope.orderMenu = null;
    $scope.orderPrice = null;

    $scope.submitOrder = function() {
      if (!loginService.assureSession()) {
        return;
      }
      wimlService.postOrder(parseInt($routeParams.id), $scope.orderMenu, Math.floor($scope.orderPrice * 100), function() {
        $location.path("/lunch/" + $routeParams.id + "/order/");
      }, function() {
        popupFactory.callback("Failed to create order");
      });
    };
  }]);
}());