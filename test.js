var assert = require("assert");
var OtpCityBikeSource = require("./index");
var URL = require("url").URL;

describe("CityBikeSource", function() {
  it("fetch data", (done) => {
    const url = new URL("https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql");
    const source = new OtpCityBikeSource(url, () => {});
    assert.ok(source);

    // request tile in Helsinki
    source.getTile(14, 9326, 4741, function(err, response){
      assert.ok(response.length > 100);
      assert.ok(response);
      done();
    })
  });
});
