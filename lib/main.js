var settings = require("settings");
var autohideLocationbar = require("autohideLocationbar");

exports.main = function() {
	settings.load();
	autohideLocationbar.load();
};

exports.onUnload = function () {
	autohideLocationbar.unload();
    settings.unload();
};