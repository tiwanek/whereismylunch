(function () {
  "use strict";

  app.controller("loginController", ["$scope", "$location", "$route", "loginService", "popupFactory", 
                                     function($scope, $location, $route, loginService, popupFactory) {
    $scope.emailRegex = /^[^@][^@]*@[^.][^.]*\...*$/;
    $scope.loginError = "";
    $scope.loginName = "";
    $scope.loginPassword = "";
    $scope.registerError = "";
    $scope.registerName = "";
    $scope.registerPassword = "";
    $scope.registerPasswordRepeat = "";
    $scope.registerEmail = "";
    $scope.user = {
      'id': null,
      'name': "",
      'logged': false
    };

    var id = loginService.getId();
    if (id !== null) {
      $scope.user.id = id;
      $scope.user.name = loginService.getName();
      $scope.user.logged = true;
    }

    $scope.submitLogin = function() {
      loginService.login($scope.loginName, $scope.loginPassword, function() {
        $scope.user.id = loginService.getId();
        $scope.user.name = loginService.getName();
        $scope.user.logged = true;
        setTimeout(function() {
          $("#loginModal").modal('hide');
        }, 200);
        $route.reload();
      }, function() {
        $scope.loginError = "Login Failed";
      });
    };

    $scope.submitRegister = function() {
      if ($scope.registerPassword !== $scope.registerPasswordRepeat) {
        $scope.registerError = "Password mismatch";
        return;
      }
      loginService.register($scope.registerName, $scope.registerPassword, $scope.registerEmail, function() {
        $scope.registerError = "Registration Success";
        setTimeout(function() {
          $("#registerModal").modal('hide');
          $scope.registerError = "";
        }, 1000);
      }, function(error) {
          if (resp.status === 409) {
          $scope.registerError = "Name already taken";
        } else {
          $scope.registerError = "Registration failed";
        }
      });
    };

    $scope.logout = function() {
      loginService.logout();
      $scope.user.id = null;
      $scope.user.name = "";
      $scope.user.logged = false;
      $scope.loginError = "";
      $route.reload();
    };

    $scope.editUser = function() {
      $location.path("/user");
    };

    $scope.forgotPassword = function() {
      $("#loginModal").modal('hide');
      popupFactory.prompt("Type your email:", function(email) {  
        loginService.resetPassword(email, function() {
          popupFactory.info("Password reset email was sent");
        }, function(status) {
          if (status == 404) {
            popupFactory.error("Email is not registered");
          } else {
            popupFactory.error("Failed to reset password");
          }
        });
      });
    };

    var init = function() {
      loginService.setTriggerLoginAction(function() {
        $("#loginModal").modal('show');
      });
    };

    init();
  }]);

  app.controller("loginFormController", ["$scope", "$location", "loginService", "popupFactory",
                                         function($scope, $location, loginService, popupFactory) {
    $scope.userOldPassword = "";
    $scope.userPassword = "";
    $scope.userPasswordRepeat = "";
    $scope.userEmail = "";
    $scope.userName = "";
    $scope.userError = ""

    $scope.submitUserEdit = function() {
      if ($scope.userPassword !== $scope.userPasswordRepeat) {
        $scope.userError = "Password mismatch";
        return;
      }
      loginService.userEdit($scope.userOldPassword, $scope.userPassword, $scope.userEmail, function() {
        $location.path("/");
      }, function(status) {
        if (status == 403) {
          popupFactory.error("Failed to edit user. Does old password match?");
        } else {
          popupFactory.error("Failed to edit user");
        }
      });
    };

    var init = function() {
      if (!loginService.isLoggedIn()) {
        $location.path("/");
        return;
      }
      $scope.userName = loginService.getName();
      $scope.userEmail = loginService.getEmail();
    };

    init();
  }]);

  app.controller("loginResetFormController", ["$scope", "$location", "$routeParams", "loginService", "popupFactory",
                                              function($scope, $location, $routeParams, loginService, popupFactory) {
    $scope.userPassword = "";
    $scope.userPasswordRepeat = "";
    $scope.userError = ""

    $scope.submitReset = function() {
      if ($scope.userPassword !== $scope.userPasswordRepeat) {
        $scope.userError = "Password mismatch";
        return;
      }
      loginService.sendNewPassword($scope.userPassword, $routeParams.token, function() {
        popupFactory.info("Password reset. Please log in");
        $location.path("/");
      }, function(status) {
        popupFactory.error("Failed to reset password");
      });
    };
  }]);
}());