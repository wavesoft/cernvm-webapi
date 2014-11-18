//
//  URLDaemonDelegate.m
//  WebAPI Daemon
//
//  Created by Ioannis Charalampidis on 14/02/14.
//  Copyright (c) 2014 CernVM. All rights reserved.
//

#import <config.h>
#import <CernVM/DomainKeystore.h>
#import <CernVM/CrashReport.h>

#import "URLDaemonDelegate.h"

@implementation URLDaemonDelegate

/**
 * Initialize variables
 */
- (id)init {
	self = [super init];
	if (self) {
		self->launchedByURL = false;
		self->reapTimerDisabled = false;
		self->firstTimeoutDisabled = false;
		self->focusOnActiate = false;
		self->usedLauchURL = false;
		self->urlLaunchTimestamp = 0;
	}
	return self;
}

- (void)checkAndLaunchURL
{
	// Launch URL on focus only when allowed and only if at least
	// 1s is passed since the URL handling was performed.
	NSLog(@"Focusing (Delta=%d)!", getMillis() - urlLaunchTimestamp );
	if (focusOnActiate && ((getMillis() - urlLaunchTimestamp) > 2000)) {
		[self launchURL];
	}
}

/**
 * Open browser when focued
 */
- (void)applicationDidBecomeActive:(NSNotification *)aNotification
{

	// Wait some time until the getUrl kicks in, because we might
	// have been focused before the actual URL is handled
	delayActivateLaunch = [NSTimer 
		scheduledTimerWithTimeInterval:0.5
		target:self
		selector:@selector(checkAndLaunchURL)
		userInfo:nil
		repeats:NO];

}

/**
 * State to register event manager
 */
- (void)applicationWillFinishLaunching:(NSNotification *)aNotification
{

	// Initialize subsystems
#ifdef CRASH_REPORTING
	crashReportInit();
#endif
	initSysExec();
	DomainKeystore::Initialize();

	// Add some extra crash-report information
	crashReportAddInfo("version", CERNVM_WEBAPI_VERSION);

	// Create the C++ daemon core
	core = new DaemonCore();
	// Create a factory which is going to create the instances
	factory = new DaemonFactory(*core);
	// Create the webserver instance
	webserver = new CVMWebserver(*factory);
	// Create the RPC handler
	rpcHandler = new WebRPCHandler();
	webserver->setStaticURLHandler(rpcHandler);

	// Handle URL
	NSAppleEventManager *em = [NSAppleEventManager sharedAppleEventManager];
	[em 
		setEventHandler:self 
		andSelector:@selector(getUrl:withReplyEvent:) 
		forEventClass:kInternetEventClass 
		andEventID:kAEGetURL];  
	[em 
		setEventHandler:self 
		andSelector:@selector(getUrl:withReplyEvent:) 
		forEventClass:'WWW!' 
		andEventID:'OURL'];

	// Daemon components are ready
	NSLog(@"Daemon initialized");

}

/**
 * Application launch phase completed
 */
- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{

	// Start a polling timer
	timer = [NSTimer 
		scheduledTimerWithTimeInterval:0.01 
		target:self
		selector:@selector(serverLoop)
		userInfo:nil
		repeats:YES];

	// Start CRON timer
	cronTimer = [NSTimer
		scheduledTimerWithTimeInterval:1
		target:self
		selector:@selector(forwardCronEvent)
		userInfo:nil
		repeats:YES];

	// If we were not launched by URL, open the management interface
	// in the browser.
	if (launchedByURL) {

		// Otherwise, immediately tart the reap timer
		[self startReap];

		// Enable focusOnActiate a while later
		delayActivateLaunch = [NSTimer 
			scheduledTimerWithTimeInterval:0.5
			target:self
			selector:@selector(activateFocusLaunch)
			userInfo:nil
			repeats:NO];

	}

	NSLog(@"Timer started");

}

/**
 * The cron jobs timer
 /*/
- (void)forwardCronEvent
{
	
	// Trigger the scheduled jobs loop
	core->processPeriodicJobs();
	
}

/**
 * Polling timer
 */
