<?php
/**
 * Plugin Name: Vendor False Positive Test
 * Version: 1.0.0
 * Description: Tests that .wpignore correctly excludes vendor directories
 */

if (!defined('ABSPATH')) {
    exit;
}

// Clean plugin code - no issues here
function vfp_init() {
    add_action('admin_menu', 'vfp_add_menu');
}
add_action('init', 'vfp_init');

function vfp_add_menu() {
    add_options_page(
        'Test Settings',
        'Test',
        'manage_options',
        'vfp-settings',
        'vfp_settings_page'
    );
}

function vfp_settings_page() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    echo '<div class="wrap"><h1>Settings</h1></div>';
}
