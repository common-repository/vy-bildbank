/**
 * ====================== Variables ======================
 */

// Blocks which support VyBildbank plugin
var extendedBlocks = [
    'image',
    'gallery',
    'media-text',
    'cover'
]

var openedType;
var imageState = null;
var coverState = null;
var galleryState = null;
var mediatextState = null;

/**
 * ====================== Functions ======================
 */

// Add vybildbank button for Gutenberg
var addVyBildbankButtonGutenberg = function(placeholder) {
    placeholder.append('<div class="vybildbank-button-wrapper"><button type="button" id="insert-from-vybildbank" class="components-button block-editor-media-placeholder__button is-tertiary">' + VyBildbankAdmin.l10n.VyBildbank + '</button></div>');
    // placeholder.append('<div class="vybildbank-button-wrapper"><button type="button" id="insert-from-vybildbank" class="components-button editor-media-placeholder__button block-editor-media-placeholder__button is-button is-default is-large">' + VyBildbankAdmin.l10n.VyBildbank + '</button></div>');
}

// Add VyBildbank button for old editor
var addVyBildbankButtonRegular = function() {
    // jQuery('[aria-label="Image"]').click(function() {
    //     alert("yo");
    // })
    jQuery('#wp-content-media-buttons').append('<button type="button" id="insert-from-vybildbank-old" class="button" data-editor="content">' + VyBildbankAdmin.l10n.insertFromVyBildbank + '</button>');
}

// Wait for element to be rendered via Backbone
var waitForComponentsPlaceholder = function(callback) {
    if (jQuery(".components-placeholder__fieldset").length != 0) {
        var foundEmpty = false;

        jQuery.each(jQuery(".components-placeholder__fieldset"), function (index, value) {
            placeholder = jQuery(value);
            placeholderChildButton = placeholder.find("#insert-from-vybildbank");

            if (placeholderChildButton.length == 0) {
                callback(placeholder);
                foundEmpty = true;
            }
        });

        if (!foundEmpty) {
            setTimeout(function() {
                waitForComponentsPlaceholder(callback);
            }, 100);
        }
    } else {
        setTimeout(function() {
            waitForComponentsPlaceholder(callback);
        }, 100);
    }
}

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

// Insert VyBildbank button for a block
// var insertButton = function(type) {
//     waitForComponentsPlaceholder(function(placeholder) {
//         addVyBildbankButtonGutenberg(placeholder);
//         openedType = type;
//     });
// }

// Check if block supports VyBildbank plugin
var isApprovedType = function(type) {
    return extendedBlocks.includes(type);
}

/**
 * ====================== Functionality ======================
 */

/**
 * Add button for gutenberg block
 */
// jQuery(document).on('click', '[class*="editor-block-list-item"]', function() {
//     console.log("zz" + this)
//     console.log("qq" + jQuery(this).classList)
//     console.log("hej" + jQuery(this).context)
//     console.log("ha" + jQuery(this).context.classList)
//     var buttonClass = jQuery(this).context.classList[2];
//     var type = buttonClass.split("-");
//     type = type.splice(4, type.length);
//     type = type.join("-");

//     if (isApprovedType(type)) {
//         insertButton(type);
//     }
// });

/**
 * Add button for gutenberg when small button under the block is clicked
 */
// jQuery(document).on('click', '.block-editor-inserter-with-shortcuts__block', function() {
//     waitForComponentsPlaceholder(function(placeholder) {
//         addVyBildbankButtonGutenberg(placeholder);
//     });
// });

    // jQuery('[aria-label="Image"]').click(function() {
    //     alert("yo");
    // })
// jQuery(document).on("click", ".editor-block-list-item-image", function() { 
//     waitForComponentsPlaceholder(function(placeholder) {
//         addVyBildbankButtonGutenberg(placeholder);
//     });
// });
    // jQuery(".editor-block-list-item-image").click(function() {
    //     alert("Hej");
    // })
    // alert("halli");

/**
 * Override wordpress media modal functions
 */
