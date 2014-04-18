chrome.runtime.onSuspend.addListener(function(){
	console.log("background.js: onSuspend");
});

chrome.runtime.onSuspendCanceled.addListener(function(){
	console.log("background.js: onSuspendCanceled");
});

//When the plugin is installed or when browser is started, reset the states for the background page to process cleanly. 
//Create the background notification refresh alarm only if it is not disabled in the options.
chrome.runtime.onInstalled.addListener(setUp);
chrome.runtime.onStartup.addListener(setUp);

//When alarm with name browserActionResetIcon is triggered, resets to the default browser icon and tooltip.
chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name == "browserActionResetIcon"){
		console.log("background.js: browserActionResetIcon at " + new Date());		
		chrome.browserAction.setIcon({path: {'19': '../../images/icon19.png', '38': '../../images/icon38.png'}}, function(){
			console.log("setBrowserActionDefaultIcon");
			chrome.storage.sync.set({'baIcon' : ''});
		});
		chrome.browserAction.setTitle({title: 'Uptime Robot'});
	}
});

//When the alarm with name refreshForNotification is triggered, goes through the monitors and displays appropriate success/failure notifications.
//This also changes the browser action icon based on the monitor status.
chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name == "refreshForNotification"){
		console.log("background.js: refreshForNotification at " + new Date());		
		chrome.notifications.getPermissionLevel(function(level){
			console.log('Permission for notification: ' + level);
		});
		
		forEachMonitor(function(i, monitor, monitors){
			var url = getMonitorStatusUrl(mApiKey(monitor));
			//Some problem using the API key. Do a chrome notification of the same.					
			var http = new HttpClient();			
			http.get(url, function(data){
				console.log('URL: ' + url + ', response: ' + data);
				var response = JSON.parse(data);
				if(response.stat == 'ok'){ 
					handleMonitorStatus(response, monitor);
				}else{
					//Some problem using the API key. Do a chrome notification of the same.
					createErrorNotification(mApiKey(monitor), 
						"Error retrieving data for API key " + mApiKey(monitor), 
						"Please check if your API key is valid. Server response for this key is '" + response.message + '"');
				}
			});
		});
	}else{
		console.log("background.js: alarm event ignored: " + alarm.name);
	}		
});

/**
* Sets up the required alarms and the initial defaults for this event page to work. 
*
*/
function setUp(){
	console.log("background.js: onInstalled");
	chrome.storage.sync.set({'totalDown' : 0});
	chrome.storage.sync.set({'baIcon' : ''});
	forEachMonitor(function(i, monitor, monitors){
		var setter = {};
		setter[mServerDownNotification(monitor)] = false;
		chrome.storage.sync.set(setter);
	});
	chrome.browserAction.setTitle({title: 'Uptime Robot'});
	withDisableBkNotifications(function(disableBkNotifications){
		console.log('background.js: disableBkNotifications: ' + disableBkNotifications);
		if(undefined == disableBkNotifications || disableBkNotifications == false){
				createRefreshForNotificationAlarm();
		}else{
				clearRefreshForNotificationAlarm();
		}
	});	
}

/**
* Creates a string prefixed with monitor API followed by '-serverDownNotification'
*
* @param {monitor} monitor The monitor to use to generate the string.
*/
function mServerDownNotification(monitor){
	return mApiKey(monitor) + '-serverDownNotification';
}

/**
* Handles the status of the monitor. Handles server down status of 9 and server up status of 2.
* When server is down, a chrome desktop notification is displayed only if it was not shown previously for the same monitor. The browser action icon is set to down.
* When server is up, a chrome desktop notification is displayed, and the browser action icon is changed to up only if all the servers are up.
*
*/
function handleMonitorStatus(response, monitor){		
	chrome.storage.sync.get(mServerDownNotification(monitor), function(data){		
		var notification = data[mServerDownNotification(monitor)];		
		console.log('handleMonitorStatus: notification:: ' + notification);
		if(isAccountApiKey(monitor)){
			var allMonitorsInResponse = response.monitors.monitor;
			if(undefined != allMonitorsInResponse && allMonitorsInResponse.length > 0){
				var allMonitorsInResponseUp = true;
				for(var i = 0; i < allMonitorsInResponse.length; i++){
					var aMonitor = allMonitorsInResponse[i];
					if(aMonitor.status == 9){
						allMonitorsInResponseUp = false;
					}
				}
				
				if((notification ==  false || undefined == notification) 
							&& allMonitorsInResponseUp == false){ //Previously not notified and all monitors in this response is not up			
					//do action down		
					doActionDown(monitor);
				}else if(notification ==  true && allMonitorsInResponseUp == true){//Previously notified as server down but not in current response, change to server up			
					//do action up
					doActionUp(monitor);
				}
			}
		}else{
			var aMonitor = response.monitors.monitor[0];
			if(aMonitor.status == 9){  //Server down status			
					if(notification ==  false || undefined == notification){ //Previously not notified			
						//do action down
						doActionDown(monitor);
					}
			}else if(aMonitor.status == 2){ //Server up status			
					if(notification ==  true){	//Previously notified as server down, change to server up			
						//do action up
						doActionUp(monitor);
					}
			}//0 : monitor paused status
		}
	});		
}

