describe('statusFilter', function() {
  "use strict";
  
  var statusFilter;
  
  beforeEach(module("whereismylunchApp"));
  
  beforeEach(inject(function($filter) {
    statusFilter = $filter("status");
  }));
  
  it('returns correct values', function() {
    expect(statusFilter(0)).toBe("Created");
    expect(statusFilter(1)).toBe("Ordered");
    expect(statusFilter(2)).toBe("Arrived");
    expect(statusFilter(3)).toBe("Cancelled");
  });
});