var overrideFunctions = function() {
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

    // Selected album properties variable
    var selectedAlbumProps = null;

    // Clear selected album properties variable
    var clearSelectedAlbumProps = function() {
        selectedAlbumProps = null;
    }

    // Attachment data from AJAX response
    var selectedAttachmentData = null;

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
        // On content render call VyBildbankContent function in context
        this.on('content:render', this.VyBildbankContent, this);
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
            this.setState(getInitialState());

            // Get selected block
            var selectedBlock = wp.data.select('core/block-editor').getSelectedBlock();

            if (selectedBlock !== null) {
                // Get selected block client ID
                var clientId = selectedBlock.clientId;
            }

            // Check if attachment is selected
            if (selectedAttachmentData !== null) {
                if (openedType == 'media-text') {
                    // Dispatch action for block attributes update
                    wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
                        mediaId: selectedAttachmentData[0].id,
                        mediaUrl: selectedAttachmentData[0].url,
                        mediaType: "image",
                        mediaAlt: selectedAttachmentData[0].alt
                    });
                }
                else if (openedType == "image" || openedType == "cover") {
                    // Dispatch action for block attributes update
                    wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
                        caption: "",
                        id: selectedAttachmentData[0].id,
                        link: selectedAttachmentData[0].link,
                        url: selectedAttachmentData[0].url,
                        alt: selectedAttachmentData[0].alt
                    });
                }
                else if (openedType == "gallery") {
                    var ids = [];
                    var images = [];

                    jQuery.each(selectedAttachmentData, function (index, value) {
                        var image = {};

                        image.alt = value.alt;
                        image.caption = value.caption;
                        image.id = value.id;
                        image.link = value.link;
                        image.url = value.url;
                        image.alt = value.alt;

                        ids.push(value.id);
                        images.push(image);
                    });

                    // Dispatch action for block attributes update
                    wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
                        ids: ids,
                        images: images
                    });
                }

                // Get selected block
                selectedBlock = wp.data.select('core/block-editor').getSelectedBlock();
                // Get client ID of selected block
                clientId = selectedBlock.clientId;

                // Clone selected block
                var clonedBlock = wp.blocks.cloneBlock(selectedBlock);

                // Remove selected block
                wp.data.dispatch('core/block-editor').removeBlock(clientId);
                // Create new block with rendered image
                wp.data.dispatch('core/block-editor').insertBlock(clonedBlock);
            }
        }, this);
    };

    /**
     * Define taxonomy filter for VyBildbank content
     */
    wp.media.view.MediaFrame.Select.prototype.VyBildbankContent = function (contentRegion) {
        var state = this.state();

        if (getInitialState() === null) {
            setInitialState(state);
        }

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
            display: false,
            sidebar: true,

            AttachmentView: wp.media.view.Attachment.Library,
        });
    };

    /**
     * Override default post modal functionality
     */
    wp.media.view.MediaFrame.Post = wp.media.view.MediaFrame.Post.extend({
        initialize: function() {
            _.defaults( this.options, {
                multiple:  true,
                editing:   false,
                state:    'insert',
                metadata:  {}
            });

            // Call 'initialize' directly on the parent class.
            parentFrameSelectPrototype.initialize.apply( this, arguments );
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
                    title:      wp.media.view.l10n.createGalleryTitle,
                    priority:   10,
                    toolbar:    'main-gallery',
                    filterable: 'uploaded',
                    multiple:   'add',
                    editable:   false,
                }),

                // Gallery states.
                new wp.media.controller.GalleryEdit({
                    library: options.selection,
                    menu: 'gallery'
                }),

                new wp.media.controller.GalleryAdd(),
            ]);
        },

        /**
         * Override bindHandlers for modal
         */
        bindHandlers: function() {
            var handlers, checkCounts;

            // Call parent bindHandlers
            parentFrameSelectPrototype.bindHandlers.apply( this, arguments );

            // Only bother checking media type counts if one of the counts is zero
            checkCounts = _.find( this.counts, function( type ) {
                return type.count === 0;
            } );

            if ( typeof checkCounts !== 'undefined' ) {
                this.listenTo( wp.media.model.Attachments.all, 'change:type', this.mediaTypeCounts );
            }

            this.on( 'menu:create:gallery', this.createMenu, this );
            this.on( 'toolbar:create:main-gallery', this.createToolbar, this );
            this.on( 'content:create', this.VyBildbankContent, this );
            this.on( 'content:render', this.VyBildbankContent, this );

            handlers = {
                menu: {
                    'default': 'mainMenu',
                    'gallery': 'galleryMenu',
                },

                toolbar: {
                    'main-gallery':     'mainGalleryToolbar',
                    'gallery-add':      'galleryAddToolbar',
                }
            };

            // Show insert button
            _.each( handlers, function( regionHandlers, region ) {
                _.each( regionHandlers, function( callback, handler ) {
                    this.on( region + ':render:' + handler, this[ callback ], this );
                }, this );
            }, this );
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

        // Toolbars

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
                    // Keep focus inside media modal
                    // after jumping to gallery view
                    controller.modal.close();
                }
            });
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
     * Define taxonomy filter for VyBildbank content
     */
    var MediaLibraryTaxonomyFilter = wp.media.view.AttachmentFilters.extend({
        id: 'media-attachment-taxonomy-filter',

        events: {
            change: 'change',
            updateFilters: 'updateFilters'
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

            var props = {};
            // Taxonomy filter element
            var taxonomyFilterElement = document.getElementById('media-attachment-taxonomy-filter');
            // Set properties with album ID
            props["collection"] = 'all';
            // Assign properties to the selectedAlbumProps variable
            selectedAlbumProps = props;
            // Assigning selected album id to the filter select
            taxonomyFilterElement.value = 'all';
            // Triggering change on a filter select
            taxonomyFilterElement.dispatchEvent(new Event('change'));
        }
    });

    /**
     * Extend and override wp.media.view.AttachmentsBrowser to include our new filter
     */
    wp.media.view.AttachmentsBrowser = wp.media.view.AttachmentsBrowser.extend({
        createToolbar: function () {
            // Make sure to load the original toolbar
            parentAttachmentsBrowser.prototype.createToolbar.call(this);
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
            fallback = Attachments.prototype.sync ? Attachments.prototype : Backbone;
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

    var galleryCreated = false;

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
            if (galleryCreated) {
                this.options.click.apply(button, arguments);
                return false;
            }

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
                    if(!response.success) {
                        console.log(response);
                        alert("Error: " + response.data[0].message)
                    }
                    
                    
                    // Parse response data to backbone model
                    var newModel = wp.media.model.Attachments.prototype.parse(response.data, null);
                    
                    
                    // Fill selectedAttachmentData with response data
                    selectedAttachmentData = response.data;

                    // Get current state of media library
                    var state = button.controller.state();

                    // Get selected attachment
                    var selection = state.get('selection');
                    selection['add'](newModel);
                    selection.single(newModel);
                    
                    // Mark new parsed attachment (downloaded attachment) as selected
                    state.set('selection', selection);

                    // Hide / deactivate spinner
                    spinner.removeClass('is-active');

                    if (openedType == "gallery") {
                        galleryCreated = true;
                    }

                    // console.log(newModel);

                    // Trigger click on select button
                    button.options.click.apply(button, arguments);
                }
            });
        }
    });
}

