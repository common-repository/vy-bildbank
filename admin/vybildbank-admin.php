<?php

// include admin option page functionality
require_once( VYBILDBANK_PATH . 'admin/vybildbank-admin-options.php' );

// include admin media library functionality (AJAX actions)
require_once( VYBILDBANK_PATH . 'admin/vybildbank-admin-media-library.php' );

// enqueue a plugin CSS stylesheet
if ( ! function_exists( 'vybildbank_enqueue_styles' ) ) {
	function vybildbank_enqueue_styles() {
		wp_enqueue_style( 'vybildbank-admin-style', VYBILDBANK_URL . 'admin/css/admin.css', array(), VYBILDBANK_VERSION, 'all' );
		wp_enqueue_style( 'vybildbank-select2', VYBILDBANK_URL . 'assets/css/select2.min.css', array(), VYBILDBANK_VERSION, 'all' );
	}
}

add_action( 'admin_enqueue_scripts', 'vybildbank_enqueue_styles' );

// enqueue a plugin JS script
if ( ! function_exists( 'vybildbank_enqueue_script' ) ) {
	function vybildbank_enqueue_script($hook) {
		global $post;
		// Get currently viewed screen
		$current_screen = get_current_screen();

		// If editor is Gutenberg, enqueue javascript for gutenberg
		if ( method_exists( $current_screen, 'is_block_editor' ) && $current_screen->is_block_editor() ) {
			wp_enqueue_script( 'vybildbank-select2-js', VYBILDBANK_URL . 'assets/js/select2.min.js', array( ), VYBILDBANK_VERSION, true );
			wp_enqueue_script( 'vybildbank-admin-js', VYBILDBANK_URL . 'admin/js/admin.js', array( 'jquery' ), VYBILDBANK_VERSION, true );

			// import VyBildbank plugin translations for JS file
			require_once( VYBILDBANK_PATH . 'l10n.php' );

			// localize a script
			wp_localize_script( 'vybildbank-admin-js', 'VyBildbankAdmin', array(
				'terms'   => VyBildbank_Api_Controller::albums_to_terms( VyBildbank_Api_Controller::list_all_albums() ),
				'usageComment' => get_option('vybildbank_options')['vybildbank_field_comment'],
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'l10n' => $l10n
			) );
		}
		else {
			if ( $hook == 'post-new.php' || $hook == 'post.php' ) {
				wp_enqueue_script( 'vybildbank-select2-js', VYBILDBANK_URL . 'assets/js/select2.min.js', array( ), VYBILDBANK_VERSION, true );
				wp_enqueue_script( 'vybildbank-no-gutenberg-admin-js', VYBILDBANK_URL . 'admin/js/no-gutenberg-admin.js', array( 'jquery' ), VYBILDBANK_VERSION, true );

				// import VyBildbank plugin translations for JS file
				require_once( VYBILDBANK_PATH . 'l10n.php' );

				// localize a script
				wp_localize_script( 'vybildbank-no-gutenberg-admin-js', 'VyBildbankAdmin', array(
					'terms'   => VyBildbank_Api_Controller::albums_to_terms( VyBildbank_Api_Controller::list_all_albums() ),
					'usageComment' => get_option('vybildbank_options')['vybildbank_field_comment'],
					'ajaxUrl' => admin_url( 'admin-ajax.php' ),
					'l10n' => $l10n
				) );
			}
		}
	}
}

add_action( 'admin_enqueue_scripts', 'vybildbank_enqueue_script' );

// function add_my_media_button() {
//     echo '<a href="#" id="insert-my-media" class="button">Add my media</a>';
// }
// add_action('media_buttons', 'add_my_media_button');
