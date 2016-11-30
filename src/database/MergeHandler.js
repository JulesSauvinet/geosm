'use strict';

const Promise = require('bluebird'),
        async = require ('async'),
    mongoose = Promise.promisifyAll(require('mongoose')),
    autoIncrement = require('mongoose-auto-increment');


/*************** Les schémas *****************/
const mergeSchema = mongoose.Schema({
    osm_id: {type: Number || null, required: true},
    geonames_id: {type: Number || null, required: true},
    raw : {},
    type : {type:String},
    name :  {type: String},
    population : {type : Number || null},
    coordinates : {type:String}
},{strict: false, versionKey : false});
const statsSchema = mongoose.Schema({
    attribute: {type: String, required: true},
    type: {type: String}, //faire des statistiques en fonction du type cf config
    stat: {
        osm : {type: Number,  default: 0},
        geonames: {type: Number,  default: 0},
        geosm: {type: Number,  default: 0}
    }
},{strict: false, versionKey : false});

mongoose.set('debug', true);
/************** Les modeles ******************/
const MergeModel = mongoose.model('merges', mergeSchema);
const StatModel = mongoose.model('stats', statsSchema);

const urlDb = 'mongodb://localhost:27017/geosm';

function initializeDb(next){
    if (!mongoose.connection.readyState)
        mongoose.connect(urlDb);
    var db = mongoose.connection;
    autoIncrement.initialize(db);
    mergeSchema.plugin(autoIncrement.plugin, 'merges');
    statsSchema.plugin(autoIncrement.plugin, 'stats');
    if (next)
        next();
}

/* Fonction generique d'affichage d'un model */
function displayModel(model, next) {

    model.findAsync( function (err, entity) {
        if (err) return console.error(err);
        console.log(entity);
        if (next)
            next();
    });
}

  /*********************************************************************************************************/
 /******************************************* Partie MERGES ***********************************************/
/*********************************************************************************************************/


function persistMerges(merges, next) {
    var notMerged = [];
    for (var i = 0; i < merges.length; ++i) {
        var merge = merges[i];
        if (i == merges.length - 1) {

            if (merge.__v){
                delete merge.__v;
            }

            var entityQuery = {geonames_id: merge.geonames_id, osm_id : merge.osm_id};


            var j = 0;
            if (merge.extra_attrs){
               if (merge.extra_attrs.length == 0)
                    delete merge.extra_attrs;
            }

            MergeModel.findOneAndUpdateAsync(entityQuery, merge, {upsert: true}, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                else if (doc){
                    notMerged.push(doc);
                }
                if (next) {
                    next(err, notMerged);
                }
            });
        }
        else {
            if (merge.__v){
                delete merge.__v;
            }
            var entityQuery = {geonames_id: merge.geonames_id, osm_id : merge.osm_id};

            var j = 0;
            if (merge.extra_attrs){
               if (merge.extra_attrs.length == 0)
                    delete merge.extra_attrs;
            }

            MergeModel.findOneAndUpdateAsync(entityQuery, merge, {upsert: true}, function (err, doc) {
                if (err) {
                    console.log(err);
                    next(err, doc);
                    return;
                }
                else if (doc){
                    notMerged.push(doc);
                }
            });
        }
    }
}

function persistMergeAndUpdateStat(mergeAndStat, mergeExtras, cb){
    if (typeof mergeExtras === 'function') {
        cb = mergeExtras;
        mergeExtras = {};
      }

    var attributes = [];
    var sources = [];

    var entityToPersist = {};

    for (var i in mergeAndStat) {
        if (mergeAndStat.hasOwnProperty(i)) {
            attributes.push(i);
            sources.push(mergeAndStat[i].source);
            entityToPersist[i] = mergeAndStat[i].value;
        }
    }

    var extra_attrs = [];
    for (var i in mergeExtras) {
        if (mergeExtras.hasOwnProperty(i)) {
            //console.log(mergeExtras[i]);
            var mergeExtra = mergeExtras[i];
            extra_attrs.push( mergeExtra); //.name, = mergeExtra.value;
        }
    }

    entityToPersist.extra_attrs = extra_attrs;
    var type = entityToPersist.type;

    async.series(
                [
                    function(next) {
                        updateStats(attributes, sources, type, next);
                    },
                    function(next) {
                        updateMerge(entityToPersist, next);
                    }
                ],
                function(err, merge) {
                    /*console.log('STAT AND MERGE OK');
                    console.log(err);
                    console.log(merge);*/
                   cb(err, merge[1]);
                }
            );
}

