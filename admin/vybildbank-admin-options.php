<?php

/**
 * top level menu
 */
if ( ! function_exists( 'vybildbank_options_page' ) ) {
	function vybildbank_options_page() {
		// add top level menu page
		add_options_page(
			__('Vy Bildbank', 'vybildbank'),
			__('Vy Bildbank', 'vybildbank'),
			'manage_options',
			'vybildbank-options',
			'vybildbank_options_page_html',
			VYBILDBANK_URL . 'assets/favicon.ico',
			100
		);
	}
}
add_action( 'admin_menu', 'vybildbank_options_page' );

if ( ! function_exists( 'vybildbank_settings_init' ) ) {
	function vybildbank_settings_init() {

		// register a new setting for "vybildbank" page
		register_setting( 'vybildbank', 'vybildbank_options' );

		// register a new section in the "vybildbank" page
		add_settings_section(
			'vybildbank_section_api_keys',
			__( 'API keys.', 'vybildbank' ),
			'vybildbank_section_api_keys_cb',
			'vybildbank'
		);

		// register a new section in the "vybildbank" page
		add_settings_section(
			'vybildbank_section_alt_text',
			__( 'Alt Text.', 'vybildbank' ),
			'vybildbank_section_alt_text_cb',
			'vybildbank'
		);

		// register a new section in the "vybildbank" page
		add_settings_section(
			'vybildbank_section_comment',
			__( 'Usage comment.', 'vybildbank' ),
			'vybildbank_section_comment_cb',
			'vybildbank'
		);

		// register a new field in the "vybildbank_section_api_keys_cb" section, inside the "vybildbank" page
		add_settings_field(
			'vybildbank_field_access_key',
			__( 'Access key', 'vybildbank' ),
			'vybildbank_field_access_key_cb',
			'vybildbank',
			'vybildbank_section_api_keys'
		);

		// register a new field in the "vybildbank_section_api_keys_cb" section, inside the "vybildbank" page
		add_settings_field(
			'vybildbank_field_secret_key',
			__( 'Secret key', 'vybildbank' ),
			'vybildbank_field_secret_key_cb',
			'vybildbank',
			'vybildbank_section_api_keys'
		);

		// register a new field in the "vybildbank_section_alt_text" section, inside the "vybildbank" page
		add_settings_field(
			'vybildbank_field_alt_text',
			__( 'Alt Text', 'vybildbank' ),
			'vybildbank_field_alt_text_cb',
			'vybildbank',
			'vybildbank_section_alt_text'
		);

		// register a new field in the "vybildbank_section_comment" section, inside the "vybildbank" page
		add_settings_field(
			'vybildbank_field_comment',
			__( 'Usage comment', 'vybildbank' ),
			'vybildbank_field_comment_cb',
			'vybildbank',
			'vybildbank_section_comment'
		);

	}
}
/**
 * register our vybildbank_settings_init to the admin_init action hook
 */
add_action( 'admin_init', 'vybildbank_settings_init' );

// section callback
if ( ! function_exists( 'vybildbank_section_api_keys_cb' ) ) {
	/**
	 * API Keys callback
	 *
	 * Section callbacks can accept an $args parameter, which is an array.
	 * $args have the following keys defined: title, id, callback.
	 * The values are defined at the add_settings_section() function.
	 *
	 * @param $args
	 */
	function vybildbank_section_api_keys_cb( $args ) {
		?>
        <p id="<?php echo esc_attr( $args['id'] ); ?>"><?php esc_html_e( 'Please inset your VyBildbank account API keys.', 'vybildbank' ); ?></p>
		<?php
	}
}

// section callback
if ( ! function_exists( 'vybildbank_section_comment_cb' ) ) {
	/**
	 * API Keys callback
	 *
	 * Section callbacks can accept an $args parameter, which is an array.
	 * $args have the following keys defined: title, id, callback.
	 * The values are defined at the add_settings_section() function.
	 *
	 * @param $args
	 */
	function vybildbank_section_comment_cb( $args ) {
		?>
        <p id="<?php echo esc_attr( $args['id'] ); ?>"><?php esc_html_e( 'Please check if you want be prompted when you downloading images.', 'vybildbank' ); ?></p>
		<?php
	}
}

