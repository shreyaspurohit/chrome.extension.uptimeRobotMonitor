$(document).ready(function(){
	
	//Open the Options page when clicked
	$('#btnOptions').click(function(){
		console.log('btnOptions: clicked');
		var optionsPage = chrome.runtime.getURL('../../resources/html/options.html');
		window.open(optionsPage);				
	});
	
	//Split configured monitors into groups
	var monitorGroupsArray = {};
	var femCallback = function(i, monitor, monitors){
		var array = monitorGroupsArray[mGroup(monitor)];
		if(array == undefined){
			monitorGroupsArray[mGroup(monitor)] = [];
		}
		monitorGroupsArray[mGroup(monitor)].push(monitor);
	};
	//Executed after all the monitors are iterated through
	femCallback.done = function(){
		console.log('monitorGroupsArray: ' + JSON.stringify(monitorGroupsArray));
		//Process each group
		for(var group in monitorGroupsArray){
			processGroup(group, monitorGroupsArray[group]);
		}		
	};	
	forEachMonitor(femCallback);		
});

/**
* This is needed to avoid the scroll bar from being invisible when the number monitors is more than the
* it can fit in one popup page of chrome extension browser action.
* Also, to resize the browser action window when accordian is resized
*/
function hackForChromeScrollBarNotVisible(){	
	$('body').height($('#allContent').height());
	$('body').width($('#allContent').width());
	$('html').height($('#allContent').height());
	$('html').width($('#allContent').width());
}

/**
* Processes each group, creates the required surrounding div's and 
* invokes the monitor plugin to add visualization.
*
* @param {key} group The name of the group in the array of monitorGroupsArray to consider.
* @param {array} monitors The array of monitors.
*/
function processGroup(group, monitors){
	console.log('Processing group: ' + group);
	//Create a new div for this group
	var newDivIdOuter = 'divOuter_' + sanitizeString(group) + '_' + Date.now();
	var newDivIdOuterSel = '#' + newDivIdOuter;
	var newDivId = 'div_' + sanitizeString(group) + '_' + Date.now();
	var newDivIdSel = '#' + newDivId;
	
	$('#monitors').append($('<div></div>').attr('id', newDivIdOuter));//Add outer div
	$(newDivIdOuterSel).append($('<h3><div class="inset"><label>' + group + '</label></div></h3>'));//Create the accordian header
	$(newDivIdOuterSel).append($('<div></div>').attr('id', newDivId));//Create the accordian content
	
	//Process all monitors in this group	
	//Max 5 per row per group
	while(monitors.length){
		var currentSet = monitors.splice(0, 5);
		var monitorConfs = [];
		for(var i in currentSet){
			console.log('Monitor key: ' + mApiKey(currentSet[i]));
			//Convert to i/p of jquery plugin if it is a monitor key and not account key
			if(isAccountApiKey(currentSet[i])){//Account API Key, just draw it
				invokeUptimeRobotMonitorForAccountAPIKey(newDivIdSel, currentSet[i], sanitizeString(group) + '_' + Date.now());
			}else{
				//A monitor key, collect configuration and invoke later
				addToMonitorConfs(monitorConfs, currentSet[i]);
			}
		}
		if(monitorConfs.length > 0){
			//Invoke jquery create monitors plugin on the accordian content div				
			invokeUptimeRobotMonitor(newDivIdSel, monitorConfs, sanitizeString(group) + '_' + Date.now());
		}
	}
	//Create the accordian for this group
	createGroupAccordian(newDivIdOuterSel);
}

/**
* Creates the accordian for the group at jquery selector newDivIdOuterSel.
*
* @param {jQuery selector} newDivIdOuterSel The jQuery selector used to create the accordian.
*/
function createGroupAccordian(newDivIdOuterSel){
	$(newDivIdOuterSel).accordion({
		collapsible: true,
		heightStyle: "content",
		active: false,
		animate: 100,
		activate: hackForChromeScrollBarNotVisible
	});				
}

/**
* Invokes the plugin uptimeRobotMonitor to add monitor visualization.
*
* @param {jQuery selector} newDivIdSel The container to use for the monitor visualization.
* @param {array} monitorConfs Array of monitor configuration as defined in the plugin uptimeRobotMonitor.
* @param {html id} containerId The id of the canvas that is created for this visualization.
*
*/
function invokeUptimeRobotMonitor(newDivIdSel, monitorConfs, containerId){
	$(newDivIdSel).uptimeRobotMonitor({
		'monitorConfs': monitorConfs,
		'containerId': containerId,
		'refresh': false,
		'width': '780',
		'height': '200'
	});				
}

/**
* Invokes the plugin uptimeRobotMonitor in Account mode to add monitor visualization.
*
* @param {jQuery selector} newDivIdSel The container to use for the monitor visualization.
* @param {monitor} monitor Monitor configuration as defined in the plugin uptimeRobotMonitor.
* @param {html id} containerId The id of the canvas that is created for this visualization.
*/
function invokeUptimeRobotMonitorForAccountAPIKey(newDivIdSel, monitor, containerId){
	$(newDivIdSel).uptimeRobotMonitor({
		'mainApiKey': mApiKey(monitor),
		'numOfMonitorsPerRow': 5,
		'allMonitorDefaultColor': mColor(monitor),
		'containerId': containerId,
		'refresh': false,
		'width': '780',
		'height': '200'
	});
}

/**
* Reads the monitor and creates the corresponding monitor configuration.
* 
* @param {array} monitorConfs The array to push to the new monitor configuration created using the currentSet 
* @param {monitor} currentSet The monitor to read and create the required configuration.
*/
function addToMonitorConfs(monitorConfs, currentSet){
	monitorConfs.push({
		apiKey: mApiKey(currentSet),
		name: mName(currentSet),
		color: mColor(currentSet)
	});
}