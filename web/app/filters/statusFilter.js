(function () {
  "use strict";

  app.filter("status", function() {
    return function(input) {
      switch (input) {
        case 0: {
          return "Created";
        }
        case 1: {
          return "Ordered";
        }
        case 2: {
          return "Arrived";
        }
        case 3: {
          return "Cancelled";
        }
      }
    }
  });
}());