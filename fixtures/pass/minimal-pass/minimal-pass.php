<?php
/**
 * Plugin Name: Minimal Pass Plugin
 * Description: A tiny fixture plugin that should pass the currently executable heuristic rules.
 * Version: 1.0.0
 * Author: Sant Limited
 * Text Domain: minimal-pass
 */

defined( 'ABSPATH' ) || exit;

function minimalpass_render_message( $message ) {
	echo esc_html( $message );
}
