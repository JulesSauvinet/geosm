'use strict';

var app = app || {};
app.models = app.models || {};

/**
 * Modèle des données de l'application
 */
app.models.Data = Backbone.Model.extend({

        initialize: function () {
            this.listenTo(this, 'change:query', this.doQuery);
        },

        defaults: {
            osmResults: [],
            geonamesResults: [],
            mergeResults: [],
            selectedEntity: null,
            query: null,
            selectedEntityGeo: null,
            selectedEntityOsm: null,
            mode: 'manuel'
        },

        /**
         * Lance une nouvelle recherche
         */
        doQuery: function () {

            this.set({
                selectedEntityGeo: null,
                selectedEntityOsm: null,
                selectedEntityGeosm: null,
                loading: true
            });

            var query = this.get('query');

            if (query === null) {
                this.loadMergedEntites(function () {
                    this.set('loading', false);
                }.bind(this));
            } else {
                // Change l'url
                app.router.navigate('map/' + query, true);
                this.queryGeocode(function () {
                    if(this.get('mode') == 'automatique') {
                        this.mergeAuto(function(){
                            this.set('loading', false);
                        }.bind(this));
                    } else {
                        this.set('loading', false);
                    }
                }.bind(this));
            }
        },

        /**
         * Requête vers OSM et Geonames
         *
         * @param cb
         */
        queryGeocode: function (cb) {

            var query = this.get('query');
            var self = this;
            var osm_ok = false;
            var geonames_ok = false;

            if (!query) {
                cb();
                return;
            }

            //
            // Requête les API
            //
            var maxRows = 10;
            //TODO FAIRE VARIER LE NOMBRE DE RESULTATS A REQUETER
            if (this.get('mode') == 'automatique') {
                maxRows = 100; //REQUEST ENTITY TOO LARGE A GERER
            }

            var osm_request = $.get(app.config.api.osm.url, {
                q: query,
                format: 'json',
                // Pour avoir les frontières d'une entité
                polygon_geojson: true,
                limit: maxRows
            });

            var geonames_request = $.get(app.config.api.geonames.url, {
                name: query,
                username: app.config.api.geonames.user,
                maxRows: maxRows
                //style: 'FULL'
            });

            //
            // Lorsque les requêtes seront terminées
            //

            self.set('geonamesResults', []);
            geonames_request.then(function (data) {
                var entities = [];
                _.each(data.geonames, function (el) {
                    entities.push(new app.models.Entity(el));
                });
                self.set('geonamesResults', entities);
                geonames_ok = true;
                osm_ok && cb();
            }, function (err) {
                ohSnap('Impossible de récupérer les informations depuis les serveurs de Geonames.', {color: 'red'});
            });

            self.set('osmResults', []);
            osm_request.then(function (data) {
                var entities = [];
                _.each(data, function (el) {
                    entities.push(new app.models.Entity(el));
                });
                self.set('osmResults', entities);
                osm_ok = true;
                geonames_ok && cb();
            }, function (err) {
                ohSnap('Impossible de récupérer les informations depuis les serveurs d\'OpenStreetMap.', {color: 'red'});
            });
        },

        /**
         * Recupère les stats
         *
         * @param cb
         */
        getStats: function () {
            return $.ajax({
                url: '/stats-merges',
                type: 'GET'
            });
        },

        /**
         * Récupère les fusions enregistrées
         */
        loadMergedEntites: function (cb) {

            var results = [];

            $.get('/merges-list')
                .done(function (datas) {
                    datas.forEach(function(data){
                        console.log(data);
                        for (var k in data) {
                            if (k === '__v') delete data[k];
                            if (k === '_id') delete data[k];
                            
                            if (data[k] === null) delete data[k];

                            if (typeof data['extra_attrs'] === "string"){
                                data['extra_attrs'] = JSON.parse(data['extra_attrs']);
                            }
                        }

                        data.source = 'geosm';
                        //console.log(data);
                        if (data.extra_attrs){
                            console.log('data.extra_attrs');
                            console.log(data.extra_attrs);
                        }

                        if (data.osm_id && data.geonames_id && data.name && data.coordinates && data.type)
                            results.push(new app.models.Entity(data));
                    });
                }.bind(this))

                .fail(function () {
                    ohSnap('Echec lors de la récupération des entités', {color: 'red'})
                }.bind(this))

                .always(function () {
                    this.set('mergeResults', results, {silent: true});
                    this.trigger('change:mergeResults');
                    cb();
                }.bind(this));
        },


        /**
         * Fais les merges auto pour les stats
         *
         * @param cb
         */
        handleStatsForMergeAuto : function(cb){

            var stats = this.get('stats');
            //trier le tableau cote serveur - en attendant :
            var statsFormated = {};
            var defaultStat = {};
            var statType;
            stats.forEach(function(x){
                var sourcetmp;
                if (x.stat.osm >= x.stat.geonames) {
                    sourcetmp = 'osm';
                }
                else{
                    sourcetmp = 'geonames';
                }

                if (x.attribute === 'type'){
                    statType = sourcetmp;
                }
                else {
                    if (statsFormated[x.type]){
                        statsFormated[x.type][x.attribute] = sourcetmp;
                    }
                    else{
                        statsFormated[x.type] = {};
                        statsFormated[x.type][x.attribute] = sourcetmp;
                    }

                    defaultStat[x.attribute] = sourcetmp;
                }
            });

            var geonamesResults = this.get('geonamesResults');
            var osmResults = this.get('osmResults');

            var arrayToMerge = geonamesResults;
            var arrayMerger  = osmResults;
            if (geonamesResults.length>osmResults.length){
                arrayToMerge = osmResults;
                arrayMerger = geonamesResults;
            }

            var entities = [];
            //A envoyer a la BDD
            var entitiesToMerge = [];

            var self = this;
            arrayToMerge.forEach(function(entityToMatch){
                if (arrayMerger.length > 0){
                    var entityMatched = entityToMatch.searchMatchEntity(arrayMerger);

                    if (entityMatched != null){
                        var entityOsm;
                        var entityGeo;

                        var entityModel = {};

                        if (entityMatched.attributes.source == 'geonames'){
                            entityGeo = entityMatched;
                            entityOsm = entityToMatch;
                        }
                        else {
                            entityGeo = entityToMatch;
                            entityOsm = entityMatched;
                        }
                        //ATTRIBUTS SANS STATS
                        entityModel.raw = {geonames : entityGeo, osm : entityOsm};
                        entityModel.geonames_id = entityGeo.attributes.raw.geonameId;
                        entityModel.osm_id = parseInt(entityOsm.attributes.raw.osm_id);

                        entityModel.geojson = entityOsm.attributes.geojson || null;

                        //ATTRIBUTS CHOISIS AVEC LES STATS
                        if (statType){
                            var type = statType === 'osm' ? entityOsm.attributes.type : entityGeo.attributes.type;
                            entityModel.type = type;
                        }
                        else{
                            entityModel.type = entityOsm.attributes.type || entityGeo.attributes.type || null;
                        }

                        if (statsFormated[entityModel.type]){
                            var specificStats =  statsFormated[entityModel.type];
                            if (specificStats.coordinates){
                                var coordinates = specificStats.coordinates === 'osm' ? (entityOsm.attributes.coordinates.lat + ' - ' + entityOsm.attributes.coordinates.lng)
                                    : (entityGeo.attributes.coordinates.lat + ' - ' + entityGeo.attributes.coordinates.lng);
                                entityModel.coordinates = coordinates;
                            }
                            else if (defaultStat.coordinates){
                                var coordinates = defaultStat.coordinates === 'osm' ? (entityOsm.attributes.coordinates.lat + ' - ' + entityOsm.attributes.coordinates.lng)
                                    : (entityGeo.attributes.coordinates.lat + ' - ' + entityGeo.attributes.coordinates.lng);
                                entityModel.coordinates = coordinates;
                            }
                            else{
                                entityModel.coordinates = (entityGeo.attributes.coordinates.lat + ' - ' + entityGeo.attributes.coordinates.lng)
                                    || (entityOsm.attributes.coordinates.lat + ' - ' + entityOsm.attributes.coordinates.lng) || null;
                            }

                            if (specificStats.population){
                                var population = specificStats.population === 'osm' ? entityOsm.attributes.population : entityGeo.attributes.population;
                                entityModel.population= population;
                            }
                            else if (defaultStat.population){
                                var population = defaultStat.population === 'osm' ? entityOsm.attributes.population : entityGeo.attributes.population;
                                entityModel.population= population;
                            }
                            else{
                                entityModel.population= entityGeo.attributes.population || entityOsm.attributes.population || null;
                            }

                            if (specificStats.name){
                                var name = specificStats.name === 'osm' ? entityOsm.attributes.name : entityGeo.attributes.name;
                                entityModel.name = name;
                            }
                            else if (defaultStat.name){
                                var name = defaultStat.name === 'osm' ? entityOsm.attributes.name : entityGeo.attributes.name;
                                entityModel.name = name;
                            }
                            else{
                                entityModel.name = entityOsm.attributes.name || entityGeo.attributes.name || null;
                            }
                        }
                        else {
                            if (defaultStat.coordinates){
                                var coordinates = defaultStat.coordinates === 'osm' ? (entityOsm.attributes.coordinates.lat + ' - ' + entityOsm.attributes.coordinates.lng)
                                    : (entityGeo.attributes.coordinates.lat + ' - ' + entityGeo.attributes.coordinates.lng);
                                entityModel.coordinates = coordinates;
                            }
                            else{
                                entityModel.coordinates = (entityGeo.attributes.coordinates.lat + ' - ' + entityGeo.attributes.coordinates.lng)
                                    || (entityOsm.attributes.coordinates.lat + ' - ' + entityOsm.attributes.coordinates.lng) || null;
                            }

                            if (defaultStat.population){
                                var population = defaultStat.population === 'osm' ? entityOsm.attributes.population : entityGeo.attributes.population;
                                entityModel.population= population;
                            }
                            else{
                                entityModel.population= entityGeo.attributes.population || entityOsm.attributes.population || null;
                            }

                            if (defaultStat.name){
                                var name = defaultStat.name === 'osm' ? entityOsm.attributes.name : entityGeo.attributes.name;
                                entityModel.name = name;
                            }
                            else{
                                entityModel.name = entityOsm.attributes.name || entityGeo.attributes.name || null;
                            }
                        }


                        //EQUIV DANS APP.CONFIG TODO BETTER
                        //entityModel.type = entityGeo.getTypes()[0] || entityOsm.getTypes()[0] || null;

                        //NOUVEAUX ATTRIBUTS
                        entityModel.source = 'geosm';
                        entityModel.uid = _.uniqueId('entity_');

                        if (entityOsm.attributes.raw.osm_type)
                            entityModel.osm_type = entityOsm.attributes.raw.osm_type;

                        console.log('entityModel');
                        console.log(entityModel);
                        var mergeEntity = new app.models.Entity(entityModel);

                        //A NUL POUR L'OBJET ENVOYE A LA BDD CAR TROP COUTEUX -> REQUEST ENTIY TOO LARGE SINON CHUNKER
                        entityModel.geojson = null;
                        entityModel.raw = null;
                        entitiesToMerge.push(entityModel);
                        entities.push(mergeEntity);

                        var index = arrayMerger.indexOf(entityMatched);
                        if (index > -1) {
                            arrayMerger.splice(index, 1);
                        }

                    }
                }

            });

            //ON MERGE QUE LES 30 PREMIERS MATCHS
            if (entitiesToMerge.length > 30){
                entitiesToMerge = entitiesToMerge.slice(0,31);
            }

            var query = this.get('query');
            if (entitiesToMerge.length>0){
                $.ajax({
                    url: '/auto-persist-merges/' + query,
                    type: 'POST',
                    data: JSON.stringify(entitiesToMerge),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                }).done(function(data){
                    /*console.log('enitynotmergedreceived :');
                     console.log(data);*/
/*                    var entitiesToRemove = [];
                    data.forEach(function(d){
                        entities.forEach(function(entity){
                            if (d.uid == entity.uid){
                                entitiesToRemove.push(entity);
                            }
                        });
                    });
                    // Find and remove item from an array
                    entitiesToRemove.forEach(function(e){
                        var i = entities.indexOf(e);
                        if(i != -1) {
                            entities.splice(i, 1);
                        }
                    });*/

                    self.set('mergeResults', entities, {silent: true});
                    self.trigger('change:mergeResults');
                    if (cb){
                        cb();
                    }
                });
            }


        },

        /**
         * Fais des merges automatiques en fonctions des results d'osm et geonames
         *
         * @param cb
         */
        //TODO class et type OSM
        mergeAuto: function (cb) {

            this.set('mergeResults', []);

            var self = this;

            //var timer = $.Deferred();
            //setTimeout(timer.resolve, 500);

            var ajax = this.getStats().done(function(data){
                self.set('stats', data);
            }).fail(function (err){
                console.log('erreur lors du recupérage des stats');
                console.log(err);
            });

            /*            $.when(timer, ajax).done(function() {

             });*/

            ajax.done(function(data) {
                self.handleStatsForMergeAuto(cb);
            });
        },
    
        /**
         * Rollback un merge
         *
         * @param cb
         */
        rollbackMerge : function (entityToRemove) {
            console.log('rollaback merge');
            var entities = this.get('mergeResults');
            
            var index = entities.indexOf(entityToRemove);
            if (index > -1) {
                entities.splice(index, 1);
            }
            this.set('mergeResults', entities);
            app.data.set('selectedEntityGeosm', null);

            console.log('entityToRemove');
            console.log(entityToRemove);
            var serializeEntity = entityToRemove.attributes;
            if (serializeEntity['raw'])
                delete serializeEntity.raw;
            if (serializeEntity['geojson'])
                delete serializeEntity.geojson;
            if (serializeEntity['uid'])
                delete serializeEntity.uid;

            serializeEntity.coordinates = (serializeEntity.coordinates.lat + ' - ' + serializeEntity.coordinates.lng)
            serializeEntity = JSON.stringify(serializeEntity);

            $.get('remove-merge', {data : serializeEntity})
                .done(function () {
                    console.log('ok');
                    ohSnap("Suppresion de la fusion réussite.", {color: 'green'});
                })
                .fail(function () {
                    console.log('pas ok');
                    ohSnap("Echec lors de la suppression de cette fusion", {color: 'red'});
                });

        }
    }
);