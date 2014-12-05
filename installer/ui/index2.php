<?php

$AGENT_DEFAULT_ARCH = "i386";
$AGENT_ARCHMAP = array(
	"wow64" => "amd64",
	""
);

$PLATFORM_MAP = array(
	'windows' => array(
			'ext' => '.exe',
			'name' => 'Windows'
		)
);

/**
 * Architecture mapping
 */
$PKG_ARCH_MAP = array(
    'i486'      => 'i386',
    'i586'      => 'i386',
    'i686'      => 'i386',
    'i786'      => 'i386',
    'i886'      => 'i386',
    'i986'      => 'i386',
    'x86_64'    => 'amd64',

    'all'       => 'all',
    'i386'      => 'i386',
    'amd64'     => 'amd64'
);

/**
 * Platform mapping depending on extension
 */
$PKG_EXT_MAP = array(
    'exe'       => 'windows',
    'pkg'       => 'macintosh',
    'deb'       => 'linux',
    'rpm'       => 'linux'
);


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

    return array( 'platform' => $platform, 'browser' => $browser, 'version' => $version );
}

/**
 * Detect user-agent
 */
$valid_platforms = array( "android","cros","iphone","ipad","linux","macintosh","windows" );
$AGENT = parse_user_agent();
$AGENT_PLATFORM = "";
if (isset($AGENT['platform'])) {
    $AGENT_PLATFORM = strtolower($AGENT['platform']);
}
if (isset($_GET['plaf'])) {
    $plaf = strtolower($_GET['plaf']);
    if (in_array($plaf, $valid_platforms)) {
        $AGENT_PLATFORM = $plaf;
    }
}

/**
 * Detect user agent architecture 
 */
$AGENT_ARCH = $AGENT_DEFAULT_ARCH;
foreach ($AGENT_ARCHMAP as $k => $arch) {
	if (stristr($_SERVER['HTTP_USER_AGENT'], $k)) {
		$AGENT_ARCH = $arch;
		break;
	}
}

/**
 * Prepare the possible options
 * 
 * Expected package syntax:
 * cvmwebapi-2.0.10.pkg
 *
 * <package name>_<architecture>-<version>[.<flavor>].<ext>
 *
 */
$ALL_OPTIONS = array();
$pkgs = scandir("packages");
foreach ($pkgs as $f => $v) {
    if (substr($v,0,1) == '.')
        continue;

    // Extract the information part
    $parts = explode("_", $v, 2);
    $info_part = array_pop($parts);

    // Extract arch
    $parts = explode("-", $info_part, 2);
    $i_arch = strtolower($parts[0]);

    // Fix architecture if exists on arch_map
    if (!isset($PKG_ARCH_MAP[$i_arch])) continue;
    $i_arch = $PKG_ARCH_MAP[$i_arch];

    // Extract extension
    if (count($parts) < 2) continue;
    $parts = explode(".", $parts[1]);
    $i_ext = array_pop($parts);

    // Map platform according to extension
    if (!isset($PKG_EXT_MAP[$i_ext])) continue;
    $i_platf = $PKG_EXT_MAP[$i_ext];

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

    // Store on packages
    $ALL_OPTIONS[] = array(
        'version'   => $s_ver,
        'intver'    => $i_ver,
        'arch'      => $i_arch,
        'size'      => $s_size,
        'flavor'	=> $i_flavor,
        'platf'		=> $i_platf,
        'name'      => $v,
        'href'      => 'packages/'.$v
    );
}

/**
 * Sort packages
 */
function cmp_intver($b, $a) {
    if ($a['intver'] == $b['intver']) return 0;
    return ($a['intver'] < $b['intver']) ? -1 : 1;
}
usort($ALL_OPTIONS, 'cmp_intver');

/**
 * Scan user information and prepare the options
 */
$OPTIONS = array();
foreach ($ALL_OPTIONS as $o) {

	// Filter platform
	if (($AGENT_PLATFORM != "") && ($AGENT_PLATFORM != $o['platf'])) continue;

	// Filter architecture
	if ($AGENT_ARCH != $o['arch']) continue;

	// Store on options
	$OPTIONS[] = $o;

}


print_r($OPTIONS);

?>