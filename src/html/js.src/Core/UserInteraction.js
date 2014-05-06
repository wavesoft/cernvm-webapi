
/**
 * Flags for the UserInteraction
 */
var UI_OK 			= 0x01,
	UI_CANCEL 		= 0x02,
	UI_NOTAGAIN		= 0x100;

/**
 * The private WebAPI Interaction class
 */
var UserInteraction = _NS_.UserInteraction = function( socket ) {
	var self = this;
	this.socket = socket;
	this.onResize = null;
	window.addEventListener('resize', function() {
		console.log("RESIZE!");
		if (self.onResize) self.onResize();
	});
};


/**
 * Hide the active interaction screen
 */
UserInteraction.hideInteraction = function() {
	if (UserInteraction.activeScreen != null) {
		try {
			document.body.removeChild(UserInteraction.activeScreen);
		} catch(e) { }
		UserInteraction.activeScreen = null;
	}
}

/**
 * Create a framed button
 */
UserInteraction.createButton = function( title, baseColor ) {
	var button = document.createElement('button');

	// Place tittle
	button.innerHTML = title;

	// Style button
	button.style.display = 'inline-block';
	button.style.marginBottom = '0';
	button.style.textAlign = 'center';
	button.style.verticalAlign = 'middle';
	button.style.borderStyle = 'solid';
	button.style.borderWidth = '1px';
	button.style.borderRadius 
		= button.style.webkitBorderRadius 
		= button.style.mozBorderRadius 
		= "4px";
	button.style.userSelect 
		= button.style.webkitUserSelect 
		= button.style.mozUserSelect 
		= button.style.msUserSelect 
		= "none";
	button.style.margin = '5px';
	button.style.padding = '6px 12px';
	button.style.cursor = 'pointer';

	// Setup color
	var shadeColor = function(color, percent) {
			var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
			return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
		},
		yiqColor = function (bgColor) {
			var num = parseInt(bgColor.slice(1), 16),
				r = (num >> 16), g = (num >> 8 & 0x00FF), b = (num & 0x0000FF),
				yiq = (r * 299 + g * 587 + b * 114) / 1000;
			return (yiq >= 128) ? 'black' : 'white';
		};

	// Lighten for background
	button.style.backgroundColor = baseColor;
	button.style.borderColor = shadeColor(baseColor, -20);

	// Hover
	button.onmouseover = function() {
		button.style.backgroundColor = shadeColor(baseColor, -10);
	}
	button.onmouseout = function() {
		button.style.backgroundColor = baseColor;
	}

	// Pick foreground color according to the intensity of the background
	button.style.color = yiqColor( baseColor );

	// Return button
	return button;

}

/**
 * Create a framed window, used for various reasons
 */
