<?php
/**
 * Plugin Name: Localhost and Heredoc Fixture
 * Description: Warning-only fixture for localhost references and heredoc usage.
 * Version: 1.0.0
 * Author: Sant Limited
 * Text Domain: localhost-and-heredoc
 */

defined( 'ABSPATH' ) || exit;

function localhost_and_heredoc_fixture_url() {
	$api_url = 'http://localhost:8080/api';

	$template = <<<HTML
<div>Fixture</div>
HTML;

	return $api_url . $template;
}
