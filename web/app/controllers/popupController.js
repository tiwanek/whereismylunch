(function () {
  "use strict";

  app.controller("popupController", ["$scope", "popupFactory", function($scope, popupFactory) {
    $scope.title = "";
    $scope.message = "";
    $scope.showInput = false;
    $scope.popupInput = "";

    var callback = null;

    $scope.runCallback = function() {
      if (callback) {
        var c = callback;
        callback = null;
        c($scope.popupInput);
      }
    };

    var init = function() {
      popupFactory.registerUI(function(title, color, message, input, inputCallback) {
        $scope.title = title;
        $scope.message = message;
        $scope.color = color;
        $('#customAppPopup').modal("show");
        $scope.showInput = input
        if (input) {
          callback = inputCallback;
        } else {
          callback = null;
        }
      });
    };

    init();
  }]);
}());