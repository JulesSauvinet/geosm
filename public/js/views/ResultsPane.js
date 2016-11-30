'use strict';

var app = app || {};
app.views = app.views || {};

app.views.ResultsPaneContainer = Backbone.View.extend({

    el: '#results-pane-container',

    initialize: function () {

        this.osmResultsView = new app.views.ResultsPane({
            model: app.data,
            imageUrl: '/images/osm-logo.png',
            paneTitle: 'OpenStreetMap'
        });

        this.geonamesResultsView = new app.views.ResultsPane({
            model: app.data,
            imageUrl: '/images/geonames-logo.png',
            paneTitle: 'Geonames'
        });

        this.autoMergeResultsView = new app.views.ResultsPane({
            model: app.data,
            imageUrl: '/images/geosm.png',
            paneTitle: i18n('result_pane_merged_title')
        });

        this.listenTo(this.model, 'change:osmResults', function () {
            if (this.model.get('mode') == 'manuel') {
                this.render('osm');
            }
        });

        this.listenTo(this.model, 'change:geonamesResults', function () {
            if (this.model.get('mode') == 'manuel') {
                this.render('geonames');
            }
        });

        this.listenTo(this.model, 'change:mergeResults', function () {
            this.render();
        });

        this.listenTo(this.model, 'change:selectedEntity', function () {
            this.render();
        });

        this.listenTo(this.model, 'change:selectedEntityGeo', function () {
            this.reorder_entities();
            this.render();
        });

        this.listenTo(this.model, 'change:selectedEntityOsm', function () {
            this.reorder_entities();
            this.render();
        });

        this.listenTo(this.model, 'change:selectedEntityGeosm', function () {
            this.render();
        });
    },

    reorder_entities: function (list) {
        var geoSelected = this.model.get('selectedEntityGeo');
        var osmSelected = this.model.get('selectedEntityOsm');

        if (geoSelected && !osmSelected) {

            var sorted = this.model.get('osmResults').sort(function (a, b) {
                return geoSelected.gps_dist(a) > geoSelected.gps_dist(b);
            });

            this.model.set('osmResults', sorted);

        } else if (!geoSelected && osmSelected) {
            var sorted = this.model.get('geonamesResults').sort(function (a, b) {
                return osmSelected.gps_dist(a) > osmSelected.gps_dist(b);
            });

            this.model.set('geonamesResults', sorted);
        }
    },

    render: function (source) {

        this.$el.empty();
        var one_pane_with = 300;

        if (this.model.get('mode') == 'automatique') {
            this.$el.width(one_pane_with);
            this.$el.append(this.autoMergeResultsView.el);
            this.autoMergeResultsView.render(this.model.get('mergeResults'));
        } else {
            this.$el.width(one_pane_with * 2);
            this.geonamesResultsView.render(this.model.get('geonamesResults'));
            this.osmResultsView.render(this.model.get('osmResults'));
            this.$el.append(this.osmResultsView.el);
            this.$el.append(this.geonamesResultsView.el);
        }

        this.show();
    },

    show: function () {
        this.$el.addClass('show');
    },

    hide: function () {
        this.$el.removeClass('show');
    }
});

/**
 * Vue du panneau latéral contenant les résultats de recherche
 */
app.views.ResultsPane = Backbone.View.extend({

    tagName: 'div',
    className: 'results-pane',
    template: _.template($('script#tpl-results-pane').html()),
    events: {},

    initialize: function (options) {
        this.options = options;
    },

    render: function (entities) {

        // Sauvegarde le scroll actuel
        var scrollTop = this.$el.find('.content').scrollTop();

        var results_count = _.size(entities);

        this.$el.html(this.template({
            results_count: results_count,
            imageUrl: this.options.imageUrl,
            title: this.options.paneTitle
        }));

        var $content = this.$el.find('.content');
        var selectedElement = null;


        // Si des résultats sont trouvés
        if (results_count) {

            // Affiche les résultats
            for (var i in entities) {
                var entry = new ResultEntry({model: entities[i]});
                $content.append(entry.$el);

                if (entry.$el.hasClass('matched')
                    || entry.$el.hasClass('selected')) {
                    selectedElement = entry.$el;

                    var posY = entry.$el.position().top;

                    if (posY < 0 || posY > $content.height()) {
                        scrollTop = posY;
                    }
                }
            }
        }

        // Restore le scroll
        $content.scrollTop(scrollTop);
    }
});

/**
 * Vue d'un résultat dans la panneau des résultats
 */
var ResultEntry = Backbone.View.extend({

    tagName: 'li',
    className: 'result-entry',
    template: _.template($('script#tpl-result-entry').html()),
    events: {
        'click': 'onEntrySelected'
    },

    initialize: function () {
        this.render();
    },

    render: function () {
        this.$el.html(this.template({
            entity: this.model.toJSON()
        }));

        if (this.model.attributes.source == 'osm') {
            this.$el.addClass('osm');
        }
        if (this.model.attributes.source == 'geonames') {
            this.$el.addClass('geonames');
        }
        if (this.model.attributes.source == 'geosm') {
            this.$el.addClass('geosm');
        }

        if (this.model == app.data.get('selectedEntityOsm')) {
            $('.osm').removeClass('selected');
            this.$el.addClass('selected');
        }

        if (this.model == app.data.get('selectedEntityGeo')) {
            $('.geonames').removeClass('selected');
            this.$el.addClass('selected');
        }

        if (this.model == app.data.get('selectedEntityGeosm')) {
            $('.geosm').removeClass('selected');
            this.$el.addClass('selected');
        }


        if (this.model == app.data.get('matchedEntity') && app.data.get('selectedEntity')) {

            $('.result-entry').removeClass('matched');
            this.$el.addClass('matched');

            var osm_data;
            var geonames_data;

            app.data.get('matchedEntity').attributes.source == 'osm' ? osm_data = app.data.get('matchedEntity').attributes.raw : geonames_data = app.data.get('matchedEntity').attributes.raw;
            app.data.get('selectedEntity').attributes.source == 'geonames' ? geonames_data = app.data.get('selectedEntity').attributes.raw : osm_data = app.data.get('selectedEntity').attributes.raw;
        }
    },

    onEntrySelected: function () {

        console.log(this.model.get('raw'));

        app.data.set('matchedEntity', null);
        app.data.set('selectedEntity', null);

        var selectedEntity = null;
        var matchEntity = null;

        //desélection
        if (app.data.get('selectedEntityGeo') == this.model) {
            app.data.set({selectedEntityGeo: null});
            selectedEntity = app.data.get('selectedEntityOsm');
        } else if (app.data.get('selectedEntityOsm') == this.model) {
            app.data.set({selectedEntityOsm: null});
            selectedEntity = app.data.get('selectedEntityGeo');
        } else if (app.data.get('selectedEntityGeosm') == this.model) {
            app.data.set('selectedEntityGeosm', null);
        }
        //sélection
        else {

            switch (this.model.attributes.source) {
                case 'osm':
                    app.data.set('selectedEntityOsm', this.model);
                    break;

                case 'geonames':
                    app.data.set('selectedEntityGeo', this.model);
                    break;

                case 'geosm':
                    app.data.set('selectedEntityGeosm', this.model);
                    break;
            }

            selectedEntity = this.model;
        }

        if(selectedEntity
            && (!app.data.get('selectedEntityGeo')
                || !app.data.get('selectedEntityOsm'))
            && selectedEntity.get('source') != 'geosm') {
            matchEntity = selectedEntity.searchMatchEntity();
        }

        app.data.set({
            selectedEntity: selectedEntity,
            matchedEntity: matchEntity
        });
    }
});