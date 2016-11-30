var app = app || {};


(function () { // Cloisone la portée des variables

    app.config = {};

    /*******************************
     * I18N
     *******************************/
    app.config.lang = 'fr';


    /*******************************
     * Configuration des API
     *******************************/
    app.config.api = {
        /**
         * OpenStreetMap
         */
        osm: {
            url: 'http://nominatim.openstreetmap.org/search',
            url_reverse : 'http://nominatim.openstreetmap.org/reverse'
        },

        /**
         * Geonames
         */
        geonames: {
            url: 'http://api.geonames.org/searchJSON',
            user: 'julse'
        }
    };


    /*******************************
     * Configuration de la carte
     *******************************/
    app.config.map = {
        max_zoom: 15
    };

    /*******************************
     * Equivalence des types
     *******************************/
    app.config.equiv = {};

    app.config.type = {
        LAKE: 'lac',
        STREAM: 'Cours d\'eau',
        CITY: 'Ville',
        COUNTRY: 'Pays',
        BUILDING: 'Batiment'
    };

    app.config.equiv.geonames_fcode = {
        STM: [
            app.config.type.STREAM
        ],
        MNMT: [
            app.config.type.BUILDING
        ]

    };

    app.config.equiv.geonames_fcl = {
        A: [
            app.config.type.CITY,
            app.config.type.COUNTRY
        ],
        H: [
            app.config.type.STREAM,
            app.config.type.LAKE
        ],
        P: [
            app.config.type.CITY,
            app.config.type.COUNTRY
        ],
        S: [
            app.config.type.BUILDING
        ]
    };

    app.config.equiv.osm_type = {
        river: [
            app.config.type.STREAM
        ],
        lake: [
            app.config.type.LAKE
        ],
        stream: [
            app.config.type.STREAM
        ],
        canal: [
            app.config.type.STREAM
        ],
        city: [
            app.config.type.CITY
        ],
        suburb: [
            app.config.type.CITY
        ],
        neighbourhood: [
            app.config.type.CITY
        ],
        hamlet: [
            app.config.type.CITY
        ],
        administrative: [
            app.config.type.CITY,
            app.config.type.COUNTRY
        ],
        attraction: [
            app.config.type.BUILDING
        ]
    };

    /*******************************
     * UnderscoreJS
     *******************************/
    _.templateSettings = {
        interpolate: /\{\{([\s\S]+?)\}\}/g,
        escape: /\{\{\-([\s\S]+?)\}\}/g,
        evaluate: /<%([\s\S]+?)%>/g
    };
})();