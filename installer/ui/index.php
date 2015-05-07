<?php

################################################################################
# UTILITY FUNCTIONS
################################################################################

/**
 * Parses a user agent string into its important parts
 *
 * @author Jesse G. Donat <donatj@gmail.com>
 * @link https://github.com/donatj/PhpUserAgent
 * @link http://donatstudios.com/PHP-Parser-HTTP_USER_AGENT
 * @param string|null $u_agent User agent string to parse or null. Uses $_SERVER['HTTP_USER_AGENT'] on NULL
 * @return array an array with browser, version and platform keys
 */
function parse_user_agent( $u_agent = null ) {
	if( is_null($u_agent) ) {
		if(isset($_SERVER['HTTP_USER_AGENT'])) {
			$u_agent = $_SERVER['HTTP_USER_AGENT'];
		}else{
			throw new \InvalidArgumentException('parse_user_agent requires a user agent');
		}
	}

	$platform = null;
	$browser  = null;
	$version  = null;

	$empty = array( 'platform' => $platform, 'browser' => $browser, 'version' => $version );

	if( !$u_agent ) return $empty;

	if( preg_match('/\((.*?)\)/im', $u_agent, $parent_matches) ) {

		preg_match_all('/(?P<platform>BB\d+;|Android|CrOS|iPhone|iPad|Linux|Macintosh|Windows(\ Phone)?|Silk|linux-gnu|BlackBerry|PlayBook|Nintendo\ (WiiU?|3DS)|Xbox(\ One)?)
				(?:\ [^;]*)?
				(?:;|$)/imx', $parent_matches[1], $result, PREG_PATTERN_ORDER);

		$priority           = array( 'Android', 'Xbox One', 'Xbox' );
		$result['platform'] = array_unique($result['platform']);
		if( count($result['platform']) > 1 ) {
			if( $keys = array_intersect($priority, $result['platform']) ) {
				$platform = reset($keys);
			} else {
				$platform = $result['platform'][0];
			}
		} elseif( isset($result['platform'][0]) ) {
			$platform = $result['platform'][0];
		}
	}

	if( $platform == 'linux-gnu' ) {
		$platform = 'Linux';
	} elseif( $platform == 'CrOS' ) {
		$platform = 'Chrome OS';
	}

	preg_match_all('%(?P<browser>Camino|Kindle(\ Fire\ Build)?|Firefox|Iceweasel|Safari|MSIE|Trident/.*rv|AppleWebKit|Chrome|IEMobile|Opera|OPR|Silk|Lynx|Midori|Version|Wget|curl|NintendoBrowser|PLAYSTATION\ (\d|Vita)+)
			(?:\)?;?)
			(?:(?:[:/ ])(?P<version>[0-9A-Z.]+)|/(?:[A-Z]*))%ix',
		$u_agent, $result, PREG_PATTERN_ORDER);


	// If nothing matched, return null (to avoid undefined index errors)
	if( !isset($result['browser'][0]) || !isset($result['version'][0]) ) {
		return $empty;
	}

	$browser = $result['browser'][0];
	$version = $result['version'][0];

	$find = function ( $search, &$key ) use ( $result ) {
		$xkey = array_search(strtolower($search), array_map('strtolower', $result['browser']));
		if( $xkey !== false ) {
			$key = $xkey;

			return true;
		}

		return false;
	};

	$key = 0;
	if( $browser == 'Iceweasel' ) {
		$browser = 'Firefox';
	} elseif( $find('Playstation Vita', $key) ) {
		$platform = 'PlayStation Vita';
		$browser  = 'Browser';
	} elseif( $find('Kindle Fire Build', $key) || $find('Silk', $key) ) {
		$browser  = $result['browser'][$key] == 'Silk' ? 'Silk' : 'Kindle';
		$platform = 'Kindle Fire';
		if( !($version = $result['version'][$key]) || !is_numeric($version[0]) ) {
			$version = $result['version'][array_search('Version', $result['browser'])];
		}
	} elseif( $find('NintendoBrowser', $key) || $platform == 'Nintendo 3DS' ) {
		$browser = 'NintendoBrowser';
		$version = $result['version'][$key];
	} elseif( $find('Kindle', $key) ) {
		$browser  = $result['browser'][$key];
		$platform = 'Kindle';
		$version  = $result['version'][$key];
	} elseif( $find('OPR', $key) ) {
		$browser = 'Opera Next';
		$version = $result['version'][$key];
	} elseif( $find('Opera', $key) ) {
		$browser = 'Opera';
		$find('Version', $key);
		$version = $result['version'][$key];
	} elseif( $find('Midori', $key) ) {
		$browser = 'Midori';
		$version = $result['version'][$key];
	} elseif( $find('Chrome', $key) ) {
		$browser = 'Chrome';
		$version = $result['version'][$key];
	} elseif( $browser == 'AppleWebKit' ) {
		if( ($platform == 'Android' && !($key = 0)) ) {
			$browser = 'Android Browser';
		} elseif( strpos($platform, 'BB') === 0 ) {
			$browser  = 'BlackBerry Browser';
			$platform = 'BlackBerry';
		} elseif( $platform == 'BlackBerry' || $platform == 'PlayBook' ) {
			$browser = 'BlackBerry Browser';
		} elseif( $find('Safari', $key) ) {
			$browser = 'Safari';
		}

		$find('Version', $key);

		$version = $result['version'][$key];
	} elseif( $browser == 'MSIE' || strpos($browser, 'Trident') !== false ) {
		if( $find('IEMobile', $key) ) {
			$browser = 'IEMobile';
		} else {
			$browser = 'MSIE';
			$key     = 0;
		}
		$version = $result['version'][$key];
	} elseif( $key = preg_grep('/playstation \d/i', array_map('strtolower', $result['browser'])) ) {
		$key = reset($key);

		$platform = 'PlayStation ' . preg_replace('/[^\d]/i', '', $key);
		$browser  = 'NetFront';
	}

	// Return user agent information
	return array( 
		'platform' => strtolower($platform), 
		'browser' => strtolower($browser), 
		'version' => strtolower($version)
		);

}

