describe('balanceController', function() {
  "use strict";
  
  var $controller;
  var $scope;
  var $location; 
  var loginService; 
  var wimlService;
  var popupFactory;
  
  var loggedIn;
  
  beforeEach(module("whereismylunchApp"));
  
  beforeEach(inject(function(_$controller_, $rootScope) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $location = function() { };
    loginService = new function() { 
      this.isLoggedIn = function() {
        return loggedIn;
      };
      this.getId = function() {
        return 1;
      };
    };
    wimlService = new function() {
      this.getBalances = function(id, callback) {
        callback(readJSON("tests/responses/balances.json"));
      };
    };
    popupFactory = function() { };
  }));
  
  it('queries balances', function() {
    loggedIn = true;
    var balanceController = $controller("balanceController", {
      $scope: $scope,
      $location: $location,
      loginService: loginService,
      wimlService: wimlService,
      popupFactory: popupFactory
    });
    
    expect(balanceController).not.toBeUndefined();
    expect($scope.hasLoaded).toBe(true);
    expect($scope.balances.length).toBe(2);
    $scope.balances.forEach(function(item) { expect(item.user).toBe("user_b"); });
  });
  
  it('doesn\'t query balances if user is not logged in', function() {
    loggedIn = false;
    var balanceController = $controller("balanceController", {
      $scope: $scope,
      $location: $location,
      loginService: loginService,
      wimlService: wimlService,
      popupFactory: popupFactory
    });
    
    expect(balanceController).not.toBeUndefined();
    expect($scope.hasLoaded).toBe(true);
    expect($scope.balances.length).toBe(0);
  });
});

describe('balanceAddFormController', function() {
  "use strict";
  
  var $controller;
  var $scope;
  var $location; 
  var loginService; 
  var wimlService;
  var popupFactory;
  
  var doBackendFail;
  
  beforeEach(module("whereismylunchApp"));
  
  beforeEach(inject(function(_$controller_, $rootScope) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $location = new function() { 
      this.path = function(path) {
        
      };
    };
    loginService = new function() { 
      this.isLoggedIn = function() {
        return true;
      };
      this.getId = function() {
        return 1;
      };
    };
    wimlService = new function() {
      this.getBalances = function(id, successCallback, errorCallback) {
        if (doBackendFail) {
          errorCallback(500);
        } else {
          successCallback(readJSON("tests/responses/balances.json"));
        }
      };
      this.getUsers = function(successCallback, errorCallback) {
        if (doBackendFail) {
          errorCallback(500);
        } else {
          successCallback(readJSON("tests/responses/users.json"));
        }
      };
      this.addBalance = function(id, value, successCallback, errorCallback) {
        if (doBackendFail) {
          errorCallback(500);
        } else {
          successCallback();
        }
      };
    };
    popupFactory = new function() { 
      this.error = function() { };
    };
  }));
  
  it('initializes', function() {
    doBackendFail = false;
    spyOn(loginService, "getId").and.callThrough();
    spyOn(wimlService, "getUsers").and.callThrough();
    var balanceController = $controller("balanceAddFormController", {
      $scope: $scope,
      $location: $location,
      loginService: loginService,
      wimlService: wimlService,
      popupFactory: popupFactory
    });
    
    expect(balanceController).not.toBeUndefined();
    expect(loginService.getId).toHaveBeenCalled();
    expect(wimlService.getUsers).toHaveBeenCalled();
  });
  
  it('initializes with backend error', function() {
    doBackendFail = true;
    spyOn(loginService, "getId").and.callThrough();
    spyOn(wimlService, "getUsers").and.callThrough();
    spyOn(popupFactory, "error").and.callThrough();
    var balanceController = $controller("balanceAddFormController", {
      $scope: $scope,
      $location: $location,
      loginService: loginService,
      wimlService: wimlService,
      popupFactory: popupFactory
    });
    
    expect(balanceController).not.toBeUndefined();
    expect(loginService.getId).toHaveBeenCalled();
    expect(wimlService.getUsers).toHaveBeenCalled();
    expect(popupFactory.error).toHaveBeenCalled();
  });
  
  it('submits balance', function() {
    doBackendFail = false;
    var balanceController = $controller("balanceAddFormController", {
      $scope: $scope,
      $location: $location,
      loginService: loginService,
      wimlService: wimlService,
      popupFactory: popupFactory
    });
    expect(balanceController).not.toBeUndefined();
    
    spyOn(wimlService, "addBalance").and.callThrough();
    spyOn($location, "path").and.callThrough();
    
    $scope.userId = 2;
    $scope.balanceValue = 100
    $scope.submitBalance();
    
    expect(wimlService.addBalance).toHaveBeenCalled();
    expect(wimlService.addBalance.calls.mostRecent().args[0]).toBe(2);
    expect(wimlService.addBalance.calls.mostRecent().args[1]).toBe(10000);
    expect($location.path).toHaveBeenCalledWith("/balance");
  });
  
  it('submits balance with backend error', function() {
    doBackendFail = true;
    var balanceController = $controller("balanceAddFormController", {
      $scope: $scope,
      $location: $location,
      loginService: loginService,
      wimlService: wimlService,
      popupFactory: popupFactory
    });
    expect(balanceController).not.toBeUndefined();
    
    spyOn(wimlService, "addBalance").and.callThrough();
    spyOn($location, "path").and.callThrough();
    spyOn(popupFactory, "error").and.callThrough();
    
    $scope.submitBalance();
    
    expect(wimlService.addBalance).toHaveBeenCalled();
    expect($location.path).not.toHaveBeenCalledWith("/balance");
    expect(popupFactory.error).toHaveBeenCalled();
  });
});