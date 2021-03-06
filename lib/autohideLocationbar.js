var tabs = require("sdk/tabs");
const { getChromeWindow, addEventListener, showLocationbar } = require("utils");
const { browserWindows } = require("sdk/windows");
var servicesGet = require("sdk/preferences/service").get;
var simplePerfs = require("sdk/simple-prefs");

/* Auto Hide Location Bar Script Part  */
var callbacks = (function(){
	var inFocus = false;
	return {
		//this = navbar
		focus: function(e){
			inFocus = true;
			this.classList.add("nav-bar-visible");
		},

		blur: function(e){
			inFocus = false;
			this.classList.remove("nav-bar-visible");
		},

		mouseover: function(e){
			if(!inFocus) this.classList.remove("nav-bar-visible");
		},

		mouseout: function(e){
			if(!inFocus && e.clientY < 65) //magic numbers <3
				if(e.target.nodeName.toLowerCase() !== "input")
					this.classList.add("nav-bar-visible");
		}
	};
})();
/* --- */

function addListeners(window, elements, listenerMap){
    var removeEventListener = [];
        
    for(var i = 0, len = elements.length; i < len; i++){
		for(var key in listenerMap){
			removeEventListener.push(addEventListener(elements[i],key,listenerMap[key]));
		}
    }
    
    if(!(window.faleij_australis_slimmr_removeEventListeners instanceof Array))
        window.faleij_australis_slimmr_removeEventListeners = [];
    window.faleij_australis_slimmr_removeEventListeners = window.faleij_australis_slimmr_removeEventListeners.concat(removeEventListener);
}

function removeEventListeners(window){
	window = getChromeWindow(window);
	if(window){
		if(window.faleij_australis_slimmr_removeEventListeners){
			window.faleij_australis_slimmr_removeEventListeners.forEach(function(a){a()});
		}
		delete window.faleij_australis_slimmr_removeEventListeners;
	}
}

function initializeWindow(_window){    
    var window = getChromeWindow(_window);
	
	if(window){
		var doc = window.document;
	
		var navbar = doc.getElementById("nav-bar");
		
		var listenerMap = {
			"focus": callbacks.focus.bind(navbar),
			"blur": callbacks.blur.bind(navbar)
		};
		
		addListeners(window, doc.querySelectorAll("#navigator-toolbox textbox"), listenerMap);
		addListeners(window, doc.querySelectorAll("#navigator-toolbox searchbar"), listenerMap);   
		addListeners(window, doc.querySelectorAll("#browser-panel>#content-deck"), 
		{ "mouseover": callbacks.mouseover.bind(navbar), "mouseout": callbacks.mouseout.bind(navbar) });
	}
}

function registerWindowEvents(){
    browserWindows.on('open', initializeWindow);
    
    for(let window of browserWindows){
		initializeWindow(window);
	}
}

function unregisterWindowEvents(){
    browserWindows.removeListener('open', initializeWindow);
    
	for(let window of browserWindows){
		removeEventListeners(window);
	}
}

function tabOpenListener(tab){
	tab.on("ready", function readyListener(tab){
		if(tabs.activeTab === tab){
			if(tab.url === servicesGet("browser.newtab.url")){
				showLocationbar(tab.window);
			}
		}
		tab.removeListener("ready", readyListener);
	});
}
	
function reloadTabListeners(){
	unloadTabListeners();
	if(simplePerfs.prefs["_selectLocationBar"]){
		tabs.on("open", tabOpenListener);
	}
}

function unloadTabListeners(){
	try{
		tabs.removeListener("open", tabOpenListener);
	}catch(err){
	}
}
/* --- */


exports.load = function(){
	registerWindowEvents();
	reloadTabListeners();
	simplePerfs.on("_selectLocationBar", reloadTabListeners);
};

exports.unload = function(){
	simplePerfs.removeListener("_selectLocationBar", reloadTabListeners);
	unregisterWindowEvents();
	unloadTabListeners();
};