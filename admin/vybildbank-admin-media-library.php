<?php

/**
 * Ajax handler for VyBildbank attachments.
 *
 */
if ( ! function_exists( 'wp_ajax_vybildbank_query_attachments' ) ) {
	function wp_ajax_vybildbank_query_attachments() {
		// check user capabilities
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_send_json_error();
		}

		// user is searching
		if ( isset( $_REQUEST['query']['s'] ) ) {
			// get search query
			$search_string = sanitize_text_field($_REQUEST['query']['s']);

			// call API to search received query
			$response = VyBildbank_Api_Controller::search( $search_string ); // return only images

			// convert received images to the fake posts
			$posts = VyBildbank_Api_Controller::assets_to_posts( $response );

			// send images as fake posts
			wp_send_json_success( $posts );

			return;
		}

		// user select album
		if ( isset( $_REQUEST['query']['collection'] ) && $_REQUEST['query']['collection'] != 'all' ) {
			// get album id
			$album_id = (int)$_REQUEST['query']['collection'];

			// call API to get a content of the selected album
			$response = VyBildbank_Api_Controller::list_album( $album_id );

			$posts = [];
			// if received data contains albums, convert them to fake posts
			if ( isset( $response->albums ) ) {
				$posts = VyBildbank_Api_Controller::albums_to_posts( $response->albums, $posts );
			}
			// if received data contains albums, convert them to fake posts
			if ( isset( $response->assets ) ) {
				$posts = VyBildbank_Api_Controller::assets_to_posts( $response->assets, $posts );
			}

			// send images and/or albums as fake posts
			wp_send_json_success( $posts );

			return;
		}

		// user open VyBildbank media library

		// call API to get a content of all images
		$assets = VyBildbank_Api_Controller::list_assets();
		// from received images gets only images, that are not in any album
		$assets = VyBildbank_Api_Controller::filter_non_album_assets( $assets );

		// call API to get all albums
		$albums = VyBildbank_Api_Controller::list_all_albums();
		// from received albums gets only albums, that that are not in any album (not direct children)
		$albums = VyBildbank_Api_Controller::filter_non_parent_albums( $albums );

		// convert received albums to fake posts
		$posts = VyBildbank_Api_Controller::albums_to_posts( $albums );
		// convert received images to fake posts
		$posts = VyBildbank_Api_Controller::assets_to_posts( $assets, $posts );

		// send images and/or albums as fake posts
		wp_send_json_success( $posts );
	}
}
add_action( 'wp_ajax_vybildbank-query-attachments', 'wp_ajax_vybildbank_query_attachments' );

/**
 * Ajax handler for download VyBildbank asset.
 *
 */
if ( ! function_exists( 'wp_ajax_vybildbank_download_asset' ) ) {
	function wp_ajax_vybildbank_download_asset() {
		if ( ! isset($_REQUEST['selected_media']) && empty($_REQUEST['selected_media']) ) {
			//return; // TODO send error
            $error = new WP_Error( '001', 'Selected media not set.', '' );
            wp_send_json_error($error);
		}

		$posts_to_send = [];

		$selected_media = sanitize_array_of_array_as_text_field($_REQUEST['selected_media']);

		foreach($selected_media as $media) {
			$posts_query = [];

			// check if needed data received
			if ( ! isset( $media['id'] ) ||
				 ! isset( $media['filename'] ) ||
				 ! isset( $media['description'] ) ||
				 ! isset( $media['title'] )
			) {
				//return; // TODO send error
                $error = new WP_Error( '002', 'Missing file data.', '' );
                wp_send_json_error($error);
			}

			// save data received
			$image_id          = $media['id'];
			$image_filename    = $media['filename'];
			$image_title       = $media['title'];
			$image_description = $media['description'];
			// $image_tags 	   = $media['tags'];
			$usage_comment	   = isset( $media['usage_comment'] ) ? $media['usage_comment'] : "";
			$post_id           = isset( $_REQUEST['post_id'] ) ? (int)$_REQUEST['post_id'] : 0; // current editing post type

			$args = [
				'post_type' => 'attachment',
				's' => $image_title
			];

			$posts_query = get_posts($args);

			// download a file from API
			$image_bits = VyBildbank_Api_Controller::download( $image_id, $usage_comment );

			if (empty($posts_query)) {
				// save a file to the Wordpress
				$upload_file = wp_upload_bits( $image_filename, null, $image_bits );

				if ( $upload_file['error'] ) {
					// handle an error with uploading image
					//return; // TODO send error
                    $error = new WP_Error( '003', $upload_file['error'], '' );
                    wp_send_json_error($error);
				}

				// get the file type of the uploaded file.
				$image_file_type = wp_check_filetype( $image_filename );
				// get the file path of the uploaded file
				$image_file_path = $upload_file['file'];
				// get the extension of the uploaded file
				$imege_type      = $image_file_type['type'];
				// create metadata for new the uploaded file
				$attachment      = array(
					'post_mime_type' => $imege_type,
					'post_parent'    => 0,
					'post_title'     => $image_title,
					'post_content'   => $image_description, // key "post_content" in attachment means attachment's description
					'post_status'    => 'inherit'
				);

				// add_filter('wp_get_attachment_image_attributes', function($attr){
				// 	$attr['alt'] = "aaaazzzz";
				// 	return $attr;
				// });

				// insert the uploaded file to the Wordpress gallery
				$attachment_id   = wp_insert_attachment( $attachment, $image_file_path, $post_id );


				if ( is_wp_error( $attachment_id ) ) {
					// handle an error with inserting image
					//return; // TODO send error
                    $error = new WP_Error( '004', 'Cannot attach image.', '' );
                    wp_send_json_error($error);
				}

				// make sure that this file is included, as wp_generate_attachment_metadata() depends on it
				require_once( ABSPATH . "wp-admin" . '/includes/image.php' );

				// create variations for image and generate the metadata for image
				$attachment_data = wp_generate_attachment_metadata( $attachment_id, $image_file_path );

				update_post_meta( $attachment_id, '_wp_attachment_image_alt', $media["alt"] );

				// update metadata for image in Wordpress DB
				wp_update_attachment_metadata( $attachment_id, $attachment_data );

				// get new image as post
				// $query = new WP_Query( array( 'post_type' => 'attachment', 'p' => $attachment_id ) );
				$image = get_post($attachment_id);
				// $image->alt = "aaaaa";
				// $image->_wp_attachment_image_alt = "bbbb";
				// $image->post_excerpt = "ccc";
				// error_log("IMAAAAAAAGE " . print_r($image, true));
			}
			else {
				// $query = new WP_Query( array( 'post_type' => 'attachment', 'p' => $posts_query[0]->ID ) );
				$image = get_post($posts_query[0]->ID);
			}

			// Wordpress stuff
			$post = wp_prepare_attachment_for_js($image);
			$posts_to_send[] = $post;
		}

		// send new images as post
		wp_send_json_success( $posts_to_send );
	}

	function sanitize_array_of_array_as_text_field($arr)
	{
		$new_arr = [];

		foreach($arr as $key => $val) {
			if(!is_array($val)) {
				$new_arr[sanitize_text_field($key)] = sanitize_text_field($val);
			} else {
				$new_arr[sanitize_text_field($key)] = sanitize_array_of_array_as_text_field($val);
			}
		}

		return $new_arr;
	}
}
add_action( 'wp_ajax_vybildbank_download_asset', 'wp_ajax_vybildbank_download_asset' );