/**
* Does the stuff to take care when monitors associated with a API key goes down. Also, displays the error notification.
*
* @param {monitor} The monitor for which down action needs to be taken.
*/
function doActionDown(monitor){
	incrementNumberOfDownServers();
	setBrowserActionDownIcon();
	var title = "Server " + mName(monitor) + " Down";
	var message = "Server with name " + mName(monitor)+ " belonging to group " + mGroup(monitor) + " is down";
	if(isAccountApiKey(monitor)){
		title = mName(monitor) + " server down";
		message = "Atleast one of the server for " + mName(monitor)+ " belonging to group " + mGroup(monitor) + " is down";
	}	
	createErrorNotification(mApiKey(monitor), 
		title, 
		message, function(id){
			var setter = {};
			setter[mServerDownNotification(monitor)] = true; //Set notified
			chrome.storage.sync.set(setter);
		});	

}

/**
* Does the stuff to take care when monitors associated with a API key goes up. Also, displays the success notification.
*
* @param {monitor} The monitor for which up action needs to be taken.
*/
function doActionUp(monitor){
	decrementNumberOfDownServers(setBrowserActionUpIcon);
	var title = "Server " + mName(monitor) + " Up";
	var message = "Server with name " + mName(monitor) + " belonging to group " + mGroup(monitor) + " is up";
	
	if(isAccountApiKey(monitor)){
		title = "All " + mName(monitor) + " servers up";
		message = "Servers for " + mName(monitor) + " belonging to group " + mGroup(monitor) + " are up";
	}
	createSuccessNotification(mApiKey(monitor), 
		title,
		message, function(id){
			var setter = {};
			setter[mServerDownNotification(monitor)] = false; //Reset to not notified, idea is to toggle between success and failure notification but only and exactly one each of notification
			chrome.storage.sync.set(setter);
		});					
}

/**
* Sets the browser action icon to down if it is previously not down and sets the tooltip to server down.
*/
function setBrowserActionDownIcon(){
	currentBaIcon(function(curIcon){
		console.log('setBrowserActionDownIcon: ' + curIcon)
		if(undefined == curIcon || curIcon != 'down'){
			chrome.browserAction.setIcon({path: {'19': '../../images/down19.png', '38': '../../images/down38.png'}}, function(){
				console.log("setBrowserActionDownIcon");
				chrome.storage.sync.set({'baIcon' : 'down'});
			});
			chrome.browserAction.setTitle({title: 'Uptime Robot: One or more server is down'});
		}
	});
}

/**
* Sets the browser action icon to up, if no servers are down and presently the icon is a down icon. Creates the browser action reset icon alarm which 
* gets triggered after 1min of displaying up icon. Also, sets the tooltip to servers are up.
*/
function setBrowserActionUpIcon(){
	getNumberOfDownServers(function(totalDown){
		console.log('setBrowserActionUpIcon: totalDown:: ' + totalDown);
		if(totalDown <= 0){
			currentBaIcon(function(curIcon){
				if(curIcon == 'down'){
					chrome.browserAction.setIcon({path: {'19': '../../images/up19.png', '38': '../../images/up38.png'}}, function(){
						console.log("setBrowserActionUpIcon");
						chrome.storage.sync.set({'baIcon' : 'up'});
						createBrowserActionResetIconAlarm(1);
					});
					chrome.browserAction.setTitle({title: 'Uptime Robot: All servers up'});
				}
			});
		}
	});		
}

/**
* Gets the current browser action icon set from storage in async and invokes the callback.
* 
* @param {function} callback The funtion to invoke with string arg current icon retrieved from storage.
*/
function currentBaIcon(callback){
	chrome.storage.sync.get('baIcon', function(item){
		var curIcon = item['baIcon'];
		callback(curIcon);		
	});	
}

function incrementNumberOfDownServers(callback){
	addToNumberOfDownServer(1, callback);
}

function decrementNumberOfDownServers(callback){
	addToNumberOfDownServer(-1, callback);
}

function getNumberOfDownServers(callback){
	addToNumberOfDownServer(0, callback);
}

/**
* Updates the state of the number of servers that are currently down in storage in async. The input arg addVal is added to current state and invokes the callback
* with the new total of servers that are down.
* 
* @param {int} addVal Positive or Negative integer to add to the current state of total servers that are down.
* @param {function} callback A callback function that is invoked with integer representing total number of servers currently down.
*/
function addToNumberOfDownServer(addVal, callback){
	chrome.storage.sync.get('totalDown', function(item){
		var totalDown = item['totalDown']
		if(undefined == totalDown){
			totalDown = 0;
		}
		
		totalDown = totalDown + addVal;
		console.log('Current number of servers down: ' + totalDown);
		chrome.storage.sync.set({'totalDown' : totalDown}, function(){
			if(undefined != callback){
				callback(totalDown);
			}
		});
	});
}