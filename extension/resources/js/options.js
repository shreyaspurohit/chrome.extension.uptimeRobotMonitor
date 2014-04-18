//Set of groups used to display the dropdown option in the Configured Monitors section
var groups = {};

/**
* The change handler for disable background notifications checkbox. The checked or not state is saved in chrome storage.
* When checked the background notification alarm is cleared. If clear fails, then restores the checkbox and stored state.
* When unchecked creates a new background refresh notification alarm.
*
*/
function saveDisableBkNotifications(){
	var checked = document.getElementById('chkDisableBkNotifications').checked;
	chrome.storage.sync.set({'disableBkNotifications': checked}, function(){
		console.log('saveDisableBkNotifications: disableBkNotifications: ' + checked);
		if(checked){
			clearRefreshForNotificationAlarm(function(){
				//On success, I am good
				getFStatus()('Background notifications disabled');
				clearStatus();				
			},function(){
				//On failure, just uncheck the checkbox back again & save with a status.
				document.getElementById('chkDisableBkNotifications').checked = false;
				chrome.storage.sync.set({'disableBkNotifications': false});
				getFStatus()('Error occured while disabling background notifications.');
				clearStatus();
			});			
		}else{
			createRefreshForNotificationAlarm();
		}
	});
}

/**
* Restores the background notification checkbox state when options page is loaded.
*/
function restoreDisableBkNotifications(){
	withDisableBkNotifications(function(disableBkNotifications){
		console.log('restore disableBkNotifications: ' + disableBkNotifications);
		if(undefined != disableBkNotifications){
			document.getElementById('chkDisableBkNotifications').checked = disableBkNotifications;			
		}
	});	
}

/**
* The change handler for refresh interval checkbox. Saves the new refresh interval in storage and resets the 
* background refresh alarm if background notifications are enabled. Validates the interval is a number.
*
*/
function saveRefreshInterval(){
	var interval = document.getElementById('txtRefreshInterval').value;
	if(isNaN(interval)){
		getFStatus()('Refresh interval ' + interval + ' is not a number. Nothing saved.');
		clearStatus();
		return;
	}
	chrome.storage.sync.set({'refreshInterval': interval}, function(){
		getFStatus()('Updated refresh interval to ' + interval + ' min');
		clearStatus();
		withDisableBkNotifications(function(disableBkNotifications){// Make sure background notifications are enabled
			if(undefined == disableBkNotifications || 
					disableBkNotifications ==  false){
				resetRefreshForNotificationAlarm();
			}
		});
		
	});
}

/**
* Restores the text in the refresh interval textbox when options page is loaded.
*/
function restoreRefreshInterval(){
	chrome.storage.sync.get('refreshInterval', function(item){
		console.log('restoreRefreshInterval: ' + JSON.stringify(item));
		if(undefined != item['refreshInterval']){
			document.getElementById('txtRefreshInterval').value = item['refreshInterval'];
		}else{
			document.getElementById('txtRefreshInterval').value = 1;
		}
	});
}

/**
* Adds the new monitor to the storage on click of the 'Add' button. Does the required validations.
* 1. API Key has to be unique.
* 2. API Key can't be empty.
*
* A new monitor is created and saved which is of the form:
*	{
*		'monitorKey': apiKey,
*		'monitorColor': color,
*		'monitorName': name,
*		'monitorGroup': group
*	}
*/
function saveMonitor(){
  var fStatus = getFStatus();
  var color = document.getElementById('txtApiColor').value;
  var apiKey = document.getElementById('txtApiKey').value;
  var name = document.getElementById('txtName').value;
  var group = document.getElementById('txtGroup').value;
  
  groups[group] = true;
  
  if(apiKey == null || 
     (apiKey != null && apiKey.trim() == '')){
	 fStatus('API Key cant be empty');
	 clearStatus();
	 return;
  }
  
  chrome.storage.sync.get('monitors', function(data){
	var monitors = data['monitors'];
	console.log("Monitors: " + JSON.stringify(monitors));
	if(!(monitors instanceof Array)){
		//The first time initialization
		monitors = []
	}
	
	//Validate not a duplicate key
	for(var i=0; i < monitors.length; i++){
		var monitor = monitors[i];
		if(mApiKey(monitor) == apiKey){
			fStatus('Duplicate API Key');
			clearStatus();
			return;
		}
	}
	
	monitors.push({
		'monitorKey': apiKey,
		'monitorColor': color,
		'monitorName': name,
		'monitorGroup': group
	});
	
	fStatus('Saving..');
	save('monitors', monitors, fStatus, 'Monitor API key added');
	
	//Clear the current API key and name
	document.getElementById('txtApiKey').value = '';
	document.getElementById('txtName').value = '';
  });   
}