UserInteraction.createFramedWindow = function( config ) {

	if (!config) config={};
	var body    	= config['body']    || "", 
		header  	= config['header']  || false, 
		footer  	= config['footer']  || false, 
		icon    	= config['icon']    || false, 
		cbClose 	= config['onClose'] || false,
		disposable  = (config['disposable'] != undefined) ? config['disposable'] : true;

	var floater = document.createElement('div'),
		content = document.createElement('div'),
		cHeader = document.createElement('div'),
		cFooter = document.createElement('div'),
		cBody = document.createElement('div');

	// Make floater full-screen overlay
	floater.style.position = "absolute";
	floater.style.left = "0";
	floater.style.top = "0";
	floater.style.right = "0";
	floater.style.bottom = "0";
	floater.style.zIndex = 60000;
	floater.style.backgroundColor = "rgba(255,255,255,0.5)";
	floater.appendChild(content);

	// Prepare vertical-centering
	content.style.marginLeft = "auto";
	content.style.marginRight = "auto";
	content.style.marginBottom = 0;
	content.style.marginTop = 0;

	// Frame style
	content.style.backgroundColor = "#FCFCFC";
	content.style.border = "solid 1px #E6E6E6";
	content.style.borderRadius 
		= content.style.webkitBorderRadius 
		= content.style.mozBorderRadius 
		= "5px";
	content.style.boxShadow 
		= content.style.webkitBoxShadow 
		= content.style.mozBoxShadow 
		= "1px 2px 4px 1px rgba(0,0,0,0.2)";
	content.style.padding = "10px";
	content.style.fontFamily = "Verdana, Geneva, sans-serif";
	content.style.fontSize = "14px";
	content.style.color = "#666;"
	content.style.width = "70%";

	// Style header
	cHeader.style.color = "#333"
	cHeader.style.marginBottom = "8px";

	// Style footer
	cFooter.style.textAlign = "center";
	cFooter.style.color = "#333"
	cFooter.style.marginTop = "8px";

	// Append header
	content.appendChild(cHeader);
	if (header) {

		// Setup header
		if (typeof(header) == "string") {

			// Prepare icon
			var elmIcon;
			if (icon) {
				elmIcon = document.createElement('img');
				elmIcon.src = icon;
				elmIcon.style.verticalAlign = '-8px';
				elmIcon.style.marginRight = '6px';
			} else {
				elmIcon = document.createElement('span');
			}

			// Prepare body
			var headerBody = document.createElement('span');
			headerBody.innerHTML = header;
			headerBody.style.fontSize = "1.6em";
			headerBody.style.marginBottom = "8px";

			// Nest
			cHeader.appendChild(elmIcon);
			cHeader.appendChild(headerBody);

		} else {
			cHeader.appendChild(header);
		}
	}

	// Append body
	if (body) {
		cBody.style.overflow = "auto";
		cBody.appendChild(body);
	}
	content.appendChild(cBody);

	// Append footer
	content.appendChild(cFooter);
	if (footer) {
		if (typeof(footer) == "string") {
			cFooter.innerHTML = footer;
		} else {
			cFooter.appendChild(footer);
		}
	}

	// Update vertical-centering information
	var updateMargin = function() {

		// Calculate outer-body dimentions
		var outerBodyHeight = cHeader.offsetHeight + cFooter.offsetHeight + 50;

		// Calculate max-height
		var bodyHeight = window.innerHeight - outerBodyHeight;
		cBody.style.maxHeight = bodyHeight + "px";

		// Calculate vertical position
		var top = (window.innerHeight-content.offsetHeight)/2;
		if (top < 0) top = 0;
		content.style.marginTop = top + "px";

	}

	// Close when clicking the floater
	floater.onclick = function() {
		if (!disposable) return;
		if (cbClose) {
			cbClose();
		} else {
			UserInteraction.hideInteraction();
		}
	}

	// Stop propagation in content
	content.onclick = function(event) {
		event.stopPropagation();
	}

	// Remove previous element
	UserInteraction.hideInteraction();

	// Append element in the body
	document.body.appendChild(floater);
	UserInteraction.activeScreen = floater;
	updateMargin();

	// Register updateMargin on resize
	this.onResize = updateMargin;

	// Return root element
	return floater;

}

/**
 * Create a license window
 */
UserInteraction.displayLicenseWindow = function( title, body, isURL, cbAccept, cbDecline ) {
	var cControls = document.createElement('div'),
		lnkSpacer = document.createElement('span'),
		cBody;

	// Prepare elements
	lnkSpacer.innerHTML = "&nbsp;";

	// Prepare iFrame or div depending on if we have URL or body
	if (isURL) {
		cBody = document.createElement('iframe'),
		cBody.src = body;
		cBody.width = "100%";
		cBody.height = 450;
		cBody.frameBorder = 0;
	} else {
		cBody = document.createElement('div');
		cBody.width = "100%";
		cBody.style.height = '450px';
		cBody.style.display = 'block';
		cBody.innerHTML = body;
	}

	// Prepare buttons
	var	lnkOk = UserInteraction.createButton('Accept License', '#E1E1E1');
		lnkCancel = UserInteraction.createButton('Decline License', '#FAFAFA');

	// Style controls
	cControls.style.padding = '6px';
	cControls.appendChild(lnkOk);
	cControls.appendChild(lnkSpacer);
	cControls.appendChild(lnkCancel);

	// Create framed window
	var elm;
	elm = UserInteraction.createFramedWindow({
		'body'  : cBody, 
		'header': title, 
		'footer': cControls, 
		'icon'  : ICON_LICENSE, 
		onClose : function() {
		   document.body.removeChild(elm);
		   if (cbDecline) cbDecline();
		}
	});

	// Bind link callbacks
	lnkOk.onclick = function() {
	   document.body.removeChild(elm);
	   if (cbAccept) cbAccept();
	};
	lnkCancel.onclick = function() {
	   document.body.removeChild(elm);
	   if (cbDecline) cbDecline();
	};
	
}

