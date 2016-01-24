(function () {
  "use strict";

  app.service('loginService', ["$http", "$cookies", "$location", "backendAddress", function($http, $cookies, $location, backendAddress) {
    var self = this;
    var user = null;
    var loginAction = function() {}

    // TODO(t.iwanek): remove backendAddress dependency and add backend address setter...

    this.init = function() {
      var session = $cookies.get("session");
      if (session) {
        user = JSON.parse(session);
      }
    };

    this.login = function(name, password, successCallback, failureCallback) {
      $http.post(backendAddress + "/user/login", "", {
        headers: {
          "X-Authorization-User": name,
          "X-Authorization-Password": CryptoJS.SHA1(password).toString(CryptoJS.enc.Base64)
        }
      }).then(function(resp) {
        user = resp.data;
        $cookies.put("session", JSON.stringify(resp.data));
        successCallback();
      }, function() {
        failureCallback();
      });
    };

    this.logout = function() {
      $http.post(backendAddress + "/user/logout", "", self.securityTokenHTTPConfig());
      user = null;
      $cookies.remove("session");
    };

    this.register = function(name, password, email, successCallback, failureCallback) {
      $http.post(backendAddress + "/user/register", {
        "name": name,
        "password": CryptoJS.SHA1(password).toString(CryptoJS.enc.Base64),
        "email": email
      }).then(function(resp) {
        successCallback();
      }, function(resp) {
        failureCallback(resp.status);
      });
    };

    this.userEdit = function(oldPassword, password, email, successCallback, failureCallback) {
      $http.put(backendAddress + "/user/" + user.id, {
        "old_password": CryptoJS.SHA1(oldPassword).toString(CryptoJS.enc.Base64),
        "password": CryptoJS.SHA1(password).toString(CryptoJS.enc.Base64),
        "email": email
      }, self.securityTokenHTTPConfig()).then(successCallback, failureCallback);
    };

    this.resetPassword = function(email, successCallback, failureCallback) {
      var base_url = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/#";
      $http.post(backendAddress + "/user/reset_password", {
        "base_url": base_url + "/user/reset_password",
        "email": email
      }, {}).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        failureCallback(resp.status);
      });
    };

    this.sendNewPassword = function(password, token, successCallback, failureCallback) {
      $http.post(backendAddress + "/user/send_new_password", {
        "password": CryptoJS.SHA1(password).toString(CryptoJS.enc.Base64),
        "token": token
      }, {}).then(function(resp) {
        successCallback(resp.data);
      }, function(resp) {
        failureCallback(resp.status);
      });
    };

    this.getId = function() {
      if (user) {
        return user.id;
      } else {
        return null;
      }
    };

    this.getName = function() {
      if (user) {
        return user.name;
      } else {
        return null;
      }
    };

    this.getEmail = function() {
      if (user) {
        return user.email;
      } else {
        return null;
      }
    };

    this.isLoggedIn = function() {
      return user ? true : false;
    };

    this.triggerLogin = function() {
      loginAction();
    };

    this.setTriggerLoginAction = function(callback) {
      loginAction = callback;
    };

    this.assureSession = function() {
      if (!this.isLoggedIn()) {
        this.triggerLogin();
        return false;
      }
      return true;
    };

    this.securityTokenHTTPConfig = function() {
      var config = {};
      config["headers"] = {};
      config["headers"]["X-Authorization-Token"] = user ? user.token : null;
      return config;
    };

    this.init();
  }]);
}());