/**
* Saves the {key : value} in storage, on success invokes fStatus(message). 
* Restores/Refreshes the saved options page.
*
*/
function save(key, value, fStatus, message){
	var saveData = {};
	saveData[key] = value; //Must initialize later to eval key to real value in the object saved.
	
	chrome.storage.sync.set(saveData,function() {
			console.log('saved: ' + JSON.stringify(saveData) + ', error: ' + JSON.stringify(chrome.runtime.lastError));			
			if('undefined' == typeof chrome.runtime.lastError ||
			    'undefined' == typeof chrome.runtime.lastError.message){				
				// Update status to let user know options were saved.			
				fStatus(message);
				restoreOptions();
			}else{				
				fStatus('Error while saving. Amount of data stored exceeded limit.');
			}
			clearStatus();
	  });
}

/**
* Clears every thing. Status, set of groups, all data stored.
*/
function clearAll(){
	chrome.storage.sync.clear(function(){
		var status = document.getElementById('status');			
		status.textContent = 'Removed all data';
		restoreOptions();
		groups = {};
		clearStatus();
	});
}

/**
* Just clears the status on the options page.
*/
function clearStatus(){
	var status = document.getElementById('status');			
	setTimeout(function() {
			  status.textContent = '';
	}, 1500);
}

/**
* Creates a curried funtion that aids in displaying message on the status in Options page.
* 
* @returns {function} A function that takes string input and displays on the status in Options page.
*/
function getFStatus(){
	var status = document.getElementById('status');
	return function(text){
		status.textContent = text;
	}
}

/**
* Creates a function that on executing can delete a configured monitor for the input monitor api key.
* 
* @param {string} apiKey The monitor apikey represeting the monitor that must be deleted.
*/
function deleteKeyHandler(apiKey){
	return function(){
		changeAndSave(apiKey, function(monitors, selected, apiKey){
			monitors.splice(selected, 1);			
			return 'Monitor API key ' + apiKey + ' deleted';
		});		
	};
}

/**
* Creates a function that on execution saves the selected monitors changed color, name and group.
*
* @param {string} apiKey The monitor apiKey to consider while saving changes
* @param {int} index The index of the monitor in the array of monitors.
*/
function saveKeyHandler(apiKey, index){
	return function(){		
		changeAndSave(apiKey, function(monitors, selected, apiKey){
			var monitor = monitors[selected];
			setMColor(monitor, document.getElementById('txtApiColor' + index).value);
			setMName(monitor, document.getElementById('txtName' + index).value);
			var select = document.getElementById('txtGroup' + index);
			var group = select.options[select.selectedIndex].value;
			setMGroup(monitor, group);			
			return 'Updated api key ' + apiKey;
		});
	};
}

/**
*  Iterates through all the monitors, invoking the callback when the monitor with input arg apiKey is found, for allowing any required todo changes. Expects a message 
* from this callback that might be showed as a status. Saves the changed monitor in storage.
* 
* @param {string} apiKey The monitor API key to consider.
* @param {function} chageCallBack  The function to invoke with array of monitors, index of the monitor within the array, and the apiKey of the monitor in consideration.
*/
function changeAndSave(apiKey, changeCallBack){

	forEachMonitor(function(i, monitor, monitors){
		if(mApiKey(monitor) == apiKey){
			var message = changeCallBack(monitors, i, apiKey);
			//Now save the monitors again and restore
			save('monitors', monitors, getFStatus(), message);
		}
	});
	
	/*chrome.storage.sync.get('monitors', function(data) {
			var monitors = data['monitors'];
			if(undefined != monitors){
				console.log("changeAndSave: Monitors: " + JSON.stringify(monitors));
				var selected = -1;
				for(var i=0; i<monitors.length; i++){
					var monitor = monitors[i];					
					if(mApiKey(monitor) == apiKey){
						selected = i;
					}
				}
				if(selected != -1){
					var message = changeCallBack(monitors, selected, apiKey);
					//Now save the monitors again and restore
					save('monitors', monitors, getFStatus(), message);
				}
		}
	}); */
}

