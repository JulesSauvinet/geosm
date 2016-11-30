'use strict';

var app = app || {};
app.views = app.views || {};

/**
 * Vue de la zone de recherche
 */
app.views.EntityInfo = Backbone.View.extend({

    el: '#entity-info-container',
    template: _.template($('script#tpl-entity-info').html()),
    events: {
        'click .rollback-btn': 'rollback_merge'
    },

    initialize: function () {
        // Lorsqu'un résultat est sélectionné
        this.listenTo(this.model, 'change:selectedEntityGeo', this.render);
        this.listenTo(this.model, 'change:selectedEntityOsm', this.render);
        this.listenTo(this.model, 'change:selectedEntityGeosm', this.render);
    },

    render: function () {

        var entityGeo = this.model.get('selectedEntityGeo');
        var entityOsm = this.model.get('selectedEntityOsm');
        var entityGeosm = this.model.get('selectedEntityGeosm');

        if (!entityGeo && !entityOsm && !entityGeosm) {
            this.hide();
            return;
        }

        if (entityGeosm) {
            this.$el.html(this.template({entityGeosm: entityGeosm.forView(), entityGeo: null, entityOsm: null}));
            
        }
        else {
            this.$el.html(this.template({
                entityGeosm: entityGeosm ? entityGeosm.forView() : null,
                entityGeo: entityGeo ? entityGeo.forView() : null,
                entityOsm: entityOsm ? entityOsm.forView() : null
            }));
        }

        this.show();
    },

    rollback_merge: function(){
        console.log('rollback');
        app.data.rollbackMerge(app.data.get('selectedEntityGeosm'));
        app.data.set('selectedEntityGeosm', null);
    },

    show: function () {
        if (this.model.get('selectedEntityGeo')
            || this.model.get('selectedEntityOsm')
            || this.model.get('selectedEntityGeosm')) {
            this.$el.addClass('show');
        }
    },

    hide: function () {
        this.$el.removeClass('show');
    }
});