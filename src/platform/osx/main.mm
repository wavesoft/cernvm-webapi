//
//  URLDaemonDelegate.m
//  WebAPI Daemon
//
//  Created by Ioannis Charalampidis on 14/02/14.
//  Copyright (c) 2014 CernVM. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#import "URLDaemonDelegate.h"
#import <string.h>

/**
 * The URL daemon deletgate
 */
URLDaemonDelegate * delegate;

/**
 * Static RPC implementation : open authenticated URL
 */
void WebRPCHandler::platf_openControl() {
	[delegate launchURL];
}

/**
 * Application entry point
 */
int main(int argc, const char * argv[])
{

	// Initialize delegate
	delegate = [[URLDaemonDelegate alloc] init];

	// Check if we have the 'setup' argument which is provided
	// when we are launched by the setup
	if (argc >= 2) {
		if (!strcmp(argv[1], "setup"))
			[delegate disableFirstTimeout];
		else if (!strcmp(argv[1], "daemon")) {
			[delegate disableReapTimer];
		}
	}

	// Start app
	[[NSApplication sharedApplication] setDelegate:delegate];
	[NSApp run];
    [delegate release];

}