/** 
 * Confirm function
 */
UserInteraction.confirm = function( title, body, callback ) {
	var cBody = document.createElement('div'),
		cButtons = document.createElement('div');

	// Prepare body
	cBody.innerHTML = body;
	cBody.style.width = '100%';

	// Prepare buttons
	var	win,
		lnkOk = UserInteraction.createButton('Ok', '#E1E1E1'),
		lnkCancel = UserInteraction.createButton('Cancel', '#FAFAFA');

	lnkOk.onclick = function() {
		document.body.removeChild(win);
		callback(true);
	};
	lnkCancel.onclick = function() {
		document.body.removeChild(win);
		callback(false);
	};

	// Nest
	cButtons.appendChild(lnkOk);
	cButtons.appendChild(lnkCancel);

	// Display window
	win = UserInteraction.createFramedWindow({
		'body'  : cBody, 
		'header': title, 
		'footer': cButtons, 
		'icon'  : ICON_CONFIRM, 
		onClose : function() {
			document.body.removeChild(win);
			callback(false);
		}
	});

}

/** 
 * Alert function
 */
UserInteraction.alert = function( title, body, callback ) {
	var cBody = document.createElement('div'),
		cButtons = document.createElement('div');

	// Prepare body
	cBody.innerHTML = body;
	cBody.style.width = '100%';

	// Prepare button
	var win, lnkOk = UserInteraction.createButton('Ok', '#FAFAFA');
	lnkOk.onclick = function() {
		document.body.removeChild(win);
	};
	cButtons.appendChild(lnkOk);

	// Display window
	win = UserInteraction.createFramedWindow({
		'body'  : cBody, 
		'header': title, 
		'footer': cButtons, 
		'icon'  : ICON_ALERT
	});

}

/** 
 * License confirm (by buffer) function
 */
UserInteraction.confirmLicense = function( title, body, callback ) {
	UserInteraction.displayLicenseWindow(title, body, false, function(){
		callback(true);
	}, function() {
		callback(false);
	});
}

/** 
 * License confirm (by URL) function
 */
UserInteraction.confirmLicenseURL = function( title, url, callback ) {
	UserInteraction.displayLicenseWindow(title, url, true, function(){
		callback(true);
	}, function() {
		callback(false);
	});
}

/**
 * Handle interaction event
 */
UserInteraction.prototype.handleInteractionEvent = function( data ) {
	var socket = this.socket;

	// Confirmation window
	if (data[0] == 'confirm') {

		// Fire the confirmation function
		UserInteraction.confirm( data[1], data[2], function(result, notagain) {

			// Send back interaction callback response
			if (result) {
				socket.send("interactionCallback", {"result": UI_OK | (notagain ? UI_NOTAGAIN : 0) });
			} else {
				socket.send("interactionCallback", {"result": UI_CANCEL | (notagain ? UI_NOTAGAIN : 0) });
			}

		});

	}

	// Alert window
	else if (data[0] == 'alert') {

		// Fire the confirmation function
		UserInteraction.alert( data[1], data[2], function(result) { });

	}

	// License confirmation with buffer
	else if (data[0] == 'confirmLicense') {

		// Fire the confirmation function
		UserInteraction.confirmLicense( data[1], data[2], function(result, notagain) {

			// Send back interaction callback response
			if (result) {
				socket.send("interactionCallback", {"result": UI_OK | (notagain ? UI_NOTAGAIN : 0) });
			} else {
				socket.send("interactionCallback", {"result": UI_CANCEL | (notagain ? UI_NOTAGAIN : 0) });
			}

		});

	}

	// License confirmation with URL
	else if (data[0] == 'confirmLicenseURL') {

		// Fire the confirmation function
		UserInteraction.confirmLicenseURL( data[1], data[2], function(result, notagain) {

			// Send back interaction callback response
			if (result) {
				socket.send("interactionCallback", {"result": UI_OK | (notagain ? UI_NOTAGAIN : 0) });
			} else {
				socket.send("interactionCallback", {"result": UI_CANCEL | (notagain ? UI_NOTAGAIN : 0) });
			}

		});

	}


}