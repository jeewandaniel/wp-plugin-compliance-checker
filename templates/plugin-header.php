<?php
/**
 * Plugin Name:       My Plugin Name
 * Plugin URI:        https://example.com/my-plugin
 * Description:       Brief description of what the plugin does. Not generic text.
 * Version:           1.0.0
 * Author:            Your Name
 * Author URI:        https://example.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-plugin-name
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      7.4
 *
 * @package MyPluginName
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin version constant
define( 'MY_PLUGIN_NAME_VERSION', '1.0.0' );

// Plugin directory path
define( 'MY_PLUGIN_NAME_PATH', plugin_dir_path( __FILE__ ) );

// Plugin directory URL
define( 'MY_PLUGIN_NAME_URL', plugin_dir_url( __FILE__ ) );

// Plugin basename
define( 'MY_PLUGIN_NAME_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Load plugin textdomain for translations.
 *
 * Note: For WordPress.org hosted plugins, this is often not necessary
 * as WordPress handles translations automatically. Consider omitting
 * if you're only distributing via WordPress.org.
 */
function my_plugin_name_load_textdomain() {
	load_plugin_textdomain(
		'my-plugin-name',
		false,
		dirname( MY_PLUGIN_NAME_BASENAME ) . '/languages'
	);
}
add_action( 'init', 'my_plugin_name_load_textdomain' );

/**
 * Plugin activation hook.
 */
function my_plugin_name_activate() {
	// Set default options
	if ( false === get_option( 'my_plugin_name_settings' ) ) {
		add_option( 'my_plugin_name_settings', array(
			'option_one' => 'default_value',
		) );
	}

	// Store version for future upgrades
	update_option( 'my_plugin_name_version', MY_PLUGIN_NAME_VERSION );

	// Flush rewrite rules if needed
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'my_plugin_name_activate' );

/**
 * Plugin deactivation hook.
 */
function my_plugin_name_deactivate() {
	// Clear scheduled events
	wp_clear_scheduled_hook( 'my_plugin_name_cron_hook' );

	// Flush rewrite rules
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'my_plugin_name_deactivate' );

/**
 * Initialize the plugin.
 */
function my_plugin_name_init() {
	// Load required files
	require_once MY_PLUGIN_NAME_PATH . 'includes/class-admin.php';
	require_once MY_PLUGIN_NAME_PATH . 'includes/class-public.php';

	// Initialize classes
	if ( is_admin() ) {
		new My_Plugin_Name_Admin();
	}
	new My_Plugin_Name_Public();
}
add_action( 'plugins_loaded', 'my_plugin_name_init' );

/**
 * Enqueue admin styles and scripts.
 *
 * @param string $hook The current admin page hook.
 */
function my_plugin_name_admin_enqueue( $hook ) {
	// Only load on plugin pages
	if ( 'settings_page_my-plugin-name' !== $hook ) {
		return;
	}

	wp_enqueue_style(
		'my-plugin-name-admin',
		MY_PLUGIN_NAME_URL . 'admin/css/admin.css',
		array(),
		MY_PLUGIN_NAME_VERSION
	);

	wp_enqueue_script(
		'my-plugin-name-admin',
		MY_PLUGIN_NAME_URL . 'admin/js/admin.js',
		array( 'jquery' ),
		MY_PLUGIN_NAME_VERSION,
		true
	);

	wp_localize_script(
		'my-plugin-name-admin',
		'myPluginNameAdmin',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'my_plugin_name_nonce' ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'my_plugin_name_admin_enqueue' );

/**
 * Enqueue frontend styles and scripts.
 */
function my_plugin_name_public_enqueue() {
	wp_enqueue_style(
		'my-plugin-name-public',
		MY_PLUGIN_NAME_URL . 'public/css/public.css',
		array(),
		MY_PLUGIN_NAME_VERSION
	);

	wp_enqueue_script(
		'my-plugin-name-public',
		MY_PLUGIN_NAME_URL . 'public/js/public.js',
		array(),
		MY_PLUGIN_NAME_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'my_plugin_name_public_enqueue' );
