'use strict';

var app = app || {};
app.views = app.views || {};

/**
 * Vue de la zone de recherche
 */
app.views.Search = Backbone.View.extend({

    el: '#search-container',
    template: _.template($('script#tpl-search').html()),
    events: {
        'keyup #search-input': 'doSearch'
    },

    initialize: function () {
        this.render();
    },

    render: function () {
        this.$el.html(this.template());
    },

    show: function () {
        this.$el.addClass('show');

        // Focus sur le champ + sélectionne le texte existant
        this.$el.find('#search-input').focus().select();

        $('.float-search-btn').hide();
    },

    hide: function () {
        this.$el.find('#search-input').blur();
        this.$el.removeClass('show');
        $('.float-search-btn').show();
    },

    /**
     * L'utilisateur appuye sur une touche
     * @param ev
     */
    doSearch: function (ev) {

        // Si c'est la touche echappe
        if (ev.keyCode == 27) {
            this.cancelSearch();
            return;
        }

        // Si ce n'est pas la touche entrée
        if (ev.keyCode != 13) {
            return;
        }

        var query = $(ev.target).val();
        var mode = $('input[name=radio-merge]:checked').val();

        // Si la requête n'a pas changé
        if (this.model.get('query') == query
            && this.model.get('mode') == mode) {

            this.cancelSearch();
            return;
        }

        // Met à jours la query dans le modèle
        this.model.set({
            query: query,
            mode: mode
        }, {silent: true});

        // Force la généréation de l'event change sur la query
        this.model.trigger('change:query', this.model);
        this.model.trigger('change:mode', this.model);
    },

    /**
     * Annule la recherche et affiche la carte
     */
    cancelSearch: function () {
        var prevQuery = this.model.get('query');
        if (prevQuery) {
            app.router.navigate('/map/' + prevQuery, true);
        }
    }
});

/**
 * Vue du loader
 */
app.views.Loader = Backbone.View.extend({
    el: '#loader-container',
    template: _.template($('script#tpl-loader').html()),
    events: {},

    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:loading', this.toogleLoader);
    },

    render: function () {
        this.$el.html(this.template());
    },

    toogleLoader: function () {
        if (this.model.get('loading') === true) {
            this.show();
        } else {
            this.hide();
        }
    },

    show: function () {
        this.$el.addClass('show');
    },

    hide: function () {
        this.$el.removeClass('show');
    }
});