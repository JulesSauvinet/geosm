'use strict';

var app = app || {};
app.views = app.views || {};

/**
 * Vue la carte Google Map
 */
app.views.Map = Backbone.View.extend({

    el: '#map-container',
    template: _.template($('script#tpl-map').html()),
    events: {
    },

    initialize: function () {
        this.render();
        this.map = null;
        this.markers = [];
        this.features = [];

        this.listenTo(this.model, 'change:osmResults', this.show);
        this.listenTo(this.model, 'change:geonamesResults', this.show);

        this.listenTo(this.model, 'change:selectedEntity', this.highlightEntity);
    },

    render: function () {
        this.$el.html(this.template({map: this.model}));
    },

    /**
     * Initialise la Google Map
     */
    initMap: function () {
        this.map = new google.maps.Map(document.getElementById('map'), {
            // Centré initilalement sur le nautibus
            center: {lat:  45.7822105, lng: 4.8656278},
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: true
        });
    },

    highlightEntity: function (entity) {

        var entity = this.model.get('selectedEntity');

        if (entity != null){
            var entityAttr = entity.toJSON();
            this.clearAllMarkers();

            if(entityAttr.geojson) {
                this.highlightFeature(entityAttr);
            } else {
                // Place juste un point sur la carte
                this.map.setZoom(15);
                this.map.panTo(entityAttr.coordinates);
                this.placeMarker(entityAttr);
            }
        }

    },

    placeMarker: function(location) {
        var urlIcon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';

        var marker = new google.maps.Marker({
            position: location.coordinates,
            map: this.map,
            icon: urlIcon,
            draggable: false,
            animation: google.maps.Animation.DROP
        });

        this.markers.push(marker);
    },

    /**
     * Affiche une entité OSM (point ou zone)
     *
     * @param location
     */
    highlightFeature: function(location){

        var feature = this.map.data.addGeoJson({
            type: 'Feature',
            geometry: location.geojson,
            id: 1
        });

        // Si la feature n'a pas été ajouté
        if(!feature[0]) {
            return;
        }

        var feature = feature[0];
        this.features.push(feature);

        /**
         * Permet de calculer la position + le zoom de la carte
         * adapté à l'entité
         *
         * @param geometry
         * @param callback
         * @param thisArg
         */
        var processPoints = function(geometry, callback, thisArg) {
            if (geometry instanceof google.maps.LatLng) {
                callback.call(thisArg, geometry);
            } else if (geometry instanceof google.maps.Data.Point) {
                callback.call(thisArg, geometry.get());
            } else {
                geometry.getArray().forEach(function(g) {
                    processPoints(g, callback, thisArg);
                });
            }
        };

        var bounds = new google.maps.LatLngBounds();
        processPoints(feature.getGeometry(), bounds.extend, bounds);
        this.map.fitBounds(bounds);


        // Si le zoom est trop important
        if(this.map.getZoom() > app.config.map.max_zoom) {
            this.map.setZoom(app.config.map.max_zoom);
        }
    },

    /**
     * Supprime toutes les zones et marqueurs de la carte
     */
    clearAllMarkers: function(){
        for(var i in this.markers) {
            this.markers[i].setMap(null);
        }
        this.markers = [];

        for(var i in this.features) {
            this.map.data.remove(this.features[i]);
        }
        this.features = [];

    },

    show: function(){
        this.$el.addClass('show');
    },

    hide: function(){
        this.$el.removeClass('show');
    }
});
