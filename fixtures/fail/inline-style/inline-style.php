<?php
/**
 * Plugin Name: Inline Style Fixture
 * Description: Failing fixture for inline style detection.
 * Version: 1.0.0
 * Author: Sant Limited
 * Text Domain: inline-style-fixture
 */

defined( 'ABSPATH' ) || exit;

function inline_style_fixture_render() {
	echo '<style>.fixture{color:red;}</style>';
}
