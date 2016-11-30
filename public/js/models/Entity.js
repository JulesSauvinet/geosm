'use strict';

var app = app || {};
app.models = app.models || {};

/**
 * Modèle d'une entité (geonames ou osm)
 */
app.models.Entity = Backbone.Model.extend({

    initialize: function () {
        this.normalize();
    },

    /**
     * Format l'entité pour manipuler dans la vue
     *
     * @param index L'index de l'entité dans results
     * @param match_data S'il faut rechercher une correspondance
     * dans les autres sources de données. Defaut = true
     */
    forView: function () {
        
        var mergedEntity = this.attributes;

        var population = null;
        if (mergedEntity.population)
            population = mergedEntity.population;

        var source;
        if (mergedEntity.source == 'geosm'){
            source = 'Geosm';
        }
        else if (mergedEntity.osm_id){
            source = 'Open Street Map';
        }
        else {
            source = 'Géonames';
        }

        if (!mergedEntity.coordinates.lat){
            mergedEntity.coordinates = {
                lat: +mergedEntity.coordinates.split(' - ')[0],
                lng: +mergedEntity.coordinates.split(' - ')[1]
            }
        }

        var obj = {
            source: source,
            name: mergedEntity.name || null,
            coordinates: (mergedEntity.coordinates.lat + ' - ' + mergedEntity.coordinates.lng) || null,
            type: mergedEntity.type || mergedEntity.fclName || null,
            subtype: mergedEntity.fcodeName || null,
            country: mergedEntity.countryName || null,
            population: population
        };

        // Ajoute les éventuelles champs utilisateurs
        if(mergedEntity.extra_attrs) {
            for(var i = 0; i < mergedEntity.extra_attrs.length; ++i) {
                var attr = mergedEntity.extra_attrs[i];
                obj[attr.name] = attr.value;
            }
        }

        // Supprime toutes les propriétés null
        for (var k in obj) {
            if (obj[k] === null) delete obj[k];
        }

        return obj;
    },



    /**
     * Permet d'homogénéiser les champs d'une entité
     */
    normalize: function () {
        
        var model = this.attributes;
        /*
        console.log('model');
        console.log(model);*/
        
        var source;
        if (model.source == 'geosm'){
            source = 'geosm';
        }
        else if (model.osm_id){
            source = 'osm';
        }
        else {
            source = 'geonames';
        }

        var population = null;
        var coordinates = null;
        if (model.population)
            population = model.population;

        if (model.coordinates){
            coordinates = {
                lat: +model.coordinates.split(' - ')[0],
                lng: +model.coordinates.split(' - ')[1]
            }
        }
        else{
            coordinates = {
                lat: +model.lat || null,
                lng: +model.lng || +model.lon || null
            }
        }

        var normalized = {
            raw: model.raw || model,
            // Id valable uniquement pour une requête utilisateur
            // => ne doit pas être persisté
            uid:  model.uid || _.uniqueId('entity_'),
            geojson: model.geojson || null,
            coordinates: coordinates,
            population: population,
            name: model.display_name || model.name || null,
            type: model.type || model.fcodeName || null,
            source: source,
            extra_attrs: model.extra_attrs || []
        };

        var self = this;
        var osm_type;
        if (model.raw)
            osm_type = model.osm_type || model.raw.osm.osm_type;
        else
            osm_type = model.osm_type || null;

        if (source == 'geosm'){
            normalized.geonames_id = model.geonames_id || model.raw.geonames.geonameId;
            normalized.osm_id =  model.osm_id || model.raw.osm.osm_id;
            normalized.osm_type = osm_type;

            var type;
            if(normalized.osm_type == 'relation') {
                type = 'R';
            } else if(normalized.osm_type == 'way') {
                type = 'W';
            }

            //console.log(normalized.raw);

            $.get(app.config.api.osm.url_reverse, {
                format: 'json',
                osm_id : normalized.osm_id,
                osm_type: type,
                // Pour avoir les frontières d'une entité
                polygon_geojson: true
            }).then(function (data) {
                normalized.geojson = data.geojson;
                //console.log(data);
                self.attributes = normalized;
            });
        }
        else {
            this.attributes = normalized;
        }

    },

    /**
     * Cherche une correspondance osm/geonames
     */
    searchMatchEntity: function (array) {

        var entity = this.attributes;
        var searchArray;

        if (array != null){
            searchArray = array;
        }
        else if (entity.source == 'osm') {
            searchArray = app.data.get('geonamesResults');
        } else {
            searchArray = app.data.get('osmResults');
        }

        var match = null;

        // -------------------------------------------------
        // On créer différents tableau trié en fonction
        // d'un critère. A partir de ces différents tableau
        // on pourra déterminé le match le plus pertinent.
        // -------------------------------------------------

        //
        // Seulement les entités de type équivalent
        //
        var with_same_type = searchArray.filter(function (e) {
            return this.isTypeEquivalent(e);
        }.bind(this));

        //
        // Trie par distances coissante des entités
        //
        var sorted_by_dist = with_same_type.slice();
        sorted_by_dist.sort(function (a, b) {
            return this.gps_dist(a) > this.gps_dist(b);
        }.bind(this));

        //
        // Trie par ressemblance du nom
        //
        var sorted_by_name_relevance = with_same_type.slice();
        sorted_by_name_relevance.sort(function (a, b) {
            return this.nameEquivalentIndice(a) > this.nameEquivalentIndice(b);
        }.bind(this));

        var best_by_dist = sorted_by_dist[0];
        var best_by_name = sorted_by_name_relevance[0];

        if(!best_by_dist) {
            return best_by_name;
        } else if(!best_by_name) {
            return best_by_dist;
        } else {

            var threshold_dist = 50000;
            var threshold_levenshtein = 0.8;

            var best_dist = this.gps_dist(best_by_dist);
            var best_levenshtein = this.nameEquivalentIndice(best_by_name);

            if(best_dist > threshold_dist && threshold_levenshtein < best_levenshtein) {
                return best_by_name;
            } else {
                return best_by_dist;
            }
        }
    },

    /**
     * Calcul la distance entre deux entités
     *
     * @param otherEntity L'autre entité
     * @returns Distance en mètres
     */
    gps_dist: function (otherEntity) {

        var entity = this.attributes;
        otherEntity = otherEntity.attributes;


        var a = Math.PI / 180;

        //TODO A REVOIR LE PARSE DES STRING
        var lat1 = +entity.coordinates.lat * a;
        var lon1 = +entity.coordinates.lng * a;
        var lat2 = +otherEntity.coordinates.lat * a;
        var lon2 = +otherEntity.coordinates.lng * a;

        var t1 = Math.sin(lat1) * Math.sin(lat2);
        var t2 = Math.cos(lat1) * Math.cos(lat2);
        var t3 = Math.cos(lon1 - lon2);
        var t4 = t2 * t3;
        var t5 = t1 + t4;
        var rad_dist = Math.atan(-t5 / Math.sqrt(-t5 * t5 + 1)) + 2 * Math.atan(1);

        return (rad_dist * 3437.74677 * 1.1508) * 1.6093470878864446 * 1000;
    },

    /**
     * Détermine si deux entité sont de type équivalent
     * @param otherEntity
     */
    isTypeEquivalent: function (otherEntity) {

        var typesA = this.getTypes();
        var typesB = otherEntity.getTypes();

        return _.intersection(typesA, typesB).length > 0;
    },

    /**
     * Retourne les types connus de l'entités
     */
    getTypes: function () {
        var attr = this.attributes.raw;

        if (this.attributes.source == 'osm') {
            return app.config.equiv.osm_type[attr.type] || [];
        } else {
            var a = app.config.equiv.geonames_fcl[attr.fcl] || [];
            var b = app.config.equiv.geonames_fcode[attr.fcode] || [];

            // En premier b car plus précis
            return _.union(b, a);
        }
    },

    /**
     * Dtermine le taux de correspondance des nom de
     * deux entités
     *
     * @param otherEntity
     * @return Un indice entre 0 et 1
     */
    nameEquivalentIndice: function (otherEntity) {

        var nameA = _.clean(this.attributes.name);
        var nameB = _.clean(otherEntity.attributes.name);

        //
        // Pour OSM on ne garde que ce qu'il y a avant la première virgule
        //

        if (this.attributes.source == 'osm') {
            nameA = nameA.substr(0, nameA.indexOf(','));
        }
        if (otherEntity.attributes.source == 'osm') {
            nameB = nameB.substr(0, nameA.indexOf(','));
        }

        // Si les chaines sont égales
        if (nameA == nameB) return 1;

        // Si elles sont égales sans les accents
        if (_.cleanDiacritics(nameA) == _.cleanDiacritics(nameB)) return 0.9;

        var levenshteinDist = _.levenshtein(nameA, nameB);

        // Si l'une est inclus dans l'autre
        if (nameB.length > nameA.length
            && _.include(nameA, nameB) || _.include(nameB, nameA)) return 0.7;

        // Sinon retourne la distance de levenshtein
        return 1 - (levenshteinDist / nameA.length);
    }
});