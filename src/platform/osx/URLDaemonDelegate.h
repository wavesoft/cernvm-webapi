//
//  URLDaemonDelegate.h
//  WebAPI Daemon
//
//  Created by Ioannis Charalampidis on 14/02/14.
//  Copyright (c) 2014 CernVM. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <Foundation/NSAppleEventManager.h>

// Webserver
#include <web/webserver.h>

// Daemon components
#include <daemon.h>

@interface URLDaemonDelegate : NSObject <NSApplicationDelegate> {
  
  	// Daemon core component
  	@private DaemonCore *		core;
  	// Create a factory that manages the daemon sessions
  	@private DaemonFactory *	factory;
  	// Create a webserver that serves with the daemon factory
  	@private CVMWebserver *		webserver;

  	// The webserver polling timer
  	@private NSTimer *			timer;
  	// The reaping probe timer
  	@private NSTimer *			reapTimer;
    // The cron jobs timer
    @private NSTimer *      cronTimer;
    // The timer used for delay-starting reap timer
    @private NSTimer *      delayStartTimer;
    // The timer used for delay-launching the URL
    @private NSTimer *      delayLaunch;

    // Flags regarding launch type
    @private bool           launchedByURL;
    // Fag for allowing focus on activate
    @private bool           focusOnActiate;
    // Flag that defines if the URL was launched once
    @private bool           usedLauchURL;
    // Flag that denotes that the URL was started by the installer
    // this should disable all the timers
    @private bool           launchedBySetup;

}

/**
 * Run one step on server events
 */
- (void)serverLoop;

/**
 * CRON Event
 */
- (void)forwardCronEvent;

/**
 * Check server for reaping dead connections
 */
- (void)serverReap;

/**
 * Start reaping probe
 */
- (void)startReap;

/**
 * Launch URL
 */
- (void)launchURL;

/**
 * Prohibit launching a URL At open
 */
- (void)dontLaunchURL;

/**
 * Callback when a URL is requested
 */
- (void)getUrl:(NSAppleEventDescriptor *)event 
      withReplyEvent:(NSAppleEventDescriptor *)replyEvent;

@end
