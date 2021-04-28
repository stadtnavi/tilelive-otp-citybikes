"use strict"
const geojsonVt = require('geojson-vt');
const vtPbf = require('vt-pbf');
const request = require('requestretry');
const zlib = require('zlib');

const url = process.env.GRAPHQL_URL || "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";

const query = `
  query bikerentals {
    bikeRentalStations {
      stationId
      name
      networks
      lon
      lat
    }
  }`

class OtpCityBikeSource {
  constructor(uri, callback){
    this.uri = url;
    callback(null, this);
  };

  fetchBikeRentals(callback) {
    request({
      url: this.uri,
      body: query,
      maxAttempts: 120,
      retryDelay: 30000,
      method: "POST",
      headers: {
        'Content-Type': 'application/graphql'
      }
    }, function (err, res, body){
      if (err){
        console.log(err)
        callback(err);
        return;
      }

      const geoJSON = {type: "FeatureCollection", features: JSON.parse(body).data.bikeRentalStations.map(station => ({
        type: "Feature",
        geometry: {type: "Point", coordinates: [station.lon, station.lat]},
        properties: {
          id: station.stationId,
          name: station.name,
          networks: station.networks.join()
        }
      }))}

      const tileIndex = geojsonVt(geoJSON, {
        maxZoom: 20,
        buffer: 512
      });
      console.log(`${geoJSON.features.length} city bikes loaded from ${this.uri.href}`);

      callback(null, tileIndex);
    }.bind(this));
  }

  getTile(z, x, y, callback){
    this.fetchBikeRentals(function(err, tileIndex){
      if (err) {
        console.log("Error while fetching citybike data:", err);
        callback(err);
      }

      let tile = tileIndex.getTile(z, x, y);

      if (tile === null){
        tile = {features: []}
      }

      const data = Buffer.from(vtPbf.fromGeojsonVt({stations: tile}));

      zlib.gzip(data, function (err, buffer) {
        if (err){
          callback(err);
          return;
        }

        callback(null, buffer, {"content-encoding": "gzip"})
      })
    });
  }

  getInfo(callback){
    callback(null, {
      format: "pbf",
      vector_layers: [{
        description: "",
        id: "stations"
      }],
      maxzoom: 20,
      minzoom: 1,
      name: "OTP Citybikes"
    })
  }
}

module.exports = OtpCityBikeSource

module.exports.registerProtocols = (tilelive) => {
  tilelive.protocols['otpcitybikes:'] = OtpCityBikeSource
}
