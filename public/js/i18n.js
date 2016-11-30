/**
 *
 */

var translate = {};

function i18n(key, null_if_not_exists) {

    var translated = translate[app.config.lang][key];

    if (translated) {
        return translated;
    }

    if(null_if_not_exists === true) {
        return null;
    }else {
        return '???' + key + '???';
    }
}

translate.fr = {

    /**
     * Commun
     */
    app_name: 'GeoSM',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    osm: 'Open Street Map',
    result: 'Résultat',
    results: 'Résultats',
    no_result: 'Aucun résultat',
    geonames: 'Géonames',
    app_credits: 'Un mashups par Jordan Martin & Jules Sauvinet',

    /**
     * Merge View
     */
    merger_title: "Fusion d'entités",
    merger_col_attribute: 'Attribut',
    merger_col_geonames: 'Geonames',
    merger_col_results: 'Résultat',
    merger_col_osm: 'Open Street Map',
    merge_add_attr: 'Ajouter un attribut',
    merger_custom_value_placeholder: 'Entrez la valeur personnalisée',
    merger_attr_name_placeholder: "Nom de l'attribut",

    /**
     * Search
     */
    search_input_placeholder: 'Entrez votre recherche. Par exemple : Paris',
    search_merge_auto_radio: 'Fusion automatique',
    search_merge_manual_radio: 'Fusion manuel',
    search_align_entity: 'Alignement des entités',
    show_merged_entities_btn: 'Entités déjà fusionnées',

    /**
     * ResutsPane
     */
    result_pane_merged_title: 'Entités fusionnées',

    /**
     * EntityInfo
     */
    infoview_title: 'Information',
    infoview_btn_merge: 'Fusionner les entités',
    infoview_btn_rollack: 'Annuler la fusion',

    /**
     * Attributs d'une entité
     */
    attr_name: 'Nom',
    attr_source: 'Source',
    attr_country: 'Pays',
    attr_coordinates: 'Coordonnées',
    attr_population: 'Population',
    attr_type: 'Type',
    attr_subtype: 'Sous type'
};

translate.en = {

    /**
     * Common
     */
    app_name: 'GeoSM',
    cancel: 'Cancel',
    save: 'Save',
    osm: 'Open Street Map',
    result: 'Result',
    results: 'Results',
    no_result: 'No result',
    geonames: 'Géonames',
    app_credits: 'A mashup by Jordan Martin & Jules Sauvinet',

    /**
     * Merge View
     */
    merger_title: "Merge entities",
    merger_col_attribute: 'Attribute',
    merger_col_geonames: 'Geonames',
    merger_col_results: 'Result',
    merger_col_osm: 'Open Street Map',
    merge_add_attr: 'Add an attribute',
    merger_custom_value_placeholder: 'Enter the custom value',
    merger_attr_name_placeholder: 'Attribute name',

    /**
     * Search
     */
    search_input_placeholder: 'Enter your search. Eg: London',
    search_merge_auto_radio: 'Automatic merge',
    search_merge_manual_radio: 'Manual merge',
    search_align_entity: 'Entities alignement',
    show_merged_entities_btn: 'Already merged entities',

    /**
     * EntityInfo
     */
    infoview_title: 'Information',
    infoview_btn_merge: 'Merge entities',
    infoview_btn_rollack: 'Cancel the merge',

    /**
     * ResutsPane
     */
    result_pane_merged_title: 'Merged entities',

    /**
     * Attributs d'une entité
     */
    attr_name: 'Name',
    attr_source: 'Source',
    attr_country: 'Country',
    attr_coordinates: 'Coordinates',
    attr_population: 'Population',
    attr_type: 'Type',
    attr_subtype: 'Subtype'
};