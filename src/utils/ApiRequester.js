'use strict';

const request = require('request-promise');
const GLOBAL = require('../globals');

module.exports = {
    osm, geonames
};

var userGeonames = 'julse';

function osm(query) {
    return new Promise((resolve, reject) => {
        var osmquery = '[out:json];node[name=\"' + query + '\"];out;';
        // ajax request
        request(
          {
            url: GLOBAL.api_url.osm,
            qs: {data: osmquery/* username: userGeonames, maxRows : 10*/},
            method: 'GET',
            //json:true
          },
          function (err, res, body) {
            if (err) {
                return reject({err: "erreur"});
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject({err: "erreur"});
            }
            // if pas d'erreurs
            //var osmtogeojson = require('osmtogeojson');

            resolve(body);
        });
    });
}


function geonames(query , maxRows) {
  return new Promise((resolve, reject) => {

      // ajax request
      request(
        {
          url: GLOBAL.api_url.geonames,
          qs: {q: query, username: userGeonames, maxRows : maxRows},
          method: 'GET',
          json:true
        },
        function (err, res, body) {
          if (err) {
              return reject({err: "erreur"});
          } else if (res.statusCode !== 200) {
              err = new Error("Unexpected status code: " + res.statusCode);
              err.res = res;
              return reject({err: "erreur"});
          }
          // if pas d'erreurs
          resolve(body);
      });
  });
}
