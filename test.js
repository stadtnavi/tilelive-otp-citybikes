var assert = require("assert");
var OtpCityBikeSource = require("./index");
var URL = require("url").URL;

describe("CityBikeSource", function() {
  it("fetch data", (done) => {
    const source = new OtpCityBikeSource(null, () => {});
    assert.ok(source);

    // request tile in Helsinki
    source.getTile(14, 9326, 4741, function(err, response){
      assert.ok(response.length > 100);
      assert.ok(response);
      done();
    })
  });
});
