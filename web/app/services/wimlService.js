(function () {
  "use strict";

  app.service('wimlService', ["$http", "backendAddress", "loginService", function($http, backendAddress, loginService) {
    var prepareRestaurantData = function(name, site) {
      var data = {
        "name": name,
        "site": site
      };
      return data;
    };

    this.getRestaurants = function(successCallback, errorCallback) {
      $http.get(backendAddress + "/restaurant/").then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      })
    };

    this.getRestaurant = function(id, successCallback, errorCallback) {
      $http.get(backendAddress + "/restaurant/" + id).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.postRestaurant = function(name, site, successCallback, errorCallback) {
      var data = prepareRestaurantData(name, site);
      var config = loginService.securityTokenHTTPConfig();
      $http.post(backendAddress + "/restaurant/", data, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.putRestaurant = function(id, name, site, successCallback, errorCallback) {
      var data = prepareRestaurantData(name, site);
      var config = loginService.securityTokenHTTPConfig();
      $http.put(backendAddress + "/restaurant/" + id, data, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.getLunches = function(successCallback, errorCallback) {
      $http.get(backendAddress + "/lunch/").then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    var prepareLunchData = function(userId, restaurantId, orderDate, deliveryDate) {
      var data = {
        "creator": userId,
        "restaurant": restaurantId,
        "order_date": orderDate,
        "delivery_date": deliveryDate
      };
      return data;
    };

    this.getLunch = function(id, successCallback, errorCallback) {
      $http.get(backendAddress + "/lunch/" + id).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.postLunch = function(restaurantId, orderDate, deliveryDate, successCallback, errorCallback) {
      var data = prepareLunchData(loginService.getId(), parseInt(restaurantId), orderDate, deliveryDate);
      var config = loginService.securityTokenHTTPConfig();
      $http.post(backendAddress + "/lunch/", data, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.putLunch = function(lunchId, status, successCallback, errorCallback) {
      var config = loginService.securityTokenHTTPConfig();
      $http.put(backendAddress + "/lunch/" + lunchId, {"status": status}, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    var prepareOrderData = function(userId, lunchId, menu, price) {
      var data = {
        "user": userId,
        "lunch": lunchId,
        "menu": menu,
        "price": price
      };
      return data;
    };

    this.getOrders = function(id, successCallback, errorCallback) {
      $http.get(backendAddress + "/lunch/" + id + "/orders/").then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.postOrder = function(lunchId, menu, price, successCallback, errorCallback) {
      var data = prepareOrderData(loginService.getId(), lunchId, menu, price);
      var config = loginService.securityTokenHTTPConfig();
      $http.post(backendAddress + "/order/", data, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.deleteOrder = function(id, successCallback, errorCallback) {
      var config = loginService.securityTokenHTTPConfig();
      $http.delete(backendAddress + "/order/" + id, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.getBalances = function(id, successCallback, errorCallback) {
      var config = loginService.securityTokenHTTPConfig();
      $http.get(backendAddress + "/balance/" + id, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.addBalance = function(id, value, successCallback, errorCallback) {
      var data = { 
        "giver": loginService.getId(),
        "taker": id,
        "value": value
      };
      var config = loginService.securityTokenHTTPConfig();
      $http.post(backendAddress + "/balance/", data, config).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };

    this.getUsers = function(successCallback, errorCallback) {
      $http.get(backendAddress + "/user/").then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        errorCallback(resp.status);
      });
    };
  }]);
}());