function updateMerge(entityToPersist, next) {
    if (entityToPersist.__v)
        delete entityToPersist.__v;

    var entityQuery = {geonames_id: entityToPersist.geonames_id, osm_id : entityToPersist.osm_id};

    if (entityToPersist.extra_attrs){
        if (entityToPersist.extra_attrs.length == 0)
            delete entityToPersist.extra_attrs;
    }

     MergeModel.findOneAndUpdateAsync(entityQuery, entityToPersist, {upsert:true},(function(err,merge){
         if (err)
             console.log(err);

         if (next)
             next(err, merge);
    }));
}


function displayEveryMerges() {displayModel(MergeModel);}

function getEveryMerges(cb){
    MergeModel.find(function(err,docs){
        var docsParsed = [];
        docs.forEach(function(doc){
           var docParsed = doc;
            if (docParsed.__v){
                delete docParsed.__v;
            }

            if (!docParsed.source)
                docParsed.source = 'geosm';

            docsParsed.push(docParsed);
        });


        cb(err,docsParsed);
    });
}

function getMergesByPropertyName(propertyName){
    var query = MergeModel.where(propertyName).ne(null);
    query.execAsync().then(function(merges){
        return merges;
    });
}

function getMergesByPropertyNameAndValue(propertyName, propertyValue){
    var query = MergeModel.where(propertyName).equals(propertyValue);
    query.execAsync().then(function (err, merges) {
      return merges;
    });
}

function removeMergeById(id, next){
    var query =MergeModel.findByIdAndRemoveAsync(id);
    query.exec().then(function (err, merges) {
        if (next)
            next();
    });
}

function removeMerge(entityToRemove, next){

    if (entityToRemove.__v){
        delete entityToRemove.__v;
    }

    var entityQuery = {geonames_id: entityToRemove.geonames_id, osm_id : entityToRemove.osm_id};

    var query =MergeModel.findOneAndRemoveAsync(entityQuery, function (err, merge) {
        //console.log(merge);
        if (err)
            console.log(err);
        if (next)
            next();
    });

}

  /*********************************************************************************************************/
 /******************************************* Partie STATS ************************************************/
/*********************************************************************************************************/

function updateStat(attribute,source, type, fn) {
    //console.log(attribute);
    var query  = { attribute : attribute };
    var incObject = {$inc: {'stat.geosm' : 1}, type : type};
    if (source == 'osm')
        var incObject = {$inc: {'stat.osm' : 1}, type : type};
    if (source == 'geonames')
        var incObject = {$inc: {'stat.geonames' : 1}, type : type};
    StatModel.findOneAndUpdateAsync(query, incObject, {upsert:true, setDefaultsOnInsert : true},function (err, stat) {
         if (err) {console.log(err);mongoose.disconnect();}
         if (fn){
            fn();
         }
    });
}

function updateStats(attributes,sources, type, next) {
    for (var i = 0; i < attributes.length; ++i) {
        var attribute = attributes[i];
        var source = sources[i];
        if (i == attributes.length - 1) {
            var query  = { attribute : attribute };
            var incObject = {$inc: {'stat.geosm' : 1}, type : type};
            if (source == 'osm')
                var incObject = {$inc: {'stat.osm' : 1}, type : type};
            if (source == 'geonames')
                var incObject = {$inc: {'stat.geonames' : 1}, type : type};
            StatModel.findOneAndUpdateAsync(query, incObject, {upsert:true, setDefaultsOnInsert : true},function (err,doc) {
                if (err) {
                    console.log(err);
                }
                if (next) {
                    next();
                }
            });
        }
        else {
            var query  = { attribute : attribute };
            var incObject = {$inc: {'stat.geosm' : 1}, type : type};
            if (source == 'osm')
                var incObject = {$inc: {'stat.osm' : 1}, type : type};
            if (source == 'geonames')
                var incObject = {$inc: {'stat.geonames' : 1}, type : type};
            StatModel.findOneAndUpdateAsync(query, incObject, {upsert:true, setDefaultsOnInsert : true},function (err,doc) {
                if (err) {
                    next(err, doc);
                    return;
                }
            });
        }
    }
}

function displayEveryStats() {displayModel(StatModel);}

function getEveryStats(next){
    StatModel.findAsync().done(next);
}

function getStatFromAttribute(attribute, fn){
     var query = StatModel.findOneAsync({ 'attribute': attribute});
    query.select('stat');
    query.exec(function (err, stat) {
    if (fn)
        fn();
      return stat;
    });
}

function removeStat(attribute, fn){
    var query =StatModel.findOneAndRemove({'attribute' : attribute});
    query.execAsync(function (err, stats) {
      if (fn){
        fn();
      }
    });
}

module.exports = {
    MergeModel, StatModel,
    initializeDb, displayEveryStats, displayEveryMerges, removeMerge,
    persistMerges, updateMerge, getEveryMerges, getMergesByPropertyName,
    getMergesByPropertyNameAndValue, removeMergeById, persistMergeAndUpdateStat,
    updateStat, updateStats,  getEveryStats, getStatFromAttribute, removeStat
};


