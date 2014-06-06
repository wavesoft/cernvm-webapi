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

int main(int argc, const char * argv[])
{

	// Initialize delegate
	URLDaemonDelegate * delegate = [[URLDaemonDelegate alloc] init];

	// Check if we have the 'setup' argument which is provided
	// when we are launched by the setup
	if (argc >= 2) {
		if (!strcmp(argv[1], "setup"))
			[delegate dontLaunchURL];
	}

	// Start app
	[[NSApplication sharedApplication] setDelegate:delegate];
	[NSApp run];
    [delegate release];

}
