histomicstk.views.ItemSelectorWidget = girder.View.extend({
    events: {
        'click .h-select-button': '_selectButton',
        'change #h-select-hierarchy-root': '_selectRoot'
    },

    initialize: function (settings) {
        settings = settings || {};
        if (!this.model) {
            this.model = new girder.models.ItemModel();
        }
        this._root = settings.root;

        this._collections = new girder.collections.CollectionCollection();
        if (settings.collectionLimit >= 0) {
            this._collections.pageLimit = settings.collectionLimit;
        }

        this._users = new girder.collections.UserCollection();
        if (settings.userLimit >= 0) {
            this._users.pageLimit = settings.userLimit;
        }

        this.listenTo(this._collections, 'g:changed', this._renderRootSelection);
        this.listenTo(this._users, 'g:changed', this._renderRootSelection);
        this.listenTo(girder.events, 'g:login', this._renderRootSelection);

        this._collections.fetch();
        this._users.fetch();
    },

    render: function () {

        this.$el.html(
            histomicstk.templates.itemSelectorWidget(this.model.attributes)
        ).girderModal(this);

        this._renderRootSelection();
        return this;
    },

    _renderRootSelection: function () {
        if (!this._root && girder.currentUser) {
            this._root = girder.currentUser;
        }
        this.$('.h-hierarchy-root').html(
            histomicstk.templates.rootSelectorWidget({
                root: this._root,
                home: girder.currentUser,
                collections: this._collections.models,
                users: this._users.models
            })
        );
        if (this._root) {
            this._renderHierarchyView();
        }
    },

    _renderHierarchyView: function () {
        if (this._hierarchyView) {
            this._hierarchyView.off();
            this.$('.h-hierarchy-widget').empty();
        }
        this._hierarchyView = new girder.views.HierarchyWidget({
            parentView: this,
            parentModel: this._root,
            checkboxes: false,
            routing: false,
            showActions: false,
            onItemClick: _.bind(this._selectItem, this)
        });
        this._hierarchyView.setElement(this.$('.h-hierarchy-widget')).render();
    },

    /**
     * Get the currently displayed path in the hierarchy view.
     */
    _path: function () {
        var path = this._hierarchyView.breadcrumbs.map(function (d) {
            return d.get('name');
        });

        if (this.model.get('type') === 'directory') {
            path = _.initial(path);
        }
        return path;
    },

    _selectItem: function (item) {
        if (this.model.get('type') === 'file') {
            this.model.set({
                path: this._path(),
                value: item
            });
            this.trigger('g:saved');
            this.$el.modal('hide');
        }
    },

    _selectButton: function () {
        var inputEl = this.$('#h-new-file-name');
        var inputElGroup =  inputEl.parent();
        var fileName = inputEl.val();
        var type = this.model.get('type');
        var parent = this._hierarchyView.parentModel;
        var errorEl = this.$('.h-modal-error').addClass('hidden');

        inputElGroup.removeClass('has-error');

        switch (type) {
            case 'new-file':

                // a file name must be provided
                if (!fileName) {
                    inputElGroup.addClass('has-error');
                    errorEl.removeClass('hidden')
                        .text('You must provide a name for the new file.');
                    return;
                }

                // the parent must be a folder
                if (parent.resourceName !== 'folder') {
                    errorEl.removeClass('hidden')
                        .text('Files cannot be added under collections.');
                    return;
                }

                this.model.set({
                    path: this._path(),
                    parent: parent,
                    value: new girder.models.ItemModel({
                        name: fileName,
                        folderId: parent.id
                    })
                });
                break;

            case 'directory':
                this.model.set({
                    path: this._path(),
                    value: parent
                });
                break;
        }
        this.trigger('g:saved');
        this.$el.modal('hide');
    },

    _selectRoot: function (evt) {
        var $el = $(evt.target).find(':selected');
        switch ($el.data('type')) {
            case 'collection':
                this._root = this._collections.get($el.val());
                break;
            case 'user':
                this._root = this._users.get($el.val());
                break;
            default:
                this._root = null;
                break;
        }
        this._renderRootSelection();
    }
});
