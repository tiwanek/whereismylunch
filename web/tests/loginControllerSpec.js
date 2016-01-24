describe('loginController', function() {
  "use strict";
  
  var $controller;
  var $scope;
  var $location;
  var $route;
  var loginService; 
  var popupFactory;
  
  var loggedIn;
  var doBackendFail;
  
  beforeEach(module("whereismylunchApp"));
  
  beforeEach(inject(function(_$controller_, $rootScope) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $location = new function() { 
      this.path = function() { };
    };
    $route = new function() { 
      this.reload = function() { };
    };
    loginService = new function() { 
      this.getName = function() {
        return loggedIn ? "user_a" : null;
      };
      this.getId = function() {
        return loggedIn ? 1 : null;
      }
      this.getEmail = function() {
        return loggedIn ? "user_a@localhost" : null;
      };
      this.setTriggerLoginAction = function() {};
      this.login = function(user, password, successCallback, errorCallback) { 
        if (doBackendFail) {
          errorCallback();
        } else {
          successCallback({name: "user_a", id: 1, token: "token"});
        }
      };
      this.logout = function() { };
      this.resetPassword = function() { };
    };
    popupFactory = new function() { 
      this.prompt = function(text, callback) {
        callback("user_a@localhost");
      };
      this.error = function() { };
    };
  }));
  
  it('initialize', function() {
    loggedIn = false;
    spyOn(loginService, "setTriggerLoginAction").and.callThrough();
    var loginController = $controller("loginController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    expect(loginController).not.toBeUndefined();
    expect(loginService.setTriggerLoginAction).toHaveBeenCalled();
  });
  
  it('logs user in', function() {
    loggedIn = false;
    doBackendFail = false;
    var loginController = $controller("loginController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    spyOn(loginService, "login").and.callThrough();
    
    $scope.userName = "user_a";
    $scope.password = "pass_a";
    $scope.submitLogin();
    
    expect(loginService.login).toHaveBeenCalled();
    expect(loginService.login.calls.mostRecent().args[0], "user_a");
    expect(loginService.login.calls.mostRecent().args[1], "pass_a");
    expect($scope.user.logged).toBe(true);
  });
  
  it('reports login failure', function() {
    loggedIn = false;
    doBackendFail = true;
    var loginController = $controller("loginController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    spyOn(loginService, "login").and.callThrough();
    
    $scope.userName = "user_a";
    $scope.password = "pass_a";
    $scope.submitLogin();
    
    expect(loginService.login).toHaveBeenCalled();
    expect(loginService.login.calls.mostRecent().args[0], "user_a");
    expect(loginService.login.calls.mostRecent().args[1], "pass_a");
    expect($scope.loginError).toBe("Login Failed");
    expect($scope.user.logged).toBe(false);
  });
  
  it('logs user out', function() {
    loggedIn = true;
    doBackendFail = false;
    var loginController = $controller("loginController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    expect($scope.user.id).toBe(1);
    expect($scope.user.name).toBe("user_a");
    expect($scope.user.logged).toBe(true);
    
    spyOn(loginService, "logout").and.callThrough();
    
    $scope.logout();
    
    expect(loginService.logout).toHaveBeenCalled();
    expect($scope.user.logged).toBe(false);
  });
  
  it('redirects to user view', function() {
    loggedIn = true;
    doBackendFail = false;
    var loginController = $controller("loginController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    spyOn($location, "path").and.callThrough();
    
    $scope.editUser();
    
    expect($location.path).toHaveBeenCalledWith("/user");
  });
  
  it('sends \'reset password\' request', function() {
    loggedIn = false;
    doBackendFail = false;
    var loginController = $controller("loginController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    spyOn(popupFactory, "prompt").and.callThrough();
    spyOn(loginService, "resetPassword").and.callThrough();
    
    $scope.forgotPassword();
    
    expect(popupFactory.prompt).toHaveBeenCalled();
    expect(loginService.resetPassword).toHaveBeenCalled();
    expect(loginService.resetPassword.calls.mostRecent().args[0]).toBe("user_a@localhost");
  });
});

describe('loginResetFormController', function() {
  "use strict";
  
  var $controller;
  var $scope;
  var $location;
  var $route;
  var loginService; 
  var popupFactory;
  
  var doBackendFail;
  
  beforeEach(module("whereismylunchApp"));
  
  beforeEach(inject(function(_$controller_, $rootScope) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $location = new function() { 
      this.path = function() { };
    };
    $route = function() { };
    loginService = new function() { 
      this.sendNewPassword = function(password, token, successCallback, errorCallback) { 
        if (doBackendFail) {
          errorCallback();
        } else {
          successCallback();
        }
      };
    };
    popupFactory = new function() { 
      this.error = function() { };
      this.info = function() { };
    };
  }));
  
  it('notifies about successfull password reset', function() {
    doBackendFail = false;
    var loginController = $controller("loginResetFormController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    spyOn(popupFactory, "info").and.callThrough();
    spyOn(popupFactory, "error").and.callThrough();
    spyOn($location, "path").and.callThrough();
    spyOn(loginService, "sendNewPassword").and.callThrough();
    
    $scope.userPassword = "password";
    $scope.userPasswordRepeat = "password";
    $scope.submitReset();
    
    expect(popupFactory.info).toHaveBeenCalled();
    expect(popupFactory.error).not.toHaveBeenCalled();
    expect($location.path).toHaveBeenCalled();
    expect(loginService.sendNewPassword).toHaveBeenCalled();
    expect(loginService.sendNewPassword.calls.mostRecent().args[0]).toBe("password");
  });
  
  it('notifies about error in password reset', function() {
    doBackendFail = true;
    var loginController = $controller("loginResetFormController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    spyOn(popupFactory, "info").and.callThrough();
    spyOn(popupFactory, "error").and.callThrough();
    spyOn($location, "path").and.callThrough();
    spyOn(loginService, "sendNewPassword").and.callThrough();
    
    $scope.userPassword = "password";
    $scope.userPasswordRepeat = "password";
    $scope.submitReset();
    
    expect(popupFactory.info).not.toHaveBeenCalled();
    expect(popupFactory.error).toHaveBeenCalled();
    expect($location.path).not.toHaveBeenCalled();
    expect(loginService.sendNewPassword).toHaveBeenCalled();
    expect(loginService.sendNewPassword.calls.mostRecent().args[0]).toBe("password");
  });
  
  it('notifies about successful password reset', function() {
    doBackendFail = false;
    var loginController = $controller("loginResetFormController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    spyOn(popupFactory, "info").and.callThrough();
    spyOn(popupFactory, "error").and.callThrough();
    spyOn($location, "path").and.callThrough();
    spyOn(loginService, "sendNewPassword").and.callThrough();
    
    $scope.userPassword = "password";
    $scope.userPasswordRepeat = "password_differs";
    $scope.submitReset();
    
    expect(popupFactory.info).not.toHaveBeenCalled();
    expect(popupFactory.error).not.toHaveBeenCalled();
    expect($location.path).not.toHaveBeenCalled();
    expect(loginService.sendNewPassword).not.toHaveBeenCalled();
    expect($scope.userError).toBe("Password mismatch");
  });
});

describe('loginFormController', function() {
  "use strict";
  
  var $controller;
  var $scope;
  var $location;
  var $route;
  var loginService; 
  var popupFactory;
  
  var doBackendFail;
  var loggedIn;
  
  beforeEach(module("whereismylunchApp"));
  
  beforeEach(inject(function(_$controller_, $rootScope) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $location = new function() { 
      this.path = function() { };
    };
    $route = function() { };
    loginService = new function() { 
      this.isLoggedIn = function() {
        return loggedIn;
      };
      this.getName = function() {
        return "user_a";
      };
      this.getEmail = function() {
        return "user@user.user";
      };
      this.userEdit = function(oldPassword, password, passwordRepeat, successCallback, errorCallback) {
        if (doBackendFail) {
          errorCallback();
        } else {
          successCallback();
        }
      }
    };
    popupFactory = new function() { 
      this.error = function() { };
    };
  }));
  
  beforeEach(function() {
    spyOn($location, "path").and.callThrough();
    spyOn(loginService, "getName").and.callThrough();
    spyOn(loginService, "getEmail").and.callThrough();
    spyOn(loginService, "userEdit").and.callThrough();
    spyOn(popupFactory, "error").and.callThrough();
  });
  
  it('redirects when not logged in', function() {
    doBackendFail = false;
    loggedIn = false;
    var loginController = $controller("loginFormController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    expect($location.path).toHaveBeenCalledWith("/");
    expect(loginService.getName).not.toHaveBeenCalled();
    expect(loginService.getEmail).not.toHaveBeenCalled();
    expect(loginService.userEdit).not.toHaveBeenCalled();
  });
  
  it('initializes form', function() {
    doBackendFail = false;
    loggedIn = true;
    var loginController = $controller("loginFormController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
      
    expect($location.path).not.toHaveBeenCalledWith("/");
    expect(loginService.getName).toHaveBeenCalled();
    expect(loginService.getEmail).toHaveBeenCalled();
    expect($scope.userName).toBe("user_a");
    expect($scope.userEmail).toBe("user@user.user");
  });
  
  it('sends user information update', function() {
    doBackendFail = false;
    loggedIn = true;
    var loginController = $controller("loginFormController", {
      $scope: $scope,
      $location: $location,
      $route: $route,
      loginService: loginService,
      popupFactory: popupFactory
    });
    
    $scope.userOldPassword = "oldpassword";
    $scope.userPassword = "password";
    $scope.userPasswordRepeat = "password";
    $scope.userEmail = "user@user.user";
    $scope.submitUserEdit();
      
    expect(loginService.userEdit).toHaveBeenCalled();
    expect($location.path).toHaveBeenCalledWith("/");
  });
});
