'use strict';

const Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose')),
    autoIncrement = require('mongoose-auto-increment'),
    async = require("async");

//mongoose.set('debug', true);

const typeSchema = mongoose.Schema({
    type: {type: String, required: true},
    namefr: {type: String, required: true}
},{strict: false, versionKey : false});



/*******************************
 * Equivalence des types
 *******************************/
const osmEquivTypeSchema = mongoose.Schema({
    type: {type: String, required: true},
    equiv: []
},{strict: false});


const geoFclEquivSchema = mongoose.Schema({
    type: {type: String, required: true},
    equiv: []
},{strict: false});

const geoFcodeEquivSchema = mongoose.Schema({
    type: {type: String, required: true},
    equiv: []
},{strict: false});

const TypeModel = mongoose.model('types', typeSchema);
const OsmEquivModel = mongoose.model('equivOsm', osmEquivTypeSchema);
const FclEquivModel = mongoose.model('equivFcl', geoFclEquivSchema);
const FCodeEquivModel = mongoose.model('equivFcode', geoFcodeEquivSchema);

const urlDb = 'mongodb://localhost:27017/geosm';

function initializeDb(next) {
    if (!mongoose.connection.readyState)
        mongoose.connect(urlDb);
    var db = mongoose.connection;
    autoIncrement.initialize(db);
    typeSchema.plugin(autoIncrement.plugin, 'types');
}


/* Fonction generique d'affichage d'un model */
function displayModel(model, next) {
    if (!mongoose.connection.readyState)
        mongoose.connect(urlDb);

    model.findAsync( function (err, entity) {
        if (err) return console.error(err);
        console.log(entity);
        if (next)
            next();
    });
}


  /*********************************************************************************************************/
 /******************************************* Partie TYPES ************************************************/
/*********************************************************************************************************/

function persistStaticTypes(next){
    var types = ['LAC','STREAM','COUNTRY','CITY'];
    var typeNames = ['lac','cours d\eau','pays','ville'];
    persistTypes(types,typeNames);
    persistStaticEquiv(next);
}

function persistTypes(types, typeNames, next) {
    var correspondance = {types: types, typeNames: typeNames};
    var saves = [];
    var types = correspondance.types;
    if (!types.length) {
        types = [types];
    }
    var typeNames = correspondance.typeNames;

    if (!typeNames.length) {
        typeNames = [typeNames];
    }

    for (var i = 0; i < types.length; ++i) {
        var objToPersist = {type: types[i], namefr: typeNames[i]};
        var merge = new TypeModel(objToPersist);
        if (i == types.length-1){
            TypeModel.findOneAndUpdateAsync({'type':types[i]}, objToPersist, {upsert:true}, function(err, doc){
                if (err) {console.log(err); return;} //res.send(500, { error: err });
                else {if (next) next();} //return res.send("succesfully saved");
            });
        } 
        else {
            TypeModel.findOneAndUpdateAsync({'type':types[i]}, objToPersist, {upsert:true}, function(err, doc){
                if (err) {console.log(err); return;} //res.send(500, { error: err });
                else {
                    //return res.send("succesfully saved");
                }
            });
            //saves.push(merge.saveAsync());
        }
    }
}

var config = {};
config.type = {
    LAKE: 'lac',
    STREAM: 'Cours d\'eau',
    CITY: 'Ville',
    COUNTRY: 'Pays'
};

function persistStaticEquiv(next) {
    OsmEquivModel.findOneAndUpdateAsync({'type':'river'}, {'equiv':[config.type.STREAM]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'lake'}, {'equiv':[config.type.LAKE]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'stream'}, {'equiv':[config.type.STREAM]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'canal'}, {'equiv':[config.type.STREAM]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'city'}, {'equiv':[config.type.CITY]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'suburb'}, {'equiv':[config.type.CITY]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'neighbourhood'}, {'equiv':[config.type.CITY]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}});
        //res.send(500, { error: err });//else {//return res.send("succesfully saved");}}
    OsmEquivModel.findOneAndUpdateAsync({'type':'hamlet'}, {'equiv':[config.type.CITY]}, {upsert:true}, function(err, doc){if (err) {console.log(err); return;}}); //res.send(500, { error: err });//else {//return res.send("succesfully saved");}});
    OsmEquivModel.findOneAndUpdateAsync({'type':'administrative'},{'equiv':[config.type.CITY, config.type.COUNTRY]}, {upsert:true}, function(err, doc){
        if (err) {console.log(err); return;} //res.send(500, { error: err });
        //else {next();} //return res.send("succesfully saved");
    });
    
    FclEquivModel.findOneAndUpdateAsync({'type':'A'},{'equiv':[
            config.type.CITY,
            config.type.COUNTRY
        ]}, {upsert:true}, function(err, doc){
        if (err) {console.log(err); return;} //res.send(500, { error: err });
    });
    FclEquivModel.findOneAndUpdateAsync({'type':'H'},{'equiv':[
            config.type.STREAM,
            config.type.LAKE
        ]}, {upsert:true}, function(err, doc){
        if (err) {console.log(err); return;} //res.send(500, { error: err });
    });
    FclEquivModel.findOneAndUpdateAsync({'type':'P'},{'equiv':[
            config.type.CITY,
            config.type.COUNTRY
        ]}, {upsert:true}, function(err, doc){
        if (err) {console.log(err); return;} //res.send(500, { error: err });
    });
    
    FCodeEquivModel.findOneAndUpdateAsync({'type':'STM'},{'equiv':[config.type.STREAM]}, {upsert:true}, function(err, doc){
        if (err) {console.log(err); return;} //res.send(500, { error: err });
        else {next();} //return res.send("succesfully saved");
    });
}


function displayEveryTypes(next) {
    displayModel(TypeModel, next);
}

function displayOsmEquiv(next) {
    displayModel(OsmEquivModel, next);
}

function displayFcl(next) {
    displayModel(FclEquivModel, next);
}

function displayFCode(next) {
    displayModel(FCodeEquivModel, next);
}

function getEveryTypes(){return TypeModel.find();}

function getTypeById(id){
    TypeModel.findAsync({_id : id}, (function (err, docs) {
        if (err) { throw err; }
            return docs;
        }));
}

function getTypeByName(type){
    TypeModel.findAsync({type : type}, (function (err, docs) {
            if (err) { throw err; }
                
            else {
                return docs;
            }
        }));
}

function getTypesName(){
    TypeModel.findAsync({}, 'namefr', (function (err, docs) {
        if (err) { throw err; }
        else {
            return docs;
        }
    }));
}

function removeTypeById(id, fn){
    var query =TypeModel.findByIdAndRemoveAsync(id);
    query.exec(function (err, merges) {
        if (fn)
            fn();
    });
}

/************* TESTS *************/
/* ! UN test a la fois */

module.exports = {
    initializeDb, displayEveryTypes, persistTypes, persistStaticTypes,
    /*persistType,*/  getEveryTypes, removeTypeById,
    getTypesName, getTypeById, getTypeByName,
    displayOsmEquiv, displayFcl, displayFCode
};



