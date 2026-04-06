<?php
/**
 * Uninstall script for Plugin Name
 *
 * This file runs when the plugin is deleted via the WordPress admin.
 * It should clean up all data created by the plugin.
 *
 * @package PluginName
 */

// Exit if not called by WordPress
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Clean up plugin data on uninstall.
 */

// Delete options
delete_option( 'plugin_name_settings' );
delete_option( 'plugin_name_version' );
delete_option( 'plugin_name_db_version' );

// Delete transients
delete_transient( 'plugin_name_cache' );

// Delete site transients (for multisite)
delete_site_transient( 'plugin_name_cache' );

// Clean up user meta (if any)
delete_metadata( 'user', 0, 'plugin_name_user_preferences', '', true );

// Clean up post meta (if any)
delete_metadata( 'post', 0, '_plugin_name_meta', '', true );

// Drop custom database tables (if any)
global $wpdb;

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
$table_name = $wpdb->prefix . 'plugin_name_data';
$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table_name ) );
// phpcs:enable

// Clear any scheduled cron events
$timestamp = wp_next_scheduled( 'plugin_name_cron_hook' );
if ( $timestamp ) {
	wp_unschedule_event( $timestamp, 'plugin_name_cron_hook' );
}

// Clear all scheduled events with this hook
wp_unschedule_hook( 'plugin_name_cron_hook' );

// Flush rewrite rules if plugin added custom rules
flush_rewrite_rules();
