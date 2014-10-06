<?php

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
$USER = parse_user_agent();
$PLATFORM = "";
if (isset($USER['platform'])) {
    $PLATFORM = strtolower($USER['platform']);
}
if (isset($_GET['plaf'])) {
    $plaf = strtolower($_GET['plaf']);
    if (in_array($plaf, $valid_platforms)) {
        $PLATFORM = $plaf;
    }
}

/**
 * Scan packages and build lookup table
 * 
 */
$PACKAGES = array();
$pkgs = scandir("packages");
foreach ($pkgs as $f => $v) {
    if (substr($v,0,1) == '.')
        continue;

    // Extract the information part
    $parts = explode("_", $v);
    $info_part = array_pop($parts);

    // Extract arch
    $parts = explode("-", $info_part);
    $i_arch = $parts[0];

    // Extract extension
    $parts = explode(".", $parts[1]);
    $i_ext = array_pop($parts);

    // Extract flavor (if exists)
    $i_flavor = "";
    if (!is_numeric($parts[0])) {
        $i_flavor = array_shift($parts);
    }

    // Collect version information


    // Extract file parts
    $ext = substr($v,-4);
    $parts = explode("-", substr($v,0,-4));
    $verParts = explode(".", $parts[1]);
    $intVer = ((int)($verParts[0])) * 10000 +
              ((int)($verParts[1])) * 100 +
              ((int)($verParts[2]));

}

/**
 * Detect linux variants
 */
$PLATFORM_NAME = ucfirst($PLATFORM);
$PLATFORM_ARCH = "x32";
if ($PLATFORM == 'linux') {
    $ua = strtolower($_SERVER['HTTP_USER_AGENT']);
    if (strstr($ua, "ubuntu")) {
        $PLATFORM .= "-deb";
        $PLATFORM_NAME = "Ubuntu Linux";
    } else if (strstr($ua, "debian")) {
        $PLATFORM .= "-deb";
        $PLATFORM_NAME = "Debian Linux";
    } else if (strstr($ua, "red hat")) {
        $PLATFORM .= "-rpm";
        $PLATFORM_NAME = "RedHat Linux";
    } else if (strstr($ua, "suse") || strstr($ua, "rhel") || strstr($ua, "fedora") || strstr($ua, "slc")) {
        $PLATFORM .= "-rpm";
        $PLATFORM_NAME = "Linux (RedHat variant)";
    } else if (strstr($ua, "gentoo") || strstr($ua, "mint")) {
        $PLATFORM .= "-tgz";
        $PLATFORM_NAME = "Linux (Generic)";
    } else {
        $PLATFORM .= "-rpm";
        $PLATFORM_NAME = "Linux (RedHat variant)";
    }
    if (strstr($ua, "x86_64") || strstr($ua, "amd64")) {
        $PLATFORM_ARCH = "x64";
        $PLATFORM_NAME .= " (64-bit)";
    }
    $PLATFORM .= "-" . $PLATFORM_ARCH;
}

/**
 * List files in the packages directory
 */
$pkgs = scandir("packages");
$PACKAGES = array(
        'macintosh' => array(),
        'windows' => array(),
        'linux-deb-x32' => array(),
        'linux-deb-x64' => array(),
        'linux-rpm-x32' => array(),
        'linux-rpm-x64' => array(),
        'linux-gz-x32' => array(),
        'linux-gz-x64' => array()
    );
foreach ($pkgs as $f => $v) {
    if (substr($v,0,1) == '.')
        continue;

    // Extract file parts
    $ext = substr($v,-4);
    $parts = explode("-", substr($v,0,-4));
    $verParts = explode(".", $parts[1]);
    $intVer = ((int)($verParts[0])) * 10000 +
              ((int)($verParts[1])) * 100 +
              ((int)($verParts[2]));

    if ($ext == ".pkg") {
        $PACKAGES['macintosh'][] = array(
                'version' => $parts[1],
                'intver' => $intVer,
                'name' => $v,
                'href' => 'packages/'.$v
            );
    } else if ($ext == ".msi") {
        $PACKAGES['windows'][] = array(
                'version' => $parts[1],
                'intver' => $intVer,
                'name' => $v,
                'href' => 'packages/'.$v
            );
    } else if ($ext == ".deb") { 
        $f = array(
            'version' => $parts[1],
            'intver' => $intVer,
            'name' => $v,
            'href' => 'packages/'.$v
        );
        if (strstr($v, "amd64") || strstr($v, "x86_64")) {
            $PACKAGES['linux-deb-x64'][] = $f;
        } else {
            $PACKAGES['linux-deb-x32'][] = $f;
        }
    } else if ($ext == ".rpm") { 
        $f = array(
            'version' => $parts[1],
            'intver' => $intVer,
            'name' => $v,
            'href' => 'packages/'.$v
        );
        if (strstr($v, "amd64") || strstr($v, "x86_64")) {
            $PACKAGES['linux-rpm-x64'][] = $f;
        } else {
            $PACKAGES['linux-rpm-x32'][] = $f;
        }
    } else if ($ext == ".tgz") {
        $f = array(
            'version' => $parts[1],
            'intver' => $intVer,
            'name' => $v,
            'href' => 'packages/'.$v
        );
        if (strstr($v, "amd64") || strstr($v, "x86_64")) {
            $PACKAGES['linux-tgz-x64'][] = $f;
        } else {
            $PACKAGES['linux-tgz-x32'][] = $f;
        }
    }
}

/**
 * Sort the platform versions
 */
$PLATFORM_PACKAGES = $PACKAGES[$PLATFORM];
function cmp_intver($b, $a) {
    if ($a['intver'] == $b['intver']) return 0;
    return ($a['intver'] < $b['intver']) ? -1 : 1;
}
usort($PLATFORM_PACKAGES, 'cmp_intver');

/**
 * Pick installer page, depending on the platform
 */
if (!$PLATFORM || empty($PLATFORM_PACKAGES)) {
    include("pages/missing.php");
} else {
    include("pages/install.php");
}

?>