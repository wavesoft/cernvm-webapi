
/**
 * Cross-browser implementation of XML HTTP Request
 */
var XHRequest = {

	/**
	 * Cross-browser XML HTTP factory objects
	 */
	XMLHttpFactories:  [
	    function () {return new XMLHttpRequest()},
	    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
	    function () {return new ActiveXObject("Msxml2.XMLHTTP.3.0")},
	    function () {return new ActiveXObject("Msxml2.XMLHTTP.6.0")},
	    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
	    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
	],

	/**
	 * Send an XML HTTP Request
	 */
	request: function(url,callback,postData) {
	    var req = this.createXMLHTTPObject();
	    if (!req) return;
	    var method = (postData) ? "POST" : "GET";
	    req.open(method,url,true);
	    if (postData)
	        req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	    req.onreadystatechange = function () {
	        if (req.readyState != 4) return;
	        if (req.status != 200 && req.status != 304) {
	        	callback(null, req.status);
	            return;
	        }
	        callback(req.responseText);
	    }
	    req.ontimeout = function() {
	    	callback(null, false);
	    }
	    if (req.readyState == 4) return;
	    req.send(postData);
	},

	/**
	 * XML HTTP Object fractory for the different cases
	 */
	createXMLHTTPObject: function() {
	    var xmlhttp = false;
	    for (var i=0;i<this.XMLHttpFactories.length;i++) {
	        try {
	            xmlhttp = this.XMLHttpFactories[i]();
	        }
	        catch (e) {
	            continue;
	        }
	        break;
	    }
	    return xmlhttp;
	}


};