// section callback
if ( ! function_exists( 'vybildbank_section_alt_text_cb' ) ) {
	function vybildbank_section_alt_text_cb( $args ) {
		?>
        <p id="<?php echo esc_attr( $args['id'] ); ?>"><?php esc_html_e( 'Select which field to use as alt text. Supported fields: title and tags', 'vybildbank' ); ?></p>
		<?php
	}
}

// section callback
if ( ! function_exists( 'vybildbank_field_access_key_cb' ) ) {
	function vybildbank_field_access_key_cb() {
		$options    = get_option( 'vybildbank_options' );
		$access_key = vybildbank_get_access_key( $options );
		// output the field
		?>
        <label for="vybildbank_access_key">
            <input type="text" name="vybildbank_options[vybildbank_field_access_key]" id="vybildbank_access_key"
                   value="<?php echo isset( $access_key ) ? esc_attr($access_key) : '' ?>" size="50">
        </label>
		<?php
	}
}

// section callback
if ( ! function_exists( 'vybildbank_field_secret_key_cb' ) ) {
	function vybildbank_field_secret_key_cb() {
		$options    = get_option( 'vybildbank_options' );
		$secret_key = vybildbank_get_secret_key( $options );
		// output the field
		?>
        <label for="vybildbank_secret_key">
            <input type="password" name="vybildbank_options[vybildbank_field_secret_key]" id="vybildbank_secret_key"
                   value="<?php echo isset( $secret_key ) ? esc_attr($secret_key) : '' ?>" size="50">
        </label>
		<?php
	}
}

// section callback
if ( ! function_exists( 'vybildbank_field_alt_text_cb' ) ) {
	function vybildbank_field_alt_text_cb() {
		$options    = get_option( 'vybildbank_options' );
		$alt_text = vybildbank_get_alt_text( $options );
		// output the field
		?>
        <label for="vybildbank_alt_text">
            <input type="text" name="vybildbank_options[vybildbank_field_alt_text]" id="vybildbank_alt_text"
                   value="<?php echo isset( $alt_text ) ? esc_attr($alt_text) : '' ?>" size="50">
        </label>
		<?php
	}
}

// section callback
if ( ! function_exists( 'vybildbank_field_comment_cb' ) ) {
	function vybildbank_field_comment_cb() {
		$options        = get_option( 'vybildbank_options' );
		$option_comment = null;
		if ( isset( $options ) && isset( $options['vybildbank_field_comment'] ) ) {
			$option_comment = $options['vybildbank_field_comment'];
		}
		// output the field
		?>
        <label for="vybildbank_comment">
            <input type="checkbox" name="vybildbank_options[vybildbank_field_comment]" id="vybildbank_comment"
				<?php echo vybildbank_is_comment_active( esc_attr($option_comment) ) ? 'checked' : '' ?>>
			<?php echo __( 'Active', 'vybildbank' ) ?>
            <p class="description" style="max-width: 350px;">
				<?php esc_html_e( 'Some organizations want to track where the images are used. With Usage comment the user is forced to add a message on download, .e.g. “front page”. An alternative would be to add a meta field to all media assets keeping track of the id in the image bank, and every time an image is inserted in a page – a request with the page title is sent to the API.', 'vybildbank' ); ?>
            </p>
        </label>
		<?php
	}
}

// render option page
if ( ! function_exists( 'vybildbank_options_page_html' ) ) {
	function vybildbank_options_page_html() {
		// check user capabilities
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// check if the user have submitted the settings
		// wordpress will add the "settings-updated" $_GET parameter to the url
		if ( isset( $_GET['settings-updated'] ) ) {
			// add settings saved message with the class of "updated"
			settings_errors( 'general' );
		}

		// show error/update messages
		settings_errors( 'vybildbank_messages' );
		?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form action="options.php" method="post">
				<?php
				// output fields for the registered setting "vybildbank"
				settings_fields( 'vybildbank' );
				// output setting sections and their fields
				// (sections are registered for "vybildbank", each field is registered to a specific section)
				do_settings_sections( 'vybildbank' );
				// output save settings button
				submit_button( 'Save Settings' );
				?>
            </form>
        </div>
		<?php
	}
}

