jQuery(document).ready(function () {
    // Check if usage comment is required
    var isCommentRequired = function() {
        return VyBildbankAdmin.usageComment == "on";
    }

    // Append comment field to the sidebar of modal
    var appendCommentField = function() {
        jQuery(".attachment-details").append("<label class='setting usage_comment'><span class='name'>" + VyBildbankAdmin.l10n.usageComment + "</span><input id='comment' type='text'/></label>");
    }

    // Check if comment is empty
    var commentIsEmpty = function() {
        var commentField = jQuery('#comment');
        return commentField.val() == "";
    }

    // Get value of comment field
    var getCommentValue = function() {
        var commentField = jQuery('#comment');
        return commentField.val();
    }

    // Helper variable to store collection which should be send into filter
    var selectedAlbumProps = null;

    // Clear props for selected album
    var clearSelectedAlbumProps = function() {
        selectedAlbumProps = null;
    }

    // Get selected galeries as string
    var getIdsForGallery = function(models) {
        var ids = [];
        _.each(models, function(model, index) {
            ids.push(model.id);
        });

        return ids.join(',');
    }

    // Insert image into editor based on state type
    var processImageSave = function(model, type) {
        switch(type) {
            case "insert":
                send_to_editor("<img class='alignnone wp-image-"+ model[0].id +"' src='" + model[0].url + "' />");
                break;
            case "gallery":
                send_to_editor('[gallery ids="'+ getIdsForGallery(model) +'"]');
                break;
        }
    }

    // Refresh VyBildbank library content
    var refreshingContent = function() {
        var props = {};
        // Taxonomy filter element
        var taxonomyFilterElement = jQuery('#media-attachment-taxonomy-filter');
        // Set properties with album ID
        props["collection"] = 'all';
        // Assign properties to the selectedAlbumProps variable
        selectedAlbumProps = props;
        // Assigning selected album id to the filter select
        taxonomyFilterElement.value = 'all';
        // Triggering change on a filter select
        taxonomyFilterElement.trigger('change');
        // Render select with select2
        taxonomyFilterElement.select2({
            dropdownParent: jQuery('.media-modal-content'),
            width: '200px'
        });
    }

    // Refresh media library content
    var refreshMediaContent = function() {
        // Taxonomy filter element
        var taxonomyFilterElement = jQuery('#media-attachment-date-filters');
        // Assigning selected album id to the filter select
        taxonomyFilterElement.value = 'all';
        // Triggering change on a filter select
        taxonomyFilterElement.trigger('change');
    }

    // Parent instance of Select
    var parentSelect = wp.media.view.MediaFrame.Select.prototype.bindHandlers;

    /**
     * Define actions for VyBildbank events
     */
    wp.media.view.MediaFrame.Select.prototype.bindHandlers = function () {
        // Call parent bindHandlers function in context
        parentSelect.apply(this, arguments);
        this.on( 'open' , this.refreshLibrary, this);
    };

    /**
     * Define taxonomy filter for VyBildbank content
     */
    wp.media.view.MediaFrame.Select.prototype.refreshLibrary = function (contentRegion) {
        if (!this.options.editing) {
            if (this.id == 'vybildbank') {
                refreshVyBildbankContent();
            }
            else {
                refreshMediaContent();
            }
        }
    };

    // Saving default media API before overriding
    var parentFrameSelectPrototype = wp.media.view.MediaFrame.Select.prototype;
    var parentQueryPrototype = wp.media.model.Query.prototype.sync;
    var parentAttachmentFilters = wp.media.view.AttachmentFilters;
    var parentAttachmentsBrowser = wp.media.view.AttachmentsBrowser;
    var parentToolbarInitialize = wp.media.view.Toolbar.prototype.initialize;
    var parentToggleSelectionHandler = wp.media.view.Attachment.prototype.toggleSelectionHandler;
    var parentMediaButton = wp.media.view.Button;
    var parentAttachment = wp.media.view.Attachment;
    var parentBindHandlers = wp.media.view.MediaFrame.Select.prototype.bindHandlers;
    var parentPostMediaView = wp.media.view.MediaFrame.Post;
    var parentAttachmentDetails = wp.media.view.Attachment.Details;

    var overrideFunctions = function() {

        /**
         * Extending media Post modal
         */
        wp.media.view.MediaFrame.Post = parentPostMediaView.extend({
            initialize: function() {
                _.defaults( this.options, {
                    multiple:  true,
                    editing:   false,
                    state:    'insert',
                    metadata:  {}
                });

                // Call 'initialize' directly on the parent class.
                parentPostMediaView.prototype.initialize.apply( this );
                this.createIframeStates();
            },

            /**
             * Create the default states.
             */
            createStates: function() {
                var options = this.options;

                this.states.add([
                    // Main states.
                    new wp.media.controller.Library({
                        id:         'insert',
                        title:      wp.media.view.l10n.insertMediaTitle,
                        priority:   20,
                        toolbar:    'main-insert',
                        filterable: 'all',
                        multiple:   options.multiple ? 'reset' : false,
                        editable:   true,

                        // If the user isn't allowed to edit fields,
                        // can they still edit it locally?
                        allowLocalEdits: true,

                        // Show the attachment display settings.
                        displaysettings: true,
                        // Update user settings when users adjust the
                        // attachment display settings.
                        displayUsersettings: true
                    }),

                    new wp.media.controller.Library({
                        id:         'gallery',
                        title:      wp.media.view.l10n.createGalleryTitle,
                        priority:   40,
                        toolbar:    'main-gallery',
                        filterable: 'uploaded',
                        multiple:   'add',
                        editable:   false
                    }),

                    new wp.media.controller.EditImage( { model: options.editImage } ),

                    // Gallery states.
                    new wp.media.controller.GalleryEdit({
                        library: options.selection,
                        editing: options.editing,
                        menu:    'gallery'
                    }),

                    new wp.media.controller.GalleryAdd()
                ]);
            },

            bindHandlers: function() {
                var handlers, checkCounts;

                wp.media.view.MediaFrame.Select.prototype.bindHandlers.apply( this, arguments );

                this.on( 'activate', this.activate, this );

                // Only bother checking media type counts if one of the counts is zero
                checkCounts = _.find( this.counts, function( type ) {
                    return type.count === 0;
                } );

                if ( typeof checkCounts !== 'undefined' ) {
                    this.listenTo( wp.media.model.Attachments.all, 'change:type', this.mediaTypeCounts );
                }

                this.on( 'menu:create:gallery', this.createMenu, this );
                this.on( 'toolbar:create:main-insert', this.createToolbar, this );
                this.on( 'toolbar:create:main-gallery', this.createToolbar, this );
                this.on( 'open', function() {
                    refreshVyBildbankContent();
                }, this);

                handlers = {
                    menu: {
                        'default': 'mainMenu',
                        'gallery': 'galleryMenu',
                    },

                    content: {
                        'edit-image':     'editImageContent',
                        'edit-selection': 'editSelectionContent'
                    },

                    toolbar: {
                        'main-insert':      'mainInsertToolbar',
                        'main-gallery':     'mainGalleryToolbar',
                        'gallery-edit':     'galleryEditToolbar',
                        'gallery-add':      'galleryAddToolbar',
                    }
                };

                _.each( handlers, function( regionHandlers, region ) {
                    _.each( regionHandlers, function( callback, handler ) {
                        this.on( region + ':render:' + handler, this[ callback ], this );
                    }, this );
                }, this );
            },

            activate: function() {
                // Hide menu items for states tied to particular media types if there are no items
                _.each( this.counts, function( type ) {
                    if ( type.count < 1 ) {
                        this.menuItemVisibility( type.state, 'hide' );
                    }
                }, this );
            },

            mediaTypeCounts: function( model, attr ) {
                if ( typeof this.counts[ attr ] !== 'undefined' && this.counts[ attr ].count < 1 ) {
                    this.counts[ attr ].count++;
                    this.menuItemVisibility( this.counts[ attr ].state, 'show' );
                }
            },

            // Menus
            /**
             * @param {wp.Backbone.View} view
             */
            mainMenu: function( view ) {
                view.set({
                    'library-separator': new wp.media.View({
                        className: 'separator',
                        priority: 100
                    })
                });
            },

            menuItemVisibility: function( state, visibility ) {
                var menu = this.menu.get();
                if ( visibility === 'hide' ) {
                    menu.hide( state );
                } else if ( visibility === 'show' ) {
                    menu.show( state );
                }
            },
            /**
             * @param {wp.Backbone.View} view
             */
            galleryMenu: function( view ) {
                var lastState = this.lastState(),
                    previous = lastState && lastState.id,
                    frame = this;

                view.set({
                    cancel: {
                        text:     wp.media.view.l10n.cancelGalleryTitle,
                        priority: 20,
                        click:    function() {
                            if ( previous ) {
                                frame.setState( previous );
                            } else {
                                frame.close();
                            }

                            // Keep focus inside media modal
                            // after canceling a gallery
                            this.controller.modal.focusManager.focus();
                        }
                    },
                    separateCancel: new wp.media.View({
                        className: 'separator',
                        priority: 40
                    })
                });
            },

            editSelectionContent: function() {
                var state = this.state(),
                    selection = state.get('selection'),
                    view;

                view = new wp.media.view.AttachmentsBrowser({
                    controller: this,
                    collection: selection,
                    selection:  selection,
                    model:      state,
                    sortable:   true,
                    search:     false,
                    date:       false,
                    dragInfo:   true,

                    AttachmentView: wp.media.view.Attachments.EditSelection
                }).render();

                view.toolbar.set( 'backToLibrary', {
                    text:     wp.media.view.l10n.returnToLibrary,
                    priority: -100,

                    click: function() {
                        this.controller.content.mode('browse');
                    }
                });

                // Browse our library of attachments.
                this.content.set( view );

                // Trigger the controller to set focus
                this.trigger( 'edit:selection', this );
            },

            editImageContent: function() {
                var image = this.state().get('image'),
                    view = new wp.media.view.EditImage( { model: image, controller: this } ).render();

                this.content.set( view );

                // after creavybildbank the wrapper view, load the actual editor via an ajax call
                view.loadEditor();

            },

            // Toolbars

            /**
             * @param {wp.Backbone.View} view
             */
            selectionStatusToolbar: function( view ) {
                var editable = this.state().get('editable');

                view.set( 'selection', new wp.media.view.Selection({
                    controller: this,
                    collection: this.state().get('selection'),
                    priority:   -40,

                    // If the selection is editable, pass the callback to
                    // switch the content mode.
                    editable: editable && function() {
                        this.controller.content.mode('edit-selection');
                    }
                }).render() );
            },

            /**
             * @param {wp.Backbone.View} view
             */
            mainInsertToolbar: function( view ) {
                var controller = this;

                this.selectionStatusToolbar( view );

                view.set( 'insert', {
                    style:    'primary',
                    priority: 80,
                    text:     wp.media.view.l10n.insertIntoPost,
                    requires: { selection: true },

                    /**
                     * @ignore
                     *
                     * @fires wp.media.controller.State#insert
                     */
                    click: function() {
                        var state = controller.state(),
                            selection = state.get('selection');

                        controller.close();
                        state.trigger( 'insert', selection ).reset();
                    }
                });
            },

            /**
             * @param {wp.Backbone.View} view
             */
            mainGalleryToolbar: function( view ) {
                var controller = this;

                this.selectionStatusToolbar( view );

                view.set( 'gallery', {
                    style:    'primary',
                    text:     wp.media.view.l10n.createNewGallery,
                    priority: 60,
                    requires: { selection: true },

                    click: function() {
                        var selection = controller.state().get('selection'),
                            edit = controller.state('gallery-edit'),
                            models = selection.where({ type: 'image' });

                        edit.set( 'library', new wp.media.model.Selection( models, {
                            props:    selection.props.toJSON(),
                            multiple: true
                        }) );

                        this.controller.setState('gallery-edit');

                        // Keep focus inside media modal
                        // after jumping to gallery view
                        this.controller.modal.focusManager.focus();
                    }
                });
            },

            galleryEditToolbar: function() {
                var editing = this.state().get('editing');
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     editing ? wp.media.view.l10n.updateGallery : wp.media.view.l10n.insertGallery,
                            priority: 80,
                            requires: { library: true },

                            /**
                             * @fires wp.media.controller.State#update
                             */
                            click: function() {
                                var controller = this.controller,
                                    state = controller.state();

                                controller.close();
                                state.trigger( 'update', state.get('library') );

                                // Restore and reset the default state.
                                controller.setState( controller.options.state );
                                controller.reset();
                            }
                        }
                    }
                }));
            },

            galleryAddToolbar: function() {
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     wp.media.view.l10n.addToGallery,
                            priority: 80,
                            requires: { selection: true },

                            /**
                             * @fires wp.media.controller.State#reset
                             */
                            click: function() {
                                var controller = this.controller,
                                    state = controller.state(),
                                    edit = controller.state('gallery-edit');

                                edit.get('library').add( state.get('selection').models );
                                state.trigger('reset');
                                controller.setState('gallery-edit');
                            }
                        }
                    }
                }));
            }
        });

        /**
         * Set router for VyBildbank
         */
        wp.media.view.MediaFrame.Select.prototype.browseRouter = function (routerView) {
            // Set router view for VyBildbank
            routerView.set({
                vybildbank: {
                    text: VyBildbankAdmin.l10n.VyBildbank,
                    priority: 60
                }
            });
        };

        /**
         * Define actions for VyBildbank events
         */
        wp.media.view.MediaFrame.Select.prototype.bindHandlers = function () {
            // Call parent bindHandlers function in context
            parentBindHandlers.apply(this, arguments);
            // On content create call VyBildbankContent function in context
            this.on('content:create', this.VyBildbankContent, this);
            // On modal close, revert overrides to default state
            this.on('close', function() {
                wp.media.view.MediaFrame.Select.prototype = parentFrameSelectPrototype;
                wp.media.model.Query.prototype.sync = parentQueryPrototype;
                wp.media.view.AttachmentFilters = parentAttachmentFilters;
                wp.media.view.AttachmentsBrowser = parentAttachmentsBrowser;
                wp.media.view.Toolbar.prototype.initialize = parentToolbarInitialize;
                wp.media.view.Attachment.prototype.toggleSelectionHandler = parentToggleSelectionHandler;
                wp.media.view.Button = parentMediaButton;
                wp.media.view.Attachment = parentAttachment;
                wp.media.view.MediaFrame.Select.prototype.bindHandlers = parentBindHandlers;
                wp.media.view.MediaFrame.Post = parentPostMediaView;
                wp.media.view.Attachment.Details = parentAttachmentDetails;
                this.reset();
            }, this);
        };

        /**
         * Define taxonomy filter for VyBildbank content
         */
        wp.media.view.MediaFrame.Select.prototype.VyBildbankContent = function (contentRegion) {
            var state = this.state();

            // Browse VyBildbank library of attachments.
            contentRegion.view = new wp.media.view.AttachmentsBrowser({
                controller: this,
                collection: state.get('library'),
                selection: state.get('selection'),
                model: state,
                sortable: false,
                search: true,
                filters: true,
                date: false,
                sidebar: true,

                AttachmentView: wp.media.view.Attachment.Library,
            });
        };

        /**
         * Define taxonomy filter for VyBildbank content
         */
        var MediaLibraryTaxonomyFilter = wp.media.view.AttachmentFilters.extend({
            id: 'media-attachment-taxonomy-filter',

            events: {
                change: 'change'
            },

            initialize: function() {
                this.createFilters();
                _.extend( this.filters, this.options.filters );

                // Build `<option>` elements.
                this.$el.html( _.chain( this.filters ).map( function( filter, value ) {
                    return {
                        el: jQuery( '<option></option>' ).val( value ).html( filter.text )[0],
                        priority: filter.priority || 50
                    };
                }, this ).sortBy('priority').pluck('el').value() );

                this.listenTo( this.model, 'change', this.select );
                this.select();
            },

            createFilters: function () {
                var filters = {};

                // Formats the 'terms' we've included via wp_localize_script()
                _.each(VyBildbankAdmin.terms || {}, function (value, index) {
                    filters[value.term_id] = {
                        text: value.name,
                        props: {
                            // Change this: key needs to be the WP_Query var for the taxonomy
                            collection: value.slug
                        }
                    };
                });

                filters.all = {
                    // Change this: use whatever default label you'd like
                    text: VyBildbankAdmin.l10n.allCollections,
                    priority: 1
                };
                // Assign filters to filters variable for controller
                this.filters = filters;
            },

            // Define behavior for taxonomy filter on change
            change: function () {
                // If album from dropdown is not selected
                if (selectedAlbumProps === null) {
                    // Selected term from filter
                    var term_id = this.$el.val();
                    // Initialize empty object for properties
                    var props = {};
                    // Add collection property with selected album ID
                    props['collection'] = term_id;
                    // Set properties to selectedAlbumProps variable for next processing
                    selectedAlbumProps = props;
                }

                // Set album properties to model
                this.model.set(selectedAlbumProps);
                // Clearing selected album props from selectedAlbumProps variable
                clearSelectedAlbumProps();
            }
        });

        var HomeButton = wp.media.view.Button.extend({
            tagName:    'button',
            className:  'vybildbank-root-button',
            attributes: { type: 'button' },

            events: {
                'click': 'click'
            },

            defaults: {
                text:     VyBildbankAdmin.l10n.backToRootDirectory,
                style:    '',
                size:     'small',
                disabled: false
            },

            click: function(event) {
                event.preventDefault();
                refreshVyBildbankContent();
            }
        });

        /**
         * Extend and override wp.media.view.AttachmentsBrowser to include our new filter
         */
        wp.media.view.AttachmentsBrowser = wp.media.view.AttachmentsBrowser.extend({
            createToolbar: function () {
                // Make sure to load the original toolbar
                parentAttachmentsBrowser.prototype.createToolbar.apply(this, arguments);
                // Set new toolbar for modal
                this.toolbar.set('MediaLibraryTaxonomyFilter', new MediaLibraryTaxonomyFilter({
                    controller: this.controller,
                    model: this.collection.props,
                    priority: -75
                }).render()); // Render new toolbar

                this.toolbar.set('HomeButton', new HomeButton({
                    priority: -65
                }).render());
            }
        });

        /**
         * Override Query sync function for VyBildbank purpose
         */
        wp.media.model.Query.prototype.sync = function (method, model, options) {
            var args, fallback;

            // Overload the read method so Attachment.fetch() functions correctly.
            if ('read' === method) {
                // API to fetch attachments
                var ajaxAction = 'vybildbank-query-attachments';

                options = options || {};
                options.context = this;
                options.data = _.extend(options.data || {}, {
                    action: ajaxAction,
                    post_id: wp.media.model.settings.post.id
                });

                // Clone the args so manipulation is non-destructive.
                args = _.clone(this.args);

                // Determine which page to query.
                if (-1 !== args.posts_per_page) {
                    args.paged = Math.round(this.length / args.posts_per_page) + 1;
                }

                // Push arguments to query
                options.data.query = args;
                // Send AJAX request to fetch attachments
                return wp.media.ajax(options);
            } else {
                // Otherwise, fall back to Backbone.sync()
                // Call wp.media.model.Attachments.sync or Backbone.sync
                fallback = wp.media.view.Attachments.prototype.sync ? wp.media.view.Attachments.prototype : Backbone;
                return fallback.sync.apply(this, arguments);
            }
        };

        /**
         * Add a spinner next to select button
         */
        wp.media.view.Toolbar.prototype.initialize = function () {
            var state = this.controller.state(),
                selection = this.selection = state.get('selection'),
                library = this.library = state.get('library');

            this._views = {};

            // The toolbar is composed of two `PriorityList` views.
            this.primary = new wp.media.view.PriorityList();
            this.secondary = new wp.media.view.PriorityList();
            this.primary.$el.append('<span class="spinner"></span>');

            // Add a spinner next to select button
            this.primary.$el.addClass('media-toolbar-primary search-form');
            this.secondary.$el.addClass('media-toolbar-secondary');
            this.views.set([this.secondary, this.primary]);

            if (this.options.items) {
                this.set(this.options.items, {silent: true});
            }

            if (!this.options.silent) {
                this.render();
            }

            if (selection) {
                selection.on('add remove reset', this.refresh, this);
            }

            if (library) {
                library.on('add remove reset', this.refresh, this);
            }
        };

        /**
         * Handle selection of an attachment
         */
        wp.media.view.Attachment.prototype.toggleSelectionHandler = function (event) {
            // If album is selected
            if (this.model.attributes.isAlbum) {
                // Empty properties
                var props = {};
                // Taxonomy filter element
                var taxonomyFilterElement = document.getElementById('media-attachment-taxonomy-filter');
                // Set properties with album ID
                props["collection"] = this.model.attributes.id;
                // Assign properties to the selectedAlbumProps variable
                selectedAlbumProps = props;
                // Assigning selected album id to the filter select
                taxonomyFilterElement.value = this.model.attributes.id;
                // Triggering change on a filter select
                taxonomyFilterElement.dispatchEvent(new Event('change'));

                return;
            }

            var method;

            // Don't do anything inside inputs and on the attachment check and remove buttons.
            if ('INPUT' === event.target.nodeName || 'BUTTON' === event.target.nodeName) {
                return;
            }

            // Catch arrow events
            if (37 === event.keyCode || 38 === event.keyCode || 39 === event.keyCode || 40 === event.keyCode) {
                this.controller.trigger('attachment:keydown:arrow', event);
                return;
            }

            // Catch enter and space events
            if ('keydown' === event.type && 13 !== event.keyCode && 32 !== event.keyCode) {
                return;
            }

            event.preventDefault();

            // In the grid view, bubble up an edit:attachment event to the controller.
            if (this.controller.isModeActive('grid')) {
                if (this.controller.isModeActive('edit')) {
                    // Pass the current target to restore focus when closing
                    this.controller.trigger('edit:attachment', this.model, event.currentTarget);
                    return;
                }

                if (this.controller.isModeActive('select')) {
                    method = 'toggle';
                }
            }

            if (event.shiftKey) {
                method = 'between';
            } else if (event.ctrlKey || event.metaKey) {
                method = 'toggle';
            }

            this.toggleSelection({
                method: method
            });

            this.controller.trigger('selection:toggle');

            // Check if comment is required
            if (isCommentRequired()) {
                // Append comment field to the sidebar of modal
                appendCommentField();
            }
        };

        // Method to parse attachment to the view
        wp.media.model.Attachments.prototype.parse = function(resp, xhr) {
            if ( ! _.isArray( resp ) ) {
                resp = [resp];
            }

            return _.each( resp, function( attrs, index ) {
                var id, attachment, newAttributes;

                if ( attrs instanceof Backbone.Model ) {
                    id = attrs.get( 'id' );
                    attrs = attrs.attributes;
                } else {
                    id = attrs.id;
                }

                attachment = wp.media.model.Attachment.get( id );
                newAttributes = attachment.parse( attrs, xhr );

                if ( ! _.isEqual( attachment.attributes, newAttributes ) ) {
                    attachment.set( newAttributes );
                }

                return attachment;
            });
        }

        /**
         * Override default button functionality
         */
        wp.media.view.Button = wp.media.view.Button.extend({
            /**
             * Handle select click
             *
             * @param {Object} event
             */
            click: function (event) {
                // Check if comment is required and empty
                if (isCommentRequired() && commentIsEmpty()) {
                    // Highlight comment field if empty
                    jQuery('#comment').addClass('vybildbank-required-usage-comment');
                    // Prevent click event
                    event.preventDefault();
                    return false;
                }

                // If attachment link is empty prevent click event
                if ('#' === this.attributes.href) {
                    event.preventDefault();
                }

                // Get selected attachment
                var selectedMedia = this.controller.state().get('selection').toJSON();
                // Set usage comment if required
                if (isCommentRequired() && !commentIsEmpty()) {
                    var usageComment = getCommentValue();

                    _.each(selectedMedia, function(media, index) {
                        media.usage_comment = usageComment;
                    });
                }
                // Find spinner
                var spinner = jQuery(this.$el[0].parentElement).find('.spinner');
                // Show / active spinner
                spinner.addClass('is-active');
                // Save select button to variable
                var button = this;
                // Disable select button
                this.model.set('disabled', true);
                // Download image to wordpress gallery
                jQuery.ajax({
                    url: VyBildbankAdmin.ajaxUrl,
                    type: 'post',
                    data: {
                        action: 'vybildbank_download_asset',
                        post_id: wp.media.model.settings.post.id, // current post ID
                        selected_media: selectedMedia,
                    },
                    // Ajax success
                    success: function (response) {
                        // Parse response data to backbone model
                        var newModel = wp.media.model.Attachments.prototype.parse(response.data, null);
                        var stateType = button.controller.state().attributes.id;
                        // // Get current state of media library
                        var state = button.controller.state();
                        // // Get selected attachment
                        var selection = state.get('selection');
                        selection['add'](newModel);
                        selection.single(newModel);
                        // // Mark new parsed attachment (downloaded attachment) as selected
                        state.set('selection', selection);
                        button.controller.modal.close();
                        // Send content to editor
                        processImageSave(newModel, stateType);
                        // Hide / deactivate spinner
                        spinner.removeClass('is-active');
                        // Trigger click on select button
                        button.options.click.apply(button, arguments);
                    }
                });
            }
        });
    }

    // Append VyBildbank button next to media library button
    jQuery('#wp-content-media-buttons').append("<button type='button' id='insert-vybildbank-button' class='button'>" + VyBildbankAdmin.l10n.VyBildbank + "</button>");

    jQuery(document).on('click', '#insert-vybildbank-button', function() {
        overrideFunctions();

        // New instance of modal
        var vybildbankMedia = new wp.media({
            frame: 'post',
            title: VyBildbankAdmin.l10n.insertFromVyBildbank,
            id: 'vybildbank-modal'
        });

        // Open modal
        vybildbankMedia.open();

        var taxonomyFilter = jQuery('#media-attachment-taxonomy-filter');
        // Set select2 for taxonomy filter
        taxonomyFilter.select2({
            dropdownParent: jQuery('.media-modal-content'),
            width: '200px'
        });
    });

    // On menu change, refresh content based on modal
    jQuery(document).on('click', '.media-menu-item', function() {
        if (jQuery(this).parent().parent().parent().is('#vybildbank-modal')) {
            refreshVyBildbankContent();
        }
        else {
            refreshMediaContent();
        }
    });
});
