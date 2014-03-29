/**
* Create an error notification
*
* @param {string} id Unique identifier for the notification
* @param {string} title The title of the notification
* @param {string} message The message to display in the notification
* @param {function} cb The callback funtion invoked once the notification is created
*/
function createErrorNotification(id, title, message, cb){
	createNotification(id, title, message, cb, "../../images/down48.png");
}

/**
* Create a success notification
*
* @param {string} id Unique identifier for the notification
* @param {string} title The title of the notification
* @param {string} message The message to display in the notification
* @param {function} cb The callback funtion invoked once the notification is created
*/
function createSuccessNotification(id, title, message, cb){
	createNotification(id, title, message, cb, "../../images/up48.png");
}

/**
* Create a chrome notification. If there exists a previous notification for the same input arg id, then it is cleared. The callback cb is
* invoked after creating the notification successfully.
* 
* @param {string} id Unique identifier for the notification
* @param {string} title The title of the notification
* @param {string} message The message to display in the notification
* @param {function} cb The callback funtion invoked once the notification is created
* @param {URL} iconUrl The URL of the icon to use in the notification 
*/ 
function createNotification(id, title, message, cb, iconUrl){
	//Clear notification if there is one so that it pops up.
	chrome.notifications.clear(id, function(wasCleared){
		console.log("createNotification:  wasCleared:: " + wasCleared);
		chrome.notifications.create(id, {
			type: "basic",
			iconUrl: iconUrl,
			title: title,
			message: message,
			eventTime: Date.now()
		}, function(id){
			console.log('Notification Callback: ' + id);
			if(cb != undefined && id != undefined){
				cb(id);
			}
		});
	});	
}
