(function () {
  "use strict";

  app.factory("popupFactory", function() {
    var Popup = function() {
      this.callback = function() {};
    };

    Popup.prototype.info = function(message) {
      this.callback("Info", "text-default", message, false);
    };

    Popup.prototype.warning = function(message) {
      this.callback("Warning", "text-warning", message, false);
    };

    Popup.prototype.error = function(message) {
      this.callback("Error", "text-danger", message, false);
    };

    Popup.prototype.prompt = function(message, callback) {
      var text = "";
      this.callback("Input", "text-default", message, true, callback);
    };

    Popup.prototype.registerUI = function(callback) {
      this.callback = callback;
    }

    return new Popup();
  });
}());