- (void)serverLoop
{
	// Poll for 100ms
	webserver->poll(500);

	// Check if we should launch the URL
	if (!launchedByURL && !usedLauchURL) {

		// Launch URL right after the server started polling
		[self launchURL];

		// Enable focusOnActiate a while later
		delayActivateLaunch = [NSTimer 
			scheduledTimerWithTimeInterval:0.5
			target:self
			selector:@selector(activateFocusLaunch)
			userInfo:nil
			repeats:NO];

		// Delay a bit the Reap loop, since
		// it takes some time for the browser to open
		delayStartTimer = [NSTimer 
			scheduledTimerWithTimeInterval:10
			target:self
			selector:@selector(startReap)
			userInfo:nil
			repeats:NO];

		// We used LaunchURL
		usedLauchURL = true;

	}

	// If the server has exited, exit app
	if (core->hasExited()) {
		NSLog(@"Server exited");
		[NSApp terminate: nil];
	}

}

/**
 * Disable launching URL (same effect as launchedByURL)
 */
- (void)disableFirstTimeout
{
	// Mark as launched by URL (therefore we don't have to launch the URL again)
	launchedByURL = true;
	// Mark as launched by setup
	firstTimeoutDisabled = true;
	
}

/**
 * Start the reaping timer for probing server status
 */
- (void)startReap
{
	// Do not start reap timer if user called disableReapTimer()
	if (reapTimerDisabled) return;

	// Reap timer that cleans-up plugin instances
	reapTimer = [NSTimer 
		scheduledTimerWithTimeInterval:5
		target:self
		selector:@selector(serverReap)
		userInfo:nil
		repeats:YES];
}

/**
 * Do not start the reap timer
 */
- (void)disableReapTimer
{
	reapTimerDisabled = true;
}

/**
 * Reap server if there are no active connections
 */
- (void)serverReap
{
	// Don't do anything if the reap timer is disabled
	if (reapTimerDisabled) return;

	// Check if we don't have any live connection
	if (!webserver->hasLiveConnections()) {

		// Dont' reap server if we started by setup
		if (firstTimeoutDisabled) {
			return;
		}

		NSLog(@"Reaping server because of no connections");
		[NSApp terminate: nil];
	} else {

		// The moment we got an active connection, we are allowed
		// to dismiss the process. Therefore reset any possible
		// firstTimeoutDisabled flag
		firstTimeoutDisabled = false;
		
	}
}

/**
 * Launch URL
 */
- (void)activateFocusLaunch
{
	focusOnActiate = true;
}

/**
 * Launch URL
 */
- (void)launchURL
{

	// Disabled for now
	/*

	// Generate an authentication token
	std::string authToken = core->newAuthKey();

	// Concat url + auth token
	NSMutableString* url = [[NSMutableString alloc] initWithString:@"http://127.0.0.1:5624/control.html#"];
	[url appendString:[NSString stringWithCString:authToken.c_str() encoding:[NSString defaultCStringEncoding]]];

	// Open again the management interface
	[[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:url]]; 

	*/
}

/**
 * Handle URL requests
 */
- (void) getUrl:(NSAppleEventDescriptor *)event 
	   withReplyEvent:(NSAppleEventDescriptor *)replyEvent
{
	// Get the URL
	NSString *urlStr = [[event paramDescriptorForKeyword:keyDirectObject] 
		stringValue];

	// Update the timestamp we were last launched by URL
	urlLaunchTimestamp = getMillis();

	NSLog(@"URL Handled: %s", [urlStr UTF8String]);
	launchedByURL = true;
}

/**
 * Cleanup objects at shutdown
 */
- (void)applicationWillTerminate:(NSNotification *)aNotification
{

	NSLog(@"Cleaning-up daemon");

	// Stop timers
	[timer invalidate];
	[reapTimer invalidate];

	// Start core cleanups
	core->shutdownCleanup();

	// Abory any lingering sysExec commands
	abortSysExec();

	// Destruct webserver components
	delete webserver;
	delete factory;
	delete core;
	delete rpcHandler;

	// Cleanup subsystems
	DomainKeystore::Cleanup();
#ifdef CRASH_REPORTING
	crashReportCleanup();
#endif

}

@end
