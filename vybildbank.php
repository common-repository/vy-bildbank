<?php
/**
 * Plugin Name: Vy Bildbank
 * Plugin URI:  https://bildbank.se/sv/support/wordpress
 * Description: Access your media assets from the cloud service <strong>Vy Bildbank</strong>.
 * Version:     1.0
 * Author:      Vy Bildbank
 * Author URI:  https://bildbank.se
 * License:     GPL2
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: vybildbank
 * Domain Path: /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// define the plugin version
if ( ! defined( 'VYBILDBANK_VERSION' ) ) {
	define( 'VYBILDBANK_VERSION', '0.2' );
}

// define the filesystem directory path (with trailing slash) for the plugin
if ( ! defined( 'VYBILDBANK_PATH' ) ) {
	define( 'VYBILDBANK_PATH', plugin_dir_path( __FILE__ ) );
}

// define the URL directory path (with trailing slash) for the plugin
if ( ! defined( 'VYBILDBANK_URL' ) ) {
	define( 'VYBILDBANK_URL', plugin_dir_url( __FILE__ ) );
}

// define the filesystem directory path (with trailing slash) for the folder image
if ( ! defined( 'VYBILDBANK_FOLDER_IMAGE' ) ) {
	define( 'VYBILDBANK_FOLDER_IMAGE', plugin_dir_url( __FILE__ ) . "assets/folder.png" );
}

// define the filesystem directory path (with trailing slash) for the file image
if ( ! defined( 'VYBILDBANK_FILE_IMAGE' ) ) {
	define( 'VYBILDBANK_FILE_IMAGE', plugin_dir_url( __FILE__ ) . "assets/file.png" );
}

// include admin additional functionality
require_once( VYBILDBANK_PATH . 'admin/vybildbank-admin.php' );

// include API controller functionality
require_once( VYBILDBANK_PATH . 'includes/class-vybildbank-api-controller.php' );

// handle uninstalling plugin
if ( ! function_exists( 'vybildbank_uninstall' ) ) {
	function vybildbank_uninstall() {
		// Silence is golden.
	}
}

register_uninstall_hook( __FILE__, 'vybildbank_uninstall' );

// handle activating plugin
if ( ! function_exists( 'vybildbank_activation' ) ) {
	function vybildbank_activation() {
		// Silence is golden.
	}
}

register_activation_hook( __FILE__, 'vybildbank_activation' );

// handle deactivating plugin
if ( ! function_exists( 'vybildbank_deactivation' ) ) {
	function vybildbank_deactivation() {
		// Silence is golden.
	}
}

register_deactivation_hook( __FILE__, 'vybildbank_deactivation' );