var setInitialState = function(state) {
    switch (openedType) {
        case "image":
            imageState = state;
            break;
        case "cover":
            coverState = state;
            break;
        case "gallery":
            galleryState = state;
            break;
        case "media-text":
            mediatextState = state;
            break;
    }
}

var getInitialState = function() {
    switch (openedType) {
        case "image":
            return imageState;
        case "cover":
            return coverState;
        case "gallery":
            return galleryState;
        case "media-text":
            return mediatextState;
    }
}

/**
 * Opens media modal for image selection
 */
var openImageModal = function() {
    // Custom VyBildbank modal
    var vybildbankMedia = new wp.media({
        frame: 'select',
        title: VyBildbankAdmin.l10n.insertFromVyBildbank,
        id: 'vybildbank-modal',
        library: {
            type: "image"
        },
        button: {
            text: VyBildbankAdmin.l10n.select
        }
    });

    // Open modal
    vybildbankMedia.open();

    var taxonomyFilter = jQuery('#media-attachment-taxonomy-filter');
    taxonomyFilter.select2({
        dropdownParent: jQuery('.media-modal-content'),
        width: '200px'
    });
}

/**
 * Opens media modal for gallery selection
 */
var openGalleryModal = function() {
    // Custom VyBildbank modal
    var vybildbankMedia = new wp.media({
        frame: 'post',
        sidebar: false,
        id: 'vybildbank-modal'
    });

    // Open modal
    vybildbankMedia.open();

    var taxonomyFilter = jQuery('#media-attachment-taxonomy-filter');
    taxonomyFilter.select2({
        dropdownParent: jQuery('.media-modal-content'),
        width: '200px'
    });
}

/**
 * Show VyBildbank modal on VyBildbank button click
 */
jQuery(document).on('click', '#insert-from-vybildbank', function(e) {
    // Override core media modal functionality
    overrideFunctions();

    // Add logic to open modals
    if (openedType == "image" || openedType == "cover" || openedType == "media-text") {
        openImageModal();
        return;
    }

    if (openedType == "gallery") {
        openGalleryModal();
        return;
    }
});

/**
 * Remove red borders from usage comment field when it changes
 */
jQuery(document).on('change', '#comment', function(e) {
    if (jQuery(this).hasClass('vybildbank-required-usage-comment')) {
        jQuery(this).removeClass('vybildbank-required-usage-comment');
    }
});

/**
 * Change opened block type on block focus
 */
jQuery(document).on("focus", ".wp-block", function() {
    // Type of block
    var type = jQuery(this).data('type');

    switch (type) {
        case "core/image":
            openedType = "image";
            break;
        case "core/cover":
            openedType = "cover";
            break;
        case "core/gallery":
            openedType = "gallery";
            break;
        case "core/media-text":
            openedType = "media-text";
            break;
    }
});

jQuery(document).ready(function () {
    // waitForComponentsPlaceholder(function(placeholder) {
    //     addVyBildbankButtonGutenberg(placeholder);
    // });

    wp.data.subscribe(function () {

      // if media placeholder exists and no vy bildbank button is in it
      if(jQuery(".block-editor-media-placeholder").length > 0 && jQuery("#insert-from-vybildbank").length == 0) {
        addVyBildbankButtonGutenberg(jQuery(".block-editor-media-placeholder .components-placeholder__fieldset"))
      }
      // var isSavingPost = wp.data.select('core/editor').isSavingPost();
      // var isAutosavingPost = wp.data.select('core/editor').isAutosavingPost();

      // if (isSavingPost && !isAutosavingPost) {
      //   // Here goes your AJAX code ......

      // }
    })
});
