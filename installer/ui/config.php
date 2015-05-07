<?php


// Architecture matching on files
$FILE_ARCH_32 = '/_i386-|_i486-|_i586-|_i686-|_x86-/';
$FILE_ARCH_64 = '/_x86_64-|_amd64-/';

// Common messages
$FOLLOW_OSK = "Follow the on-screen instructions.";

// The user's computer can be in either of the following three platforms
$PLATFORMS = array(

	/**
	 * First detect all mobile agents
	 */
	'mobile' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			// Identified platforms
			array( 'ua-platform', array( 'android' ) ), 
			array( 'ua-platform', array( 'iphone' ) ), 
			array( 'ua-platform', array( 'ipad' ) ),
			array( 'ua-platform', array( 'kindle' ) ),
			// CPUs: ARM/MIPS
			array( 'user-agent',  array( '/[ ;]arm[a-z0-9]+[ ;]|[ ;]mips[a-z0-9]+[ ;]/' ) ),
			// Unidentified devices: WindowsCE, IEMobile
			array( 'user-agent',  array( '/BlackBerry|Windows CE|IEMobile|Kindle|SymbianOS/' ) )
			),

		// Render page
		'page' => 'error-message',
		'message' => 'You cannot use CernVM WebAPI in a mobile device. Your device needs to support hardware virtualization!',

		// Flavors
		'flavors' => array( )

		),


	/**
	 * Then detect all incompatible agents
	 */
	'incomatible' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			// CPUs: Power-PC
			array( 'user-agent',  array( '/[ ;]PPC+[ ;]/' ) ),
			),

		// Render page
		'page' => 'error-message',
		'message' => 'You cannot use CernVM WebAPI in your device. Your CPU must support hardware virtualization!',

		// Flavors
		'flavors' => array( )

		),

	/**
	 * Then select one of known platforms
	 */
	'windows' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			array( 'ua-platform', array( 'windows' ) ), 
			),

		// Render page
		'page' => 'install',

		// Each platform might have one or more flavors
		'flavors' => array(
			'win-64' => array(

				// Platform title
				'title' => 'Windows (64-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent', array( '/WOW64|x64|Win64|x86_64|ia64/' ) )
					),

				// Match ALL this patterns for picking a file
				'match-files' => array(
					/* 32-bit binaries also work on 64-bit */
					'/\.exe|\.msi/'
					)
				),

			'win-32' => array(
				'title' => 'Windows (32-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					),

				'match-files' => array(
					$FILE_ARCH_32,
					'/\.exe|\.msi/'
					)
				)

			)

		),

	'linux' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			array( 'ua-platform', array( 'linux' ) ), 
			array( 'user-agent',  array( '/linux/i' ) )
			),

		// Render page
		'page' => 'install',

		// Each platform might have one or more flavors
		'flavors' => array(
			'deb-64' => array(
				'title' => 'Debian/Ubuntu (64-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent',  array( '/ubuntu|debian/i', '/x86_64|amd64|ia64/i' ) )
					),

				// Files to match
				'match-files' => array(
					$FILE_ARCH_64,
					'/\.deb/'
					)
				),

			'deb-32' => array(
				'title' => 'Debian/Ubuntu (32-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent',  array( '/ubuntu|debian/i' ) )
					),

				// Files to match
				'match-files' => array(
					$FILE_ARCH_32,
					'/\.deb/'
					)
				),

			'rpm-64' => array(
				'title' => 'RedHat/OpenSUSE (64-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent',  array( '/fedora|redhat|suse/i', '/x86_64|amd64|ia64/i' ) )
					),

				// Files to match
				'match-files' => array(
					$FILE_ARCH_64,
					'/\.rpm/'
					)
				),

			'rpm-32' => array(
				'title' => 'RedHat/OpenSUSE (32-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent',  array( '/fedora|redhat|suse/i' ) )
					),

				// Files to match
				'match-files' => array(
					$FILE_ARCH_32,
					'/\.rpm/'
					)
				),

			'pick-64' => array(
				'title' => 'Linux (64-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent',  array( '/x86_64|amd64|ia64/i' ) )
					),

				// Files to match
				'match-files' => array(
					$FILE_ARCH_64,
					'/\.rpm|\.deb/'
					),

				// Present a list to the user
				'page' => 'install-list',
				'list' => array(
					array(
						'title' => 'Debian/Ubuntu (.deb)',
						'match_files' => array(
							'/\.deb/'
							)
						),
					array(
						'title' => 'RedHat/OpenSUSE (.rpm)',
						'match_files' => array(
							'/\.rpm/'
							)
						),
					array(
						'title' => 'Compile from sources',
						'href' => 'https://github.com/wavesoft/cernvm-webapi#building'
						)
					)

				),

			'pick-32' => array(
				'title' => 'Linux (32-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'user-agent',  array( '/i[2-9]86|ia32|x86/' ) )
					),

				// Files to match
				'match-files' => array(
					$FILE_ARCH_32,
					'/\.rpm|\.deb/'
					),

				// Present a list to the user
				'page' => 'install-list',
				'list' => array(
					array(
						'title' => 'Debian/Ubuntu (.deb)',
						'match_files' => array(
							'/\.deb/'
							)
						),
					array(
						'title' => 'RedHat/OpenSUSE (.rpm)',
						'match_files' => array(
							'/\.rpm/'
							)
						),
					array(
						'title' => 'Compile from sources',
						'href' => 'https://github.com/wavesoft/cernvm-webapi#building'
						)
					)

				),

			'pick-all' => array(
				'title' => 'Linux (All Flavors)',

				//Files to match
				'match-files' => array(
					'/\.rpm|\.deb/'
					),

				// Present a list to the user
				'page' => 'install-list',
				'list' => array(
					array(
						'title' => '64-Bit Debian/Ubuntu (.deb)',
						'match_files' => array(
							$FILE_ARCH_64,
							'/\.deb/'
							)
						),
					array(
						'title' => '64-Bit RedHat/OpenSUSE (.rpm)',
						'match_files' => array(
							$FILE_ARCH_64,
							'/\.rpm/'
							)
						),
					array(
						'title' => '32-Bit Debian/Ubuntu (.deb)',
						'match_files' => array(
							$FILE_ARCH_32,
							'/\.deb/'
							)
						),
					array(
						'title' => '32-Bit RedHat/OpenSUSE (.rpm)',
						'match_files' => array(
							$FILE_ARCH_32,
							'/\.rpm/'
							)
						),
					array(
						'title' => 'Compile from sources',
						'href' => 'https://github.com/wavesoft/cernvm-webapi#building'
						)
					)
				),

			)

		),

	'osx' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			array( 'ua-platform', array( 'macintosh' ) ), 
			),

		// Render page
		'page' => 'install',

		// Each platform might have one or more flavors
		'flavors' => array(
			'mac-64' => array(

				// Platform title
				'title' => 'Macintosh (64-bit)',

				// Heuristics for picking this flavor
				'heuristics' => array(
					),

				// Match ALL this patterns for picking a file
				'match-files' => array(
					$FILE_ARCH_64,
					'/\.pkg/'
					)
				)

			)
		),

	/**
	 * Finally, if we couldn't select anything show choose page
	 */
	'any' => array(

		// Render error page to choose platform
		'page' => 'error-sources'

		)

);

