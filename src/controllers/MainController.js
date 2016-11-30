'use strict';

const express = require('express'),
    router = express.Router(),
    maindb = require('../database/MainHandler'),
    mergedb = require('../database/MergeHandler'),
    typedb = require('../database/TypeHandler');


router.get('/stats-merges', (req, res) => {

    mergedb.getEveryStats(function(docs,err){
        if (err)
            console.log(err);
        else {
            res.json(docs);
        }
    });
});


router.post('/auto-persist-merges/:query', (req, res) => {
    let merges = req.body;

    mergedb.persistMerges(merges, function(err,entityNotMerged){
        if (err)
            console.log(err);
        else {
            res.json(entityNotMerged);
        }
    });
});

router.post('/persist-merge', (req, res) => {
    let mergeAndStat = req.body.attr;
    let mergeExtra = req.body.extra_attrs;
    
    var cb = function(err,entityNotMerged){
        if (entityNotMerged){
            console.log('Entite non persiste car presente en base : ' + entityNotMerged); //TODO ENVOYE UN OBJET AU CLIENT
        }
        if (err)
            console.log(err);
        else {
            res.status(200).end();
        }
    };
    
    if (mergeExtra){
        mergedb.persistMergeAndUpdateStat(mergeAndStat, mergeExtra, cb);
    }
    else{
        mergedb.persistMergeAndUpdateStat(mergeAndStat, cb);
    }
});

router.get('/merges-list', (req, res) => {

    mergedb.getEveryMerges(function(err,docs){
        if (err)
            console.log(err);
        else {
            res.json(docs);
        }
    });
});
router.get('/remove-merge', (req, res) => {
    var entityToRemove = JSON.parse(req.query.data);

    //console.log('REMOVING MERGE!');
    //console.log(entityToRemove);
    mergedb.removeMerge(entityToRemove, function(err,docs){
        if (err)
            console.log(err);
        else {
            res.status(200).end();
        }
    });
});


module.exports = router;
