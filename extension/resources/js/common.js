var UROB_API_URL = "http://api.uptimerobot.com/";

/**
* A simple HttpClient class to invoke GET requests.
*
* @this {HttpClient}
*/
var HttpClient = function() {
	/**
	* HTTP GET request is executed on the input arg url and the callback invoked with the response text
	* 
	* @param {URL} url The HTTP GET url
	* @param {function} callback The function executed with the response text when GET is successful
	*/
    this.get = function(url, callback) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() { 
            if (httpRequest.readyState == 4 && httpRequest.status == 200){
                callback(httpRequest.responseText);
			}
        }

        httpRequest.open( "GET", url, true );            
        httpRequest.send( null );
    }
}

/**
* Creates the URL with request args to invoke to get uptime robot monitor status's.
*
* @param {string} apiKey The monitor API key from uptimerobot.com
*/
function getMonitorStatusUrl(apiKey){
	return UROB_API_URL + "getMonitors?format=json&noJsonCallback=1&apiKey=" + apiKey;
}

/**
* A for loop that gets monitors from storage in async, and iterates by invoking the callback function for each monitor.
*
* @param {function} callback The callback function invoked for every monitor with args (index, monitor, monitorsArray)
*/
function forEachMonitor(callback){
	chrome.storage.sync.get('monitors', function(data){
			var monitors = data['monitors'];
			if(undefined != monitors){
				for(var i=0; i<monitors.length; i++){
					callback(i, monitors[i], monitors);					
				}
			}
			undefined != callback.done && callback.done();
	});
}

/**
* Retrieves the state of disable background notification option in async and invokes the callback with it.
*
* @param {function} callback The callback function with arg boolean that gets invoked with current state of the option.
*/
function withDisableBkNotifications(callback){
	chrome.storage.sync.get('disableBkNotifications', function(item){
		callback(item['disableBkNotifications']);		
	});
}

/**
* Sanitizes the string by removing all space's
* @param {string} inStr The input string 
* @return {string} The string with no spaces in it
*/
function sanitizeString(inStr){
	return inStr.replace(/\s+/g, '');
}

/**
* Checks if the API key provided is Account or not. If the API key starts with 'u' then it is account API key else it will be considered monitor API key.
* 
* @param {monitor} The monitor configured in UptimeRobot options which defines the Monitor.
* @return {boolean} True if it is Account API key else false.
*
*/
function isAccountApiKey(monitor){
	return mApiKey(monitor).slice(0, 1).toLowerCase() == 'u';
}

function mApiKey(monitor){
	return monitor['monitorKey'];
}

function mColor(monitor){
	return monitor['monitorColor'];
}

function mName(monitor){
	return monitor['monitorName'];
}

function mGroup(monitor){
	return monitor['monitorGroup'];
}

function setMColor(monitor, color){
	monitor['monitorColor'] = color;
}
function setMName(monitor, name){
	monitor['monitorName'] = name;
}
function setMGroup(monitor, group){
	monitor['monitorGroup'] = group;
}