// The user can use either of these browsers
$BROWSERS = array(

	'firefox' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			array( 'ua-browser', array( 'firefox' ) ), 
			),

		// Each browser might have one or more flavors
		'flavors' => array(
			'firefox-mac' => array(

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'ua-platform', array( 'macintosh' ) ), 
					),

				// Guidelines for the user
				'guidelines' => array(
					'Open the downloads window (Press Command-J)',
					'Double-click on the <strong>%</strong> file',
					$FOLLOW_OSK
					)
				),

			'firefox-win' => array(

				// Heuristics for picking this flavor
				'heuristics' => array(
					array( 'ua-platform', array( 'windows' ) ), 
					),

				// Guidelines for the user
				'guidelines' => array(
					'Open the downloads window (Press Control-J)',
					'Double-click on the <strong>%</strong> file',
					$FOLLOW_OSK
					)
				)
			)

		),

	'chrome' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			array( 'ua-browser', array( 'chrome' ) ), 
			),

		// Each browser might have one or more flavors
		'flavors' => array(
			'chrome-all' => array(

				// Guidelines for the user
				'guidelines' => array(
					'Click the file <strong>%</strong> at the lower-left of your browser window',
					$FOLLOW_OSK
					)
				)
			)

		),

	'msie' => array(

		// Heuristics for picking this platform (any from list)
		'heuristics' => array(
			array( 'ua-browser', array( 'msie' ) ), 
			),

		// Each browser might have one or more flavors
		'flavors' => array(
			'msie-win' => array(

				// Guidelines for the user
				'guidelines' => array(
					'Click <strong>Run</strong> to the message in the bottom of the screen to launch the installer <strong>%</strong>.',
					$FOLLOW_OSK
					)
				)
			)

		),

	'generic' => array(

		// Generic version of the browser
		'flavors' => array(
			'generic' => array(

				// Guidelines for the user
				'guidelines' => array(
					'Open the <strong>downloads</strong> window on your browser.',
					'Double click on the <strong>%</strong> to start the installer.',
					$FOLLOW_OSK
					)
				)

			)

		)

);

?>