/**
 * Match a particular heuristics specifications
 */
function heuristics_match( $config ) {
	global $USER_AGENT;

	switch ($config[0]) {

		case 'ua-platform':
		case 'ua-browser':
		case 'ua-version':
			// Get the variable to match against (platform/browser/version)
			$var = substr($config[0], 3);
			// Apply AND on the config[1] array
			foreach ($config[1] as $value) {
				if ($USER_AGENT[$var] != $value) {
					return false;					
				}
			}
			return true;
			break;
		
		case 'user-agent':
			// Regex match on user agent

			// Apply AND on the config[1] array
			foreach ($config[1] as $value) {
				if (!(preg_match($value, $_SERVER['HTTP_USER_AGENT'])))
					return false;
			}
			return true;
			break;

		default:
			// Defaults to block
			return false;
			break;

	}

}

/**
 * Apply heuristics to select a group/flavor 
 */
function pick_flavor( $set ) {

	// First-level group matching
	$s_group = false;
	$n_group = "";
	foreach ($set as $g_name => $group) {

		// Pick the last group by default
		$s_group = $group;
		$n_group = $g_name;

		// OR operation on each of the group heuristics
		if (isset($group['heuristics'])) {
			foreach ($group['heuristics'] as $h) {
				// Check if we found a match
				if (heuristics_match($h)) break 2;
			}
		}
	}

	// If we found no group, return false
	if (!$s_group)
		return false;

	// Second-level flavor matching
	$s_flavor = false;
	$n_flavor = "";
	if (isset($group['flavors'])) {
		foreach ($s_group['flavors'] as $f_name => $flavor) {

			// Pick the last flavor by default
			$s_flavor = $flavor;
			$n_flavor = $f_name;

			// OR operation on each of the flavor heuristics
			if (isset($flavor['heuristics'])) {
				foreach ($flavor['heuristics'] as $h) {
					// Check if we found a match
					if (heuristics_match($h)) break 2;
				}
			}

		}
	}

	// Merge flavor variables down to group
	if ($s_flavor !== false) {
		foreach ($s_flavor as $k => $v) {
			$s_group[$k] = $v;
		}

		// Set names
		$s_group['group'] = $n_group;
		$s_group['flavor'] = $n_flavor;
	}

	// Unset some unused variables
	unset($s_group['flavors']);
	unset($s_group['heuristics']);

	// Return flavored group
	return $s_group;
	
}

