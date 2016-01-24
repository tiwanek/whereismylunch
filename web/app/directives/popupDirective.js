(function () {
  "use strict";

  app.directive("customAppPopup", function() {
    return {
      templateUrl: "app/partials/popup.html",
      controller: "popupController"
    };
  });
}());