'use strict';

var app = app || {};

/**
 * Routeur de l'application
 */
app.Router = Backbone.Router.extend({

    routes: {
        'search': 'search',
        'map/:query': 'map',
        'merger': 'merger',
        'merged': 'merged_list',
        'rollback' : 'rollback_merge',
        '*default': 'default_route' // Default page
    },

    /**
     * Affichage du champ de recherche
     */
    search: function () {
        app.mapView.hide();
        app.resultsPaneContainerView.hide();
        app.entityInfoView.hide();

        app.searchView.show();
    },

    /**
     * Affichage de la carte avec les résulats
     */
    map: function (query) {

        app.mergerView.hide();
        app.searchView.hide();

        query = decodeURI(query);

        // Si la requete n'a pas changé
        if (app.data.get('query') == query) {
            app.mapView.show();
            app.resultsPaneContainerView.show();
            app.entityInfoView.show();
        }

        // Met à jours la requête. Sert dans le cas
        // ou l'utilisateur actualise la page ou tappe
        // directement l'addresse avec la recherche dans
        // la barre d'adresse.
        app.data.set('query', query);
    },

    /**
     * Formulaire pour merger des entités
     */
    merger: function () {

        if (app.mergerView.isMergeAvailable()) {
            app.mergerView.show();
            app.resultsPaneContainerView.hide();
            app.entityInfoView.hide();
        } else {
            app.router.navigate('search', true);
        }
    },

    /**
     * Liste des entités fusionnés
     */
    merged_list: function() {
        app.searchView.hide();
        app.mergerView.hide();
        app.entityInfoView.hide();
        app.resultsPaneContainerView.show();
        app.mapView.show();

        app.data.set({
            query: null,
            mode: 'automatique'
        });
        app.data.trigger('change:query', this.model);
    },

    /**
     * Route par défaut => redirige vers la recherche
     */
    default_route: function () {
        app.router.navigate('search', true);
    }
});