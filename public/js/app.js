'use strict';
var app = app || {};

/**
 * Point d'entrée de l'application
 */
$(function () {
    
    // Instanciation des modèles
    app.data = new app.models.Data();

    // Instanciation des vues
    app.layoutView = new app.views.Base();
    app.mergerView = new app.views.Merger({model: app.data});
    app.searchView = new app.views.Search({model: app.data});
    app.mapView = new app.views.Map({model: app.data});
    app.resultsPaneContainerView = new app.views.ResultsPaneContainer({model: app.data});
    app.entityInfoView = new app.views.EntityInfo({model: app.data});
    app.loaderView = new app.views.Loader({model: app.data});

    // Instanciation du routeur
    app.router = new app.Router();
    
    // Active le routage
    Backbone.history.start();
});