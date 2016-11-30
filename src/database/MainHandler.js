'use strict';

const autoIncrement = require('mongoose-auto-increment'),
    async = require ('async'),
    Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose'));

var mh=  require('./MergeHandler');
var th=  require('./TypeHandler');

/***************** Config *******************/
/* Url de la bdd */
//OU ('mongodb://user:pass@localhost:port/database');
const urlDb = 'mongodb://localhost:27017/geosm';

function initializeDb(){
        connect(function(){
            async.series(
                [
                    function(next) {
                        mh.initializeDb();
                        next();
                    },
                    function(next) {
                        th.initializeDb();
                        next();
                    },
                    function(next) {
                        th.persistStaticTypes(next);
                    },
                    function(next) {
                        next();
                    }
                ],
                function(err, response) {
                   //disconnect();
                }
            );
        });
}

function connect(next){
    if (!mongoose.connection.readyState){
        mongoose.connect(urlDb, function(){
            if (next){
                next();
            }
        });
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'))
          .on('close',function() {mongoose.connection.close();})
    }
    else {
        if (next){
            next();
        }
    }
}

function disconnect(){
    if (mongoose.connection.readyState){
        mongoose.disconnect();
    }
}

//initializeDb();
/*connect(mh.displayEveryMerges());*/

/*
connect(function(){
     var entity = {"coordinates":"48.7347563 - -0.240927",
    "population":null,"name":"La Fresnaye-au-Sauvage, Saint-Mâlo, Argentan, Orne, Normandie, France métropolitaine, 61210, France",
    "type":"Ville","source":"geosm","geonames_id":6435611,
    "osm_id":798178453};

    mh.MergeModel.findOneAndRemove(entity, function (err, merge) {
        console.log(merge);
        if (err)
            console.log(err);
    });
});
*/

/*connect(function(){
    var merge = {
        coordinates: { lat: 5.24776, lng: -9.2416499 },
        geonames_id: 2364431,
        //__v: 0,
        raw: null,
        osm_id: 3160673662,
        geojson: null,
        population: null,
        name: 'Paris, Sanquin Dist# 2, Sinoe County, Liberia',
        type: 'Ville',
        source: 'geosm'
    };
    var merge2 = {
        //coordinates: { lat: 5.24776, lng: -9.2416499 },
        geonames_id: 2364431,
        osm_id: 3160673662,
        name: 'Paris, Sanquin Dist# 2, Sinoe County, Liberia',
        type: 'Ville',
        source: 'geosm'
    };


    mh.MergeModel.findOneAndUpdateAsync(merge2, merge, {upsert: true}, function (err, doc) {
        if (err) {
            console.log(err);
        }
        else if (doc){
            console.log('doc');
            console.log(doc);
        }
    });
});*/

module.exports = {
    initializeDb
};