/**
 * Filter files using the specified match-files list
 */
function filter_files( $files, $match_filter ) {
	$ans = array();
	foreach ($files as $f) {

		// Apply file name matching (using AND)
		foreach ($match_filter as $m) {
			if (!preg_match($m, $f['name']))
				continue 2;
		}

		// Store on answer
		$ans[] = $f;
	}

	// Return answer
	return $ans;
}

################################################################################
# HEURISTICS LOGIC
################################################################################

// Include config
require_once("config.php");

// Parse user agent and keep the info cached
$USER_AGENT = parse_user_agent();

// Match platform and browser
$PLATFORM = pick_flavor($PLATFORMS);
$BROWSER = pick_flavor($BROWSERS);

// Match files according to platform file-matching array
$FILES = array();
if (isset($PLATFORM['match-files'])) {
	$pkgs = scandir("packages");
	foreach ($pkgs as $f => $v) {
		if (substr($v,0,1) == '.')
			continue;

		// Apply file matching (using AND)
		foreach ($PLATFORM['match-files'] as $m) {
			if (!preg_match($m, $v))
				continue 2;
		}

		// Found file, start analyzing
		// Extract the information part
		$parts = explode("_", $v, 2);
		$info_part = array_pop($parts);

		// Extract arch
		$parts = explode("-", $info_part, 2);
		$i_arch = strtolower($parts[0]);

		// Extract extension
		if (count($parts) < 2) continue;
		$parts = explode(".", $parts[1]);
		$i_ext = array_pop($parts);

		// Extract flavor (if exists)
		$i_flavor = "default";
		if (!is_numeric($parts[count($parts)-1])) {
			$i_flavor = strtolower(array_pop($parts));
		}

		// Collect version information
		if (!is_numeric($parts[0])) continue;
		if (!is_numeric($parts[1])) continue;
		if (!is_numeric($parts[2])) continue;
		$s_ver = $parts[0].".".$parts[1].".".$parts[2];
		$i_ver  = ((int)(array_shift($parts))) * 10000 +
				  ((int)(array_shift($parts))) * 100 +
				  ((int)(array_shift($parts)));

		// Get file size
		$size = filesize('packages/'.$v);
		$s_size = "${size} b";
		if ($size > 1024) {
			$size /= 1024;
			$s_size = sprintf("%0.2f Kb", $size);
			if ($size > 1024) {
				$size /= 1024;
				$s_size = sprintf("%0.2f Mb", $size);
				if ($size > 1024) {
					$size /= 1024;
					$s_size = sprintf("%0.2f Gb", $size);
				}
			}
		}

		// Check for other garbage
		if (count($parts) != 0) continue;

		// Store file
		$FILES[] = array(
	        'version'   => $s_ver,
	        'intver'    => $i_ver,
	        'extension' => $i_ext,
	        'size'      => $s_size,
	        'flavor'	=> $i_flavor,
	        'name'      => $v,
	        'href'      => 'packages/'.$v
			);

	}

	// Sort files according to version
	function cmp_intver($b, $a) {
	    if ($a['intver'] == $b['intver']) return 0;
	    return ($a['intver'] < $b['intver']) ? -1 : 1;
	}
	usort($FILES, 'cmp_intver');

}

################################################################################
# RENDERING LOGIC
################################################################################

/*
echo 'PLATFORM = '; print_r($PLATFORM);
echo 'BROWSER = ';print_r($BROWSER);
echo 'FILES = ';print_r($FILES);
echo 'UA_DETECT = ';print_r($USER_AGENT);
echo 'USER_AGENT = "' . $_SERVER['HTTP_USER_AGENT'] . '"\n';
*/

// Get the page to render
$page = "install";
if (isset($PLATFORM['page']))
	$page = $PLATFORM['page'];

// Sanitize page
$page = preg_replace('[^a-z\-]', '', $page);
if (!file_exists('parts/'.$page.'.php')) {
	die("Page-Not-Found ($page)");
}

// Check for empty install page
if ((($page == "install") || ($page == "install-list")) && (count($FILES) == 0)) {
	$page = 'error-no-files';	
}

// Render
include('parts/'.$page.'.php');

?>