'use strict';

var app = app || {};
app.views = app.views || {};

app.views.Merger = Backbone.View.extend({

    el: '#merger',

    events: {
        'click .merger-cancel-btn': 'cancelMerge',
        'click .merger-add-attr-btn': 'addRow',
        'submit .merger-form': 'handleFormSubmit',
        'change input[type=radio]': 'handleRadioChange',
        'keydown textarea': 'handleTextareaChange'
    },

    template: _.template($('script#tpl-merger').html()),

    initialize: function () {
    },

    render: function () {

        var entityGeo = this.model.get('selectedEntityGeo').forView();
        var entityOsm = this.model.get('selectedEntityOsm').forView();

        var editable_attrs = [
            'coordinates', 'name', 'population', 'type'
        ];

        var arr = {};
        // Tableau associatif <id_attribut, {geo: valeur_geo, osm: valeur_osm}>
        for (var i in editable_attrs) {

            var attr = editable_attrs[i];

            arr[attr] = {
                osm: {
                    selected: !!entityOsm[attr],
                    value: entityOsm[attr] || null
                },
                geo: {
                    selected: !entityOsm[attr] && !!entityGeo[attr],
                    value: entityGeo[attr] || null
                },
                user: {
                    selected: !entityOsm[attr] && !entityGeo[attr],
                    value: null
                }
            };
        }

        this.$el.html(this.template({
            attrs: arr
        }));

        // Redimensionnement auto des textarea
        autosize(this.$el.find('textarea'));

        // Déclanche l'évènement change pour
        // que les éléments soit rendus dans
        // le bon état
        this.$el.find('input[type="radio"]:checked').trigger('change');
    },

    show: function () {
        this.render();
        this.$el.addClass('show');
    },

    hide: function () {
        this.$el.removeClass('show');
    },

    cancelMerge: function (e) {
        e.preventDefault();
        app.router.navigate('map/' + app.data.get('query'), true);
    },

    handleFormSubmit: function (e) {
        e.preventDefault();
        var data = $(e.target).serializeObject();

        parseInt(this.model.get('selectedEntityOsm').attributes.raw.osm_id)
        if (this.model.get('selectedEntityOsm')) {
            data.attr['osm_id'] = {
                value: parseInt(this.model.get('selectedEntityOsm').attributes.raw.osm_id),
                source: 'osm'
            };
            data.attr['osm_type'] = {
                value: this.model.get('selectedEntityOsm').attributes.raw.osm_type,
                source: 'osm'
            };
        }

        if (this.model.get('selectedEntityGeo')) {
            data.attr['geonames_id'] = {
                value: this.model.get('selectedEntityGeo').attributes.raw.geonameId,
                source: 'geonames'
            };
        }

        $.post('persist-merge', data)
            .done(function () {
                ohSnap("Enregistrement de la fusion réussite.", {color: 'green'});
                app.router.navigate('map/' + app.data.get('query'), true);

                // TODO rafraichir ou mettre à jour les listes ? à voir !
            })
            .fail(function () {
                ohSnap("Echec lors de l'enregistrement de cette fusion", {color: 'red'});
            });
    },

    handleRadioChange: function (e) {

        var $el = $(e.target);
        var isUserInput = $el.hasClass('merger-radio-user');

        var parentTr = $el.closest('tr');
        var $inputResult = parentTr.find('.merger-result-input');
        var $inputAttrValue = parentTr.find('.merger-attr-value-input');

        if (!isUserInput) {
            var value = $el.closest('td').find('.merger-field-value').text();

            $inputAttrValue
                .prop('disabled', false)
                .val(value);

            $inputResult
                .val(value)
                .prop('disabled', true);
        } else {
            $inputAttrValue.prop('disabled', true);
            $inputResult.prop('disabled', false);
            $inputResult.focus();
            $inputResult.val('');
        }

        setTimeout(function () {
            autosize.update($inputResult);
        }, 1);

    },

    isMergeAvailable: function () {
        return this.model.get('selectedEntityGeo')
            && this.model.get('selectedEntityOsm');
    },

    handleTextareaChange: function (e) {

        // On interdit le retour à la ligne
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    },

    addRow: function (e) {
        e.preventDefault();

        this.$el.find('tbody').append('<tr>                                             \
            <td class="merger-td-attr">                                                 \
                <input type="text"                                                      \
                name="extra_attrs[][name]"                                              \
                placeholder="' + i18n('merger_attr_name_placeholder') + '"              \
                class="merger-attr-name-input">                                         \
            </td>                                                                       \
            <td class="merger-td-geo empty"><div class="meger-empty-cell">—</div></td>  \
            <td class="merger-td-result">                                               \
                <div class="merger-field-value">                                        \
                    <textarea placeholder="Entrez la valeur personnalisée"              \
                        name="extra_attrs[][value]"                                     \
                        rows="1" class="merger-result-input"></textarea>                \
                </div>                                                                  \
            </td>                                                                       \
            <td class="merger-td-osm empty"><div class="meger-empty-cell">—</div></td>  \
        </tr>');
        this.$el.scrollTop(this.$el.prop('scrollHeight'));
    }
});
