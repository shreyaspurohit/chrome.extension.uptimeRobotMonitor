/**
* Gets, clears and resets the alarm with name 'refreshForNotification' with current saved refresh interval
*
*/
function resetRefreshForNotificationAlarm(){
	chrome.alarms.get('refreshForNotification', function(alarm){
		//If alarm was already created, clear it and reset to new
		if(null != alarm && alarm.name == 'refreshForNotification'){
			clearRefreshForNotificationAlarm(createRefreshForNotificationAlarm);
		}
	});
}

/**
* Creates a alarm with name 'refreshForNotification' based on the saved option 'refreshInterval'. If none 'refreshInterval' is found default interval is
* 1min. The alarm repeats every 'refreshInterval' indefinitely till back ground notification option is disabled.
*
*/
function createRefreshForNotificationAlarm(){
	chrome.storage.sync.get('refreshInterval', function(item){
		var interval = item['refreshInterval'];
		if(undefined == interval){
			interval = '1';
		}
		console.log('options.js: createRefreshForNotificationAlarm: ' + JSON.stringify(item) + ', value: ' + parseFloat(interval));
		chrome.alarms.create('refreshForNotification', {
			when: 0.0,
			periodInMinutes: parseFloat(interval)
		});			
	});	
}

/**
* Clears the alarm with name 'refreshForNotification', invokes 'callbackOnClearSuccess' when alarm is cleared, and 'callbackOnClearFailure' when alarm is not cleared.
*
*/
function clearRefreshForNotificationAlarm(callbackOnClearSuccess, callbackOnClearFailure){
	try{
		chrome.alarms.clear('refreshForNotification', function(isCleared){
			onCleared(isCleared, callbackOnClearSuccess, callbackOnClearFailure);
		});
	}catch(err){//Must do this as the document and the real behaviour doesnt match. Don't know which method signature is the future state.
			if(err.message == "Invocation of form alarms.clear(string, function) doesn't match definition alarms.clear(optional string name)"){
				chrome.alarms.clear('refreshForNotification');
				chrome.alarms.get('refreshForNotification', function(alarm){
					console.log('>>clear: ' + JSON.stringify(alarm));
					if(undefined != alarm){
						onCleared(false, callbackOnClearSuccess, callbackOnClearFailure);
					}else{
						onCleared(true, callbackOnClearSuccess, callbackOnClearFailure);
					}
				});
			}else{
				throw err;	
			}
	}
	
	function onCleared(wasCleared, callbackOnCleared, callbackOnNotCleared){
		console.log('clearRefreshForNotificationAlarm: wasCleared:: ' + wasCleared);
		if(wasCleared){			
			undefined != callbackOnCleared && callbackOnCleared();
		}else{
			undefined != callbackOnNotCleared && callbackOnNotCleared();
			console.log('Could not clear alarm refreshForNotification');
		}
	}
}

/**
* Creats a alarm with name 'browserActionResetIcon' that executes input arg min after.
*
* @param {int} min The delay in minutes after alarm is created for the onAlarm to trigger.
*/
function createBrowserActionResetIconAlarm(min){
	console.log('Creating browserActionResetIcon Alarm, min: ' + min);
	chrome.alarms.create('browserActionResetIcon', {
		delayInMinutes: min
	});
}