/**
* The handler invoked when DOMContentLoaded. Restores the current saved state of the options.
*
*/
function restoreOptions() {
	
  /**
  * Iterates through the children of monitor div's and removes them.
  * 
  * @param {HTML Div} configuredMonitorDiv The div having the monitors to be cleared
  */
  function removeExistingMonitors(configuredMonitorDiv){
	  while (configuredMonitorDiv.firstChild) {
		configuredMonitorDiv.removeChild(configuredMonitorDiv.firstChild);
	  }
  }
  
  /**
  * Creates the delete button for the input arg monitor.
  * 
  * @param {monitor} The monitor to delete on click on the button
  * @return {HTML input button} The button that deletes the saved monitor
  */
  function createDeleteMonitorButton(monitor){
	var delBtn = document.createElement('input');
	delBtn.setAttribute('class', 'deleteBtn');
	delBtn.setAttribute('type', 'button');
	delBtn.addEventListener('click', deleteKeyHandler(mApiKey(monitor)));
	return delBtn;
  }
  
  /**
  * Creates the delete button for the input arg monitor.
  *
  * @param {monitor} The monitor to save on click on the button
  * @param {int} i The index of the monitor in the array of monitors
  * @return {HTML input button} The button that saves the changed monitor
  */
  function createSaveMonitorButton(monitor, i){
	var saveBtn = document.createElement('input');
	saveBtn.setAttribute('class', 'saveBtn');
	saveBtn.setAttribute('type', 'button');
	saveBtn.addEventListener('click', saveKeyHandler(mApiKey(monitor), i));
	return saveBtn;
  }
  
  /**
  * Creates a HTML select option with the global 'groups' attribute.
  *
  * @param {string} selectedValue The value to be selected in teh HTML select
  * @param {string} id The HTML id to set for the select element
  */
  function createGroupList(selectedValue, id){
	var select = document.createElement('select');
	select.setAttribute('id', id);
	for(var g in groups){
		var option = document.createElement('option');
		option.setAttribute('value', g);
		option.appendChild(document.createTextNode(g));
		if(g == selectedValue){
			option.selected = true;
		}
		select.appendChild(option);
	}
	return select;
  }
  
  /**
  * Restores the global group variable with the data in monitors in the array.
  *
  * @param {array} monitors The array of monitors to consider
  */
  function restoreGroupsList(monitors){
	for(var i=0; i<monitors.length; i++){
		var m = monitors[i];
		groups[mGroup(m)] = true;
	}
  }
  
  /**
  * Restores the total bytes consumed by this extension in the options UI.
  */ 
  function restoreTotalBytes(){
	chrome.storage.sync.getBytesInUse(null, function(bytesInUse){
		document.getElementById('totalBytes').textContent = '(' + (bytesInUse/1000) + ' KB)';
	});
  }
  
  /**
  * Creates all the monitors configured and saved in the input arg div.
  *
  * @param {HTML Div} configuredMonitorDiv The div to append all the configured monitors to
  * @param {array} monitors The array of monitors
  */
  function createMonitorsInDiv(configuredMonitorDiv, monitors){
		//Restore the configured monitors
		for(var i=0; i<monitors.length; i++){
			var monitor = monitors[i];
			//Use the default span template, clone and reuse
			var spanMonitorClone = spanTemplate.cloneNode(true);
			spanMonitorClone.setAttribute('id', 'configuredKey'+i);
			spanMonitorClone.querySelector("#txtApiKey").value = mApiKey(monitor);
			spanMonitorClone.querySelector("#txtApiKey").disabled = true;
			spanMonitorClone.querySelector("#txtApiKey").setAttribute('id', 'txtApiKey'+i);
			spanMonitorClone.querySelector("#txtApiColor").setAttribute('value', '');
			
			// bind jscolor
			var col = new jscolor.color(spanMonitorClone.querySelector("#txtApiColor"));
			col.fromString(mColor(monitor));		
			spanMonitorClone.querySelector("#txtApiColor").setAttribute('id', 'txtApiColor'+i);
			
			spanMonitorClone.querySelector("#txtName").value = mName(monitor);
			spanMonitorClone.querySelector("#txtName").setAttribute('id', 'txtName'+i);
			
			//Convert the template group textbox to HTML select
			spanMonitorClone.removeChild(spanMonitorClone.querySelector("#txtGroup"));
			spanMonitorClone.appendChild(createGroupList(mGroup(monitor), 'txtGroup' + i));
						
			//Add the delete and update button
			spanMonitorClone.appendChild(createDeleteMonitorButton(monitor));			
			spanMonitorClone.appendChild(createSaveMonitorButton(monitor, i));
			
			var divWrapper = document.createElement('div');
			divWrapper.appendChild(spanMonitorClone);
			configuredMonitorDiv.appendChild(divWrapper);
		}  
  }
  
  var spanTemplate = document.getElementById('configureMonitorDiv');  
  var configuredMonitorDiv =  document.getElementById('configuredMonitorDiv');
  
  restoreRefreshInterval();
  restoreDisableBkNotifications();
  
  //Remove existing monitors
  removeExistingMonitors(configuredMonitorDiv);
  
  //Repaint by getting latest data
  chrome.storage.sync.get('monitors', function(data) {
    var monitors = data['monitors'];
	if(undefined != monitors){
		console.log("restoreOptions: Monitors: " + JSON.stringify(monitors));
		//Restore the list of groups to be displayed in each configured monitor
		restoreGroupsList(monitors);
		//Restore the total bytes in use
		restoreTotalBytes();
		//Create all the monitors in div configuredMonitorDiv
		createMonitorsInDiv(configuredMonitorDiv, monitors);
	}		
  });    
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.addEventListener('DOMContentLoaded', function(){
	document.getElementById('add').addEventListener('click', saveMonitor);	
	document.getElementById('clear').addEventListener('click', clearAll);	
	document.getElementById('txtRefreshInterval').addEventListener('change', saveRefreshInterval);
	document.getElementById('chkDisableBkNotifications').addEventListener('change', saveDisableBkNotifications);
});