// validation of API keys before save
if ( ! function_exists( 'vybildbank_pre_update_option' ) ) {
	function vybildbank_pre_update_option( $value, $old_value ) {
		// get old API keys
		$old_value_access_key = $old_value['vybildbank_field_access_key'];
		$old_value_secret_key = $old_value['vybildbank_field_secret_key'];

		// get new API keys
		$new_value_access_key = $value['vybildbank_field_access_key'];
		$new_value_secret_key = $value['vybildbank_field_secret_key'];

		// Alt text field
		$new_value_alt_text = $value['vybildbank_field_alt_text'];

		// compare old and new API keys
		$is_changed_access_key = $old_value_access_key != $new_value_access_key;
		$is_changed_secret_key = $old_value_secret_key != $new_value_secret_key;

		// API keys not changed, return old API keys
		if ( ! $is_changed_access_key && ! $is_changed_secret_key ) {
			return $value;
		}

		// API keys changed

		// validation of API keys
		$keys_valid = VyBildbank_Api_Controller::valid_api_keys( $new_value_access_key, $new_value_secret_key );

		if ( ! $keys_valid ) {
			// API keys are invalid

			// show error messages
			add_settings_error(
				'vybildbank_messages',
				'vybildbank_message',
				__( "Invalid api keys!", 'vybildbank' ),
				'error'
			);

			// not change API keys
			$value['vybildbank_field_access_key'] = $old_value_access_key;
			$value['vybildbank_field_secret_key'] = $old_value_secret_key;
		} else {
			// API keys are valid

			// set new API keys to controller
			VyBildbank_Api_Controller::set_access_key( $new_value_access_key );
			VyBildbank_Api_Controller::set_secret_key( $new_value_secret_key );
		}

		// return API keys
		return $value;

	}
}
add_action( 'pre_update_option_vybildbank_options', 'vybildbank_pre_update_option', 10, 3 );

if ( ! function_exists( 'vybildbank_is_comment_active' ) ) {
	/**
	 * Check if is comment active.
	 *
	 * @param string $option_comment The comment value from options.
	 *
	 * @return bool Comment active state.
	 */
	function vybildbank_is_comment_active( $option_comment ) {
		return isset( $option_comment ) && $option_comment === 'on';
	}
}

if ( ! function_exists( 'vybildbank_get_comment' ) ) {
	/**
	 * @param array $options The options values.
	 *
	 * @return string The comment value from options.
	 */
	function vybildbank_get_comment( $options = null ) {

		if ( $options === null ) {
			$options = get_option( 'vybildbank_options' );
		}

		$option_comment = null;
		if ( isset( $options ) && isset( $options['vybildbank_field_comment'] ) ) {
			$option_comment = $options['vybildbank_field_comment'];
		}

		return $option_comment;
	}
}

if ( ! function_exists( 'vybildbank_get_access_key' ) ) {
	/**
	 * @param array $options The options values.
	 *
	 * @return string The access key value from options.
	 */
	function vybildbank_get_access_key( $options = null ) {

		if ( $options === null ) {
			$options = get_option( 'vybildbank_options' );
		}

		$access_key = null;
		if ( isset( $options ) && isset( $options['vybildbank_field_access_key'] ) ) {
			$access_key = $options['vybildbank_field_access_key'];
		}

		return $access_key;
	}
}

if ( ! function_exists( 'vybildbank_get_secret_key' ) ) {
	/**
	 * @param array $options The options values.
	 *
	 * @return string The secret key value from options.
	 */
	function vybildbank_get_secret_key( $options = null ) {

		if ( $options === null ) {
			$options = get_option( 'vybildbank_options' );
		}

		$secret_key = null;
		if ( isset( $options ) && isset( $options['vybildbank_field_secret_key'] ) ) {
			$secret_key = $options['vybildbank_field_secret_key'];
		}

		return $secret_key;
	}
}

if ( ! function_exists( 'vybildbank_get_alt_text' ) ) {
	/**
	 * @param array $options The options values.
	 *
	 * @return string The secret key value from options.
	 */
	function vybildbank_get_alt_text( $options = null ) {

		if ( $options === null ) {
			$options = get_option( 'vybildbank_options' );
		}

		$alt_text = null;
		if ( isset( $options ) && isset( $options['vybildbank_field_alt_text'] ) ) {
			$alt_text = $options['vybildbank_field_alt_text'];
		}

		return $alt_text;
	}
}
