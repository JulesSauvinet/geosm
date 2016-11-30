'use strict';

var app = app || {};
app.views = app.views || {};

/**
 * Vue du layout de base de l'application
 */
app.views.Base = Backbone.View.extend({

    el: $('body'),
    template: _.template($('script#tpl-base').html()),

    initialize: function() {
        this.render();
    },

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});
