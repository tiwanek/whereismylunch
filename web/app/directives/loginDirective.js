(function () {
  "use strict";

  app.directive("customLoginNavbar", function() {
    return {
      templateUrl: "app/partials/login.html",
      controller: "loginController"
    };
  });
}());