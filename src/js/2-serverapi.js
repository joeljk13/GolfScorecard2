/**
 * @file JavaScript module for the GolfScorecard2 web application.
 * This file contains the functions necessary to access the server-side API.
 * @author Jim Kottas
 * @copyright Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.
 * @license MIT
 * @requires jquery.js
 * @requires underscore.js
 * @requires backbone.js
 * @requires 1-commonutils.js
 */

/**
 * Namespace object which will contain all of the JavaScript functionality for the
 * Golf Scorecard (version 2).
 * @type {object}
 * @namespace
 */
var gsc2app = gsc2app || {};

// Using an anonymous function to avoid polluting the global scope.
(function() {
	// "use strict" tells the browser to generate more errors than normal. This
	// only applies to this function.
	"use strict";

	/**
	 * Namespace object for the server API functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.ServerAPI = gsc2app.ServerAPI || {};

	/**
	 * String for the base URL for the gsc2app web site.  It is formed by stripping off
	 * the main.html web page that holds the main client-side application.  The base URL
	 * retains the trailing "/" character.
	 * @type {string}
	 */
	gsc2app.ServerAPI.baseURL = document.URL.replace(/[^/]*[.]html?.*$/i, '');

	/**
	 * Create the server API URL for the given object type and object ID.  The URL will
	 * be a REST API URL.  The server and root query path for the URL is derived from
	 * the URL for the GolfScorecard2 application.
	 * @example
	 * let serverURL = gsc2app.ServerAPI.makeServerApiUrl("scorecard", "03709882-f4a3-44dc-b0ba-f5f5aa73aec0");
	 * // Generates the full REST API URL on a scorecard object with the scorecard ID
	 * // "03709882-f4a3-44dc-b0ba-f5f5aa73aec0".
	 * @param {string} objectType - The name of the object on which a server API call
	 * will be made.
	 * @param {string} objectID - The relevant or appropriate ID for the specified object
	 * type.
	 * @returns {string} Returns the full REST API URL.
	 */
	gsc2app.ServerAPI.makeServerApiUrl = function(objectType, objectID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.ServerAPI.makeServerApiUrl", 'nodetype':"function", 'group':"gsc2app.ServerAPI", 'datatype':"node"}
		let api_path = 'api';
		let full_url = gsc2app.ServerAPI.baseURL + `${api_path}/${objectType}/${objectID}`;
		return full_url;
	};


	//===================================================================================

	/*
	 * This section implements the logic to save a scorecard.  It can use localStorage
	 * as a temporary store if the scorecard cannot be saved on the server when the save
	 * is requested.
	 * 
	 * The save mechanism works this way:  When gsc2app.ServerAPI.saveScorecard() is
	 * called to save a scorecard, it first tries to upload it to the server.  If that
	 * fails, the scorecard is saved to JavaScript's localStorage area, and then an
	 * interval function is scheduled to try to re-upload the scorecard every 15 seconds.
	 * If the upload fails, the interval function is rescheduled again.  When the
	 * upload finally succeeds, the scorecard data in localStorage is deleted.
	 * 
	 * In localStorage, the scorecard data is saved with a key with a unique suffix.
	 * The interval function tries to upload all scorecard data entries, which could
	 * mean that another browser tab's scorecard data may be uploaded by this tab's
	 * interval function.  Therefore, if the scorecard data is missing when an interval
	 * function is triggered, it simply assumes the data was uploaded already.  Some
	 * localStorage flags attempt to control access so no collisions occur.
	 */

	 /**
	  * Define the base key name for storing scorecard data in localStorage.
	  * @constant {string} gsc2app.ServerAPI.BASEKEYNAME
	  */
	 gsc2app.ServerAPI.BASEKEYNAME = 'gsc2app.scorecarddata';

	 /**
	  * Define the time interval between attempts to upload the scorecard data.  This
	  * number is in seconds.
	  * @constant {number} gsc2app.ServerAPI.RETRYPERIODSECS
	  */
	 gsc2app.ServerAPI.RETRYPERIODSECS = 2*60;

	 /**
	  * Define the base key name for storing scorecard data in localStorage.
	  * @type {string}
	  */
	 gsc2app.ServerAPI.defaultKeyStorageSuffix = '';

	 /**
	 * ID number for the interval function created by setTimeout() to schedule its running.
	 * @type {number}
	 */
	gsc2app.ServerAPI.saveIntervalFunctionID = 0;

	 /**
	 * Boolean flag to indicate if the saving interval function is active or not.  If it is
	 * true, the interval function is active.  If false, it is not active.
	 * @type {boolean}
	 */
	gsc2app.ServerAPI.saveIntervalFunctionActive = false;

	/**
	 * Callback function for when the saving of a scorecard was successful.
	 * @param {object} data - The JSON object returned from the server API call. It
	 * has the following string attributes:
	 *		'status'		Either 'Success' or 'Error'.
     *      'message'  		A message returned by the API call.
     *      'data'			The JSON data returned by API GET calls.
     *      'id'			The scorecard ID involved in the API call.
	 * @param {string} textStatus - A status string returned by the web server.
	 * @param {jqXHR} jqXHR - The jQuery superset of the browser's XMLHttpRequest object.
	 */
	gsc2app.ServerAPI.saveSuccessfulCallback = function (data, textStatus, jqXHR) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.ServerAPI.saveSuccessfulCallback", 'nodetype':"function", 'group':"gsc2app.ServerAPI", 'datatype':"node"}
		gsc2app.Utilities.logMsg(data);
		gsc2app.Views.showSaveStatus('Saved');

		let scorecardID = data.id;
		//JK// HERE I AM, finish this functionality.
		// Check localStorage, and if the scorecard that was just saved is there,
		// remove it.
	};

	/**
	 * Callback function for when the saving of a scorecard failed due to some error.
	 * @param {jqXHR} jqXHR  - The jQuery superset of the browser's XMLHttpRequest object.
	 * @param {string} textStatus - A status string returned by the web server.  One
	 * of the following values: null, "timeout", "error", "abort", and "parsererror".
	 * @param {string} errorThrown - The string portion of the HTTP return code.
	 */
	gsc2app.ServerAPI.saveFailedCallback = function (jqXHR, textStatus, errorThrown) {
		gsc2app.Utilities.logMsg(`Error ocurred with save-scorecard operation: ${textStatus} (HTTP code ${jqXHR.status} ${errorThrown})`);
		gsc2app.Views.showSaveStatus('Error');
		//JK// HERE I AM, finish this functionality.
		// Check localStorage, and if this scorecard is not there, save it in
		// localStorage and trigger the save function on a timeout so the save
		// operation can try again.
	};

	/**
	 * Function to upload scorecard data as a string to the server.
	 * @example
	 * if (gsc2app.ServerAPI.uploadScorecardToServer(scorecardAsJSONstring)) {
	 *     // Success!
	 *     return true;
	 * } else {
	 *     // Error occurred, so save the scorecard data to localStorage and
	 *     // try again later on.
	 *     localStorage.setItem('scorecardKey', scorecardAsJSONstring);
	 * }
	 * @param {string} scorecardAsJSONstring - JSON string representation for the
	 * scorecard data to be saved.
	 * @returns {boolean} Returns true if the upload was successful, false if not.
	 */
	gsc2app.ServerAPI.uploadScorecardToServer = function(scorecardAsJSONstring) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.ServerAPI.uploadScorecardToServer", 'nodetype':"function", 'group':"gsc2app.ServerAPI", 'datatype':"node"}
		if (!scorecardAsJSONstring) {
			// There is nothing to save.
			return false;
		}

		// Stop the background loop for trying to save the data from localStorage.
		gsc2app.ServerAPI.clearPendingSaveRequests();

		// Retrieve the scorecard ID from the scorecard string of data.
		let data_object = {};
		let scorecardID = '';
		try {
			data_object = JSON.parse(scorecardAsJSONstring);
			if (data_object.scorecard_id) {
				scorecardID = data_object.scorecard_id;
			} else {
				throw "Cannot determine the scorecard ID";
			}
		}
		catch (e) {
			gsc2app.Utilities.exceptionMsg(e, `Invalid JSON scorecard data string: "${scorecardAsJSONstring}"`);
			return false;
		}

		// Make the save-scorecard server call.
		gsc2app.Views.showSaveStatus('Saving');
		let full_url = gsc2app.ServerAPI.makeServerApiUrl('scorecard', scorecardID);
		$.ajax(full_url, {
			method: 'PUT',
			processData: true,
			data: {
				json_data: scorecardAsJSONstring
			},
			timeout: 10000,		// Milliseconds
			dataType: 'json',	// Expected response data format
			success: gsc2app.ServerAPI.saveSuccessfulCallback,
			error: gsc2app.ServerAPI.saveFailedCallback
		});
		return true;
	};

	/**
	 * Function to upload scorecard data that has been saved in localStorage.
	 * @example
	 * // Trigger this function to run 5 minutes from now.
	 * let id = setTimeout(gsc2app.ServerAPI.uploadScorecardsToServerFromLocalStorage, 5*60*1000);
	 * // The id is needed if the triggering of the function is to be canceled.
	 */
	gsc2app.ServerAPI.uploadScorecardsToServerFromLocalStorage = function(scorecardAsJSONstring) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.ServerAPI.uploadScorecardsToServerFromLocalStorage", 'nodetype':"function", 'group':"gsc2app.ServerAPI", 'datatype':"node"}
		gsc2app.ServerAPI.saveIntervalFunctionActive = true;
		gsc2app.ServerAPI.saveIntervalFunctionID = 0;
		// This link has useful information about using LocalStorage with JavaScript:
		//		https://www.taniarascia.com/how-to-use-local-storage-with-javascript/

		//JK// HERE I AM, iterate through localStorage and try to upload all of the
		// saved scorecards.

		gsc2app.ServerAPI.saveIntervalFunctionActive = false;
	};

	/**
	 * Function to clear any current save mechanism that is currently running.
	 * @example
	 * gsc2app.ServerAPI.clearPendingSaveRequests();
	 */
	gsc2app.ServerAPI.clearPendingSaveRequests = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.ServerAPI.clearPendingSaveRequests", 'nodetype':"function", 'group':"gsc2app.ServerAPI", 'datatype':"node"}
		if (gsc2app.ServerAPI.saveIntervalFunctionID) {
			clearTimeout(gsc2app.ServerAPI.saveIntervalFunctionID);
			gsc2app.ServerAPI.saveIntervalFunctionID = 0;
		}
	};

	/**
	 * Function to save a scorecard to the server.  The scorecard data should be passed
	 * in as a JSON string, which allows this saving mechanism to simply worry about
	 * saving strings instead of having to understand the format of a scorecard's data.
	 * @example
	 * gsc2app.ServerAPI.saveScorecard(scorecardAsJSONstring);
	 * @param {string} scorecardAsJSONstring - JSON string representation for the
	 * scorecard data to be saved.
	 * @param {string} [storageKeySuffix=''] - Suggested suffix to use on the localStorage
	 * key to use to save the scorecard data in scorecardAsJSONstring.  If none is
	 * specified, one is generated automatically.
	 * @returns {boolean} Returns true if successful, false if an error occurred.
	 */
	gsc2app.ServerAPI.saveScorecard = function(scorecardAsJSONstring, storageKeySuffix = '') {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.ServerAPI.saveScorecard", 'nodetype':"function", 'group':"gsc2app.ServerAPI", 'datatype':"node"}
		//JK// HERE I AM -- Problem identified: Backbone natively does not support 
		// nested Backbone models when it comes to serialization and deserialization.
		// Fix this somehow.  Some links are:
		//		https://stackoverflow.com/questions/6535948/nested-models-in-backbone-js-how-to-approach/9904874#9904874
		//		http://blog.untrod.com/2013/08/declarative-approach-to-nesting.html 
		// Maybe create a standard serialization and deserialization mechanism.
		// Look at the Backbone model functions toJSON() and parse().  Maybe they can
		// be used for the serialization and deserialization.
		gsc2app.ServerAPI.clearPendingSaveRequests();

		if (gsc2app.ServerAPI.uploadScorecardToServer(scorecardAsJSONstring)) {
			// The upload was successful.
			gsc2app.Utilities.logMsg('Scorecard data uploaded to server successfully');
		} else {
			// The upload failed, so save the scorecard in localStorage and prepare to
			// try again later.
			if (storageKeySuffix === '') {
				if (gsc2app.ServerAPI.defaultKeyStorageSuffix === '') {
					gsc2app.ServerAPI.defaultKeyStorageSuffix = gsc2app.Utilities.generateUUID();
				}
				storageKeySuffix = gsc2app.ServerAPI.defaultKeyStorageSuffix;
			}
			let storageKey = gsc2app.ServerAPI.BASEKEYNAME + '.' + storageKeySuffix;
			localStorage.setItem(storageKey, scorecardAsJSONstring);
			gsc2app.Utilities.logMsg(`Scorecard data saved under localStorage key "${ storageKey }"`);

			// Now prepare to retry the upload at at later time.
			gsc2app.ServerAPI.saveIntervalFunctionID = setTimeout(
				gsc2app.ServerAPI.uploadScorecardsToServerFromLocalStorage,
				1000*gsc2app.ServerAPI.RETRYPERIODSECS
			);
		}
		return true;
	};

})();
