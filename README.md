![](http://i.imgur.com/rIW1C0j.png)

Chrome UptimeRobot Monitor Extension
====================================

A chrome extension that uses UptimeRobot (http://uptimerobot.com/) API's to display server statuses using Monitor or Account API's at a click of the button. The extension is also capable of providing desktop notifications of server up and down statuses. 

Download
--------

You can download the chrome extension from the chrome web store.

[ ![](http://i.imgur.com/TKHi272.png) ] (http://bit.ly/1mdSnjs "webstore")

Usage
-----

Install the extension. Go to the options by either clicking the setting buttons in the browser action popup or from the extensions page. Configure the required options. Add moniter and/or account API keys that you get from your UptimeRobot.com control panel. Provide a good name, a group and a color to the monitor. You can change everything except the API key once it is added. 

Features
--------

* Supports both Account and Monitor API keys.
* Server up and down desktop notifications.
* Immediate visible server up and down notifications in the extension browser action icon.
* Group monitors to see them separated in the extension display.
* Options and data stored using chrome storage sync API allowing it to be sync'ed between chrome's if signed in.
* Uses jquery.plugin.uptimeRobotMonitor to provide a beautiful visualization of server status and statistics related to 1 day, 7 day and all time server uptime percentages.
* Can use only Monitor API keys if you do not want to provide Account API key and hence trustable and secure.

Options
-------

* Remove all the stored data: Removes all the monitors configured and settings saved w.r.t the extension.
* Refresh Interval (in mins): The interval at which the monitors are queried to get the server statuses for alerting desktop and browser action icon notification.
* Disable background notification: Disables the desktop and browser action icon notification's. This stops periodic query of UptimeRobot API's to get the server statuses.
* Add key: Adds/Saves the API keys configuration.
	* Key: The Monitor or Account API key
	* Color: The color of the server/monitor to use while displaying them in the browser action popup for this Key.
	* Name: A readable public name for the server/monitor.
	* Group: Adds the key to a particular group. The browser action popup groups by this name while displaying the server statuses.

Project Site
------------

The project site is generated using the github pages and modified. It is hosted at http://shreyaspurohit.github.io/chrome.extension.uptimeRobotMonitor/.

Licensing
---------
Released under MIT license, go ahead and use, modify, distribute as you wish, but do not forget to include the associated license too with it. The license is provided in LICENSE.txt. The license of other libraries used must be used as defined by them.   			

Screenshots
-----------
![](http://i.imgur.com/X4guphb.png)
![](http://i.imgur.com/j0pO0t6.png)
![](http://i.imgur.com/GOG49hH.png)
![](http://i.imgur.com/M86J8ag.png)
