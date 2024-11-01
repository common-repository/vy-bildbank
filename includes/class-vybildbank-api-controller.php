<?php

if ( ! class_exists( 'VyBildbank_Api_Controller' ) ) {
	/**
	 * Class that works with VyBildbank API
	 *
	 */
	class VyBildbank_Api_Controller {

		// API parameters
		const PARAMETER_ACCESS_KEY = "access_key";
		const PARAMETER_ALBUM_ID = "album_id";
		const PARAMETER_IMAGE_ID = "image_id";
		const PARAMETER_SEARCH_STRING = "search_string";
		const PARAMETER_SECRET_KEY = "secret_key";
		const PARAMETER_SIGNATURE = "signature";
		const PARAMETER_TIMESTAMP = "timestamp";
		const PARAMETER_USAGE_COMMENT = "usage_comment";
		const PARAMETER_VALUE_ORIGINAL = "original";
		const PARAMETER_VARIANT = "variant";
		const PARAMETER_PLATFORM = "platform";

		// API URL
		const BASE_URL = "https://bildbank.se";
		const API_URL = "/api-v1/";
		const URL = self::BASE_URL . self::API_URL;

		// API endpoints
		const ENDPOINT_DOWNLOAD = "download";
		const ENDPOINT_LIST_ALBUM = "list-album";
		const ENDPOINT_LIST_ALL_ALBUMS = "list-all-albums";
		const ENDPOINT_LIST_ASSETS = "list-assets";
		const ENDPOINT_PREVIEW = "preview";
		const ENDPOINT_SEARCH = "search";
		const ENDPOINT_VALIDATE_API_KEYS = "validate-api-keys";

		// API keys
		private static $access_key;
		private static $secret_key;
		private static $alt_text_field;
		// private static $alt_text_field;

		/**
		 * Get the access key.
		 *
		 * @return string The access key.
		 */
		public static function get_access_key() {
			if ( self::$access_key == null ) {
				self::$access_key = vybildbank_get_access_key();
			}

			return self::$access_key;
		}

		/**
		 * Set the access key.
		 *
		 * @param string $access_key The access key to set.
		 */
		public static function set_access_key( $access_key ) {
			self::$access_key = $access_key;
		}

		/**
		 * Get the secret key.
		 *
		 * @return string The secret key.
		 */
		public static function get_secret_key() {
			if ( self::$secret_key == null ) {
				self::$secret_key = vybildbank_get_secret_key();
			}

			return self::$secret_key;
		}

		/**
		 * Set the secret key.
		 *
		 * @param string $secret_key The secret key to set.
		 */
		public static function set_secret_key( $secret_key ) {
			self::$secret_key = $secret_key;
		}

		/**
		 * Get the alt text field name.
		 *
		 * @return string The alt text field name.
		 */
		public static function get_alt_text_field() {
			if ( self::$alt_text_field == null ) {
				self::$alt_text_field = vybildbank_get_alt_text();
			}

			return self::$alt_text_field;
		}

		/**
		 * Create HTTP/HTTPS request for API call.
		 *
		 * @param string $endpoint The name of the endpoint.
		 * @param array $parameters The parameters for request.
		 * @param bool $json_decode Boolean, if send a json decoded data from response. Default true. (Note: not all endpoints return json data, e. g. download)
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received. Raw data, if json decode is disabled. Array of received data, if json decode is enabled.
		 */
		public static function get_request( $endpoint, $parameters, $json_decode = true ) {
			// build URL for request
			$GET_URL = self::get_url( $endpoint, $parameters );
			// call WP function for get request
			$response = wp_remote_get( $GET_URL, [
				'timeout' => 30, // TODO optimize timeout for request
			] );

			// if invalid data received
			if ( ! is_array( $response ) ) {
				return false;
			}

			// get body from response
			$body = wp_remote_retrieve_body( $response );

			if ( $json_decode ) {
				// json decode body response
				return json_decode( $body );
			} else {
				// raw body data
				return $body;
			}
		}

		/**
		 * Get URL from endpoint and parameters.
		 *
		 * @param string $endpoint The endpoint
		 * @param array $parameters The parameters
		 *
		 * @return string The URL
		 */
		public static function get_url( $endpoint, $parameters ) {
			return self::URL . $endpoint . "?" . http_build_query( $parameters );
		}

		/**
		 * Create signature for API call (detail info in the API docs).
		 *
		 * @param string $endpoint The name of the endpoint.
		 * @param array $parameters The parameters to add to the request.
		 * @param string $secret_key The secret key.
		 *
		 * @return string The signature for API request.
		 */
		public static function create_signature( $endpoint, $parameters, $secret_key ) {
			$parameters_for_signature               = $parameters;
			$parameters_for_signature["secret_key"] = $secret_key;

			// sort parameters by key.
			ksort( $parameters_for_signature );

			// build the initial parameter string
			$parameter_string = $endpoint . ",";

			// append key and value to the initial parameter string
			foreach ( $parameters_for_signature as $key => $value ) {
				$parameter_string .= "$key=$value,";
			}

			// get signature from parameter string
			return hash( "sha256", substr( $parameter_string, 0, - 1 ) );
		}

		/**
		 * Check if the response is success.
		 *
		 * @param object $response The response.
		 *
		 * @return bool True, if data response is success, otherwise false.
		 */
		public static function is_response_success( $response ) {
			return isset( $response->status ) && $response->status == "success";
		}

		/**
		 * download endpoint (GET method)
		 *
		 * Download a file.
		 *
		 * @param string $image_id The image id
		 * @param string $usage_comment The usage comment. Default empty string, that will by not appended as parameter.
		 * @param string $variant Variant of the image. Default is original variant.
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received, otherwise response data.
		 */
		public static function download( $image_id, $usage_comment = '', $variant = self::PARAMETER_VALUE_ORIGINAL ) {
			$parameters = [
				self::PARAMETER_ACCESS_KEY => self::get_access_key(),
				self::PARAMETER_IMAGE_ID   => $image_id,
				self::PARAMETER_TIMESTAMP  => time(),
				self::PARAMETER_VARIANT    => $variant,
			];

			if (!self::is_valid_variant($variant)) {
				http_response_code(7001);
			}

			// append comment to the parameters, if some comment is received as parameter.
			if ( $usage_comment != '' ) {
				$parameters[ self::PARAMETER_USAGE_COMMENT ] = $usage_comment;
			}

			$endpoint = self::ENDPOINT_DOWNLOAD;
			// create signature and append as parameter
			$parameters[ self::PARAMETER_SIGNATURE ] = self::create_signature( $endpoint, $parameters, self::get_secret_key() );

			$response = self::get_request( $endpoint, $parameters, false );

			return $response;
		}

		/**
		 * Check if variant is valid
		 *
		 * @param string $variant
		 * @return boolean
		 */
		public static function is_valid_variant($variant) {
			return $variant == "original" || $variant == "lowres" || $variant == "highres";
		}

		/**
		 * list-assets endpoint (GET method)
		 *
		 * Get lists all assets the user has access to.
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received, otherwise response data.
		 */
		public static function list_assets() {
			$parameters = [
				self::PARAMETER_ACCESS_KEY => self::get_access_key(),
				self::PARAMETER_TIMESTAMP  => time(),
			];

			$endpoint = self::ENDPOINT_LIST_ASSETS;
			// create signature and append as parameter
			$parameters[ self::PARAMETER_SIGNATURE ] = self::create_signature( $endpoint, $parameters, self::get_secret_key() );

			$response = self::get_request( $endpoint, $parameters );

			return $response;
		}

		/**
		 * list-all-albums endpoint (GET method)
		 *
		 * Lists all albums the user has access to.
		 *
		 * @param bool $albums_only True, if return albums only, otherwise false.
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received, otherwise response data.
		 */
		public static function list_all_albums( $albums_only = true ) {
			$parameters = [
				self::PARAMETER_ACCESS_KEY => self::get_access_key(),
				self::PARAMETER_TIMESTAMP  => time(),
			];

			$endpoint = self::ENDPOINT_LIST_ALL_ALBUMS;
			// create signature and append as parameter
			$parameters[ self::PARAMETER_SIGNATURE ] = self::create_signature( $endpoint, $parameters, self::get_secret_key() );

			$response = self::get_request( $endpoint, $parameters );

			if ( self::is_response_success( $response ) ) {
				if ( $albums_only ) {
					$albums = $response->albums;

					return $albums;
				} else {
					return $response;
				}
			} else {
				return false;
			}
		}

		/**
		 * list-album endpoint (GET method)
		 *
		 * Lists all assets and child albums (direct children) of an album.
		 *
		 * @param string $album_id The album id.
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received, otherwise response data.
		 */
		public static function list_album( $album_id ) {
			$parameters = [
				self::PARAMETER_ACCESS_KEY => self::get_access_key(),
				self::PARAMETER_ALBUM_ID   => $album_id,
				self::PARAMETER_TIMESTAMP  => time(),
			];

			$endpoint = self::ENDPOINT_LIST_ALBUM;
			// create signature and append as parameter
			$parameters[ self::PARAMETER_SIGNATURE ] = self::create_signature( $endpoint, $parameters, self::get_secret_key() );

			$response = self::get_request( $endpoint, $parameters );

			if ( self::is_response_success( $response ) ) {
				return $response;
			} else {
				return false;
			}
		}

		/**
		 * preview endpoint (GET method)
		 *
		 * Returns a thumbnail image of an asset in the size “preview-small”. For assets that does not have a thumbnail a file icon corresponding to the file format is returned.
		 *
		 * @param string $image_id The image ID.
		 * @param bool $return_url True if return url to preview, otherwise return raw data.
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received, otherwise response data or image preview URL.
		 */
		public static function preview( $image_id, $return_url = true ) {
			$parameters = [
				self::PARAMETER_ACCESS_KEY => self::get_access_key(),
				self::PARAMETER_IMAGE_ID   => $image_id,
				self::PARAMETER_TIMESTAMP  => time(),
			];

			$endpoint = self::ENDPOINT_PREVIEW;
			// create signature and append as parameter
			$parameters[ self::PARAMETER_SIGNATURE ] = self::create_signature( $endpoint, $parameters, self::get_secret_key() );

			if ( $return_url ) {
				return self::get_url( $endpoint, $parameters );
			} else {
				$response = self::get_request( $endpoint, $parameters, false );

				return $response;
			}
		}

		/**
		 * search endpoint (GET method)
		 *
		 * Searches for assets.
		 *
		 * @param string $search_string The search query.
		 * @param bool $search_only True, if return search results, otherwise false.
		 *
		 * @return array|bool|mixed|object|string False, if invalid data received, otherwise response data.
		 */
		public static function search( $search_string, $search_only = true ) {
			$parameters = [
				self::PARAMETER_ACCESS_KEY    => self::get_access_key(),
				self::PARAMETER_SEARCH_STRING => $search_string,
				self::PARAMETER_TIMESTAMP     => time(),
			];

			$endpoint = self::ENDPOINT_SEARCH;
			// create signature and append as parameter
			$parameters[ self::PARAMETER_SIGNATURE ] = self::create_signature( $endpoint, $parameters, self::get_secret_key() );

			$response = self::get_request( $endpoint, $parameters );

			if ( self::is_response_success( $response ) ) {
				if ( $search_only ) {
					$search_result = $response->search_result;

					return $search_result;
				} else {
					return $response;
				}
			} else {
				return false;
			}
		}

		/**
		 * validate-api-keys endpoint (GET method)
		 *
		 * Checks if API keys are valid. Should be called everytime the user changes the access or secret key.
		 *
		 * @param string $access_key The secret key.
		 * @param string $secret_key the access key.
		 *
		 * @return bool True, if API keys are valid, otherwise false.
		 */
		public static function valid_api_keys( $access_key, $secret_key ) {
			$parameters = [
				self::PARAMETER_ACCESS_KEY => $access_key,
				self::PARAMETER_SECRET_KEY => $secret_key,
				self::PARAMETER_PLATFORM => "wordpress"
			];

			$response = self::get_request( self::ENDPOINT_VALIDATE_API_KEYS, $parameters );

			$is_response_valid = self::is_response_success( $response );

			return $is_response_valid;
		}

		/**
		 * From albums filer albums, that are not in any album (not direct children).
		 *
		 * @param object $albums The albums to filter.
		 *
		 * @return array The filtered albums.
		 */
		public static function filter_non_parent_albums( $albums ) {
			return array_filter( $albums, array( self::class, "callback_non_parent_albums" ), ARRAY_FILTER_USE_BOTH );
		}

		/**
		 * Callback for filter_non_parent_albums function.
		 *
		 * @param object $album The album to filer.
		 *
		 * @return bool True, if album does not have parent album, otherwise false.
		 */
		public static function callback_non_parent_albums( $album ) {
			return $album->parent == "0";
		}

		/**
		 * From assets filer assets, that are not in any album
		 *
		 * @param object $assets The assets to filter.
		 *
		 * @return array The filtered assets.
		 */
		public static function filter_non_album_assets( $assets ) {
			return array_filter( $assets, array( self::class, "callback_non_album_assets" ), ARRAY_FILTER_USE_BOTH );
		}

		/**
		 * Callback for filter_non_album_assets function.
		 *
		 * @param object $asset The asset to filter.
		 *
		 * @return bool True, if assets does not in any album, otherwise false.
		 */
		public static function callback_non_album_assets( $asset ) {
			return $asset->album_id == '';
		}

		/**
		 * Convert a albums to the fake WP posts.
		 *
		 * @param object $albums The albums to convert.
		 * @param array $posts The exist array of WP posts. Default empty array.
		 *
		 * @return array The array of converted albums to the fake WP posts.
		 */
		public static function albums_to_posts( $albums, $posts = [] ) {
			foreach ( $albums as $album ) {
				$post = self::album_to_post( $album );
				array_push( $posts, $post );
			}

			return $posts;
		}

		/**
		 * Convert a albums to the fake WP terms.
		 *
		 * @param object $albums The albums to convert
		 * @param array $terms The exist array of WP terms. Default empty array.
		 *
		 * @return array The array of converted albums to the fake WP terms.
		 */
		public static function albums_to_terms( $albums, $terms = [] ) {
            if (is_array($albums) && $albums instanceof \Traversable) {
                foreach ($albums as $album) {
                    $post = self::album_to_term($album);
                    array_push($terms, $post);
                }
            }

			return $terms;
		}

		/**
		 * Convert a assets to the fake WP posts.
		 *
		 * @param object $assets The assets to convert.
		 * @param array $posts The exist array of WP posts. Default empty array.
		 *
		 * @return array The array of converted assets to the fake WP posts.
		 */
		public static function assets_to_posts( $assets, $posts = [] ) {
			foreach ( $assets as $asset ) {
				$post = self::asset_to_post( $asset );
				array_push( $posts, $post );
			}

			return $posts;
		}

		/**
		 * Convert a single asset to the fake WP post.
		 *
		 * @param object $album The album to convert.
		 *
		 * @return array The fake post.
		 */
		public static function album_to_post( $album ) {
			$post = [
				'id'       => $album->album_id,
				'title'    => $album->album_name,
				'alt'      => $album->album_name,
				'filename' => $album->album_name,
				'mime'     => 'text/directory',
				'type'     => 'text',
				'status'   => 'inherit',
				'icon'     => VYBILDBANK_FOLDER_IMAGE,
				'isAlbum'  => true,
			];

			// if exist date in album, append also date to the fake WP post
			if ( isset( $album->album_date ) ) {
				$date_time        = new DateTime( $album->album_date );
				$timestamp        = $date_time->getTimestamp();
				$post['date']     = $timestamp;
				$post['modified'] = $timestamp;
			}

			return $post;
		}

		/**
		 * Convert a single album to the fake WP term.
		 *
		 * @param object $album The album to convert.
		 *
		 * @return array The fake term.
		 */
		public static function album_to_term( $album ) {
			$term = [
				'term_id'          => $album->album_id,
				'name'             => $album->album_name,
				'slug'             => $album->album_id,
				'term_group'       => $album->group_id,
				'term_taxonomy_id' => $album->album_id,
				'taxonomy'         => 'media_folder',
				'description'      => "",
				'parent'           => $album->parent,
				'count'            => $album->num,
				'filter'           => "raw",
			];

			return $term;
		}

		public static function asset_to_post( $asset ) {
			if ( self::is_asset_image( $asset ) ) { // asset is image
				return self::image_to_post( $asset );
			} else {  // asset is some file
				return self::file_to_post( $asset );
			}
		}

		/**
		 * Convert a single image (asset) to the fake WP post.
		 *
		 * @param object $asset The asset to convert.
		 *
		 * @return array The fake post.
		 */
		public static function image_to_post( $asset ) {
			$date_time = new DateTime( $asset->created );
			$timestamp = $date_time->getTimestamp();
			$url       = self::preview( $asset->id );
			$alt_text_field = self::get_alt_text_field();


			$post      = [
				'id'              => $asset->id,
				'title'           => $asset->title,
				'alt'             => isset($asset->$alt_text_field) ? $asset->$alt_text_field : $asset->title,
				// '_wp_attachment_image_alt'             => isset($asset->$alt_text_field) ? $asset->$alt_text_field : $asset->title,
				'filename'        => $asset->original_filename,
				'url'             => $url,
				// 'caption'         => str_replace(",", ", ", $asset->tags),
				'description'     => $asset->description,
				'mime'            => $asset->mime_type,
				'width'           => (int) $asset->original_width,
				'height'          => (int) $asset->original_height,
				'filesizeInBytes' => (int) $asset->original_size,
				'type'            => self::get_type_from_mime( $asset->mime_type ),
				'status'          => 'inherit',
				'date'            => $timestamp,
				'modified'        => $timestamp,
				'sizes'           => [
					'full' => [
						'url'         => $url,
						'width'       => (int) $asset->original_width,
						'height'      => (int) $asset->original_height,
						'orientation' => 'landscape',
					],
				],
				'isVyBildbank'    => true,
			];

			return $post;
		}

		/**
		 * Convert a single file (asset) to the fake WP post.
		 *
		 * @param object $asset The asset to convert.
		 *
		 * @return array The fake post.
		 */
		public static function file_to_post( $asset ) {
			$date_time = new DateTime( $asset->created );
			$timestamp = $date_time->getTimestamp();
			$url       = self::get_absolute_url( $asset->url );
			$alt_text_field = self::get_alt_text_field();

			$post      = [
				'id'              => $asset->id,
				'title'           => $asset->title,
				'alt'             => isset($asset->$alt_text_field) ? $asset->$alt_text_field : $asset->title,
				'filename'        => $asset->original_filename,
				'url'             => $url,
				'description'     => $asset->description,
				'mime'            => $asset->mime_type,
				'filesizeInBytes' => (int) $asset->original_size,
				'type'            => self::get_type_from_mime( $asset->mime_type ),
				'status'          => 'inherit',
				'date'            => $timestamp,
				'modified'        => $timestamp,
				'icon'            => VYBILDBANK_FILE_IMAGE,
			];

			return $post;
		}

		/**
		 * Check if asset is image.
		 *
		 * @param object $asset The asset to check.
		 *
		 * @return bool True if asset is image, otherwise, false.
		 */
		public static function is_asset_image( $asset ) {
			$format = $asset->original_file_ending;

			return $format == 'jpg' || $format == 'png' || $format == 'gif';
		}

		/**
		 * Get type from mime.
		 *
		 * @param string $mime The mime.
		 *
		 * @return string The type.
		 */
		public static function get_type_from_mime( $mime ) {
			return explode( '/', $mime )[0];
		}

		/**
		 * Convert asset URL to absolute path.
		 *
		 * @param string $url The asset URL.
		 *
		 * @return string The absolute URL of asset.
		 */
		public static function get_absolute_url( $url ) {
			if ( filter_var( $url, FILTER_VALIDATE_URL ) ) { // already is relative URL link
				return $url;
			} else {
				return self::BASE_URL . $url;
			}
		}

	}
}
