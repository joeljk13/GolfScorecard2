/**
 * @file JavaScript module for the GolfScorecard2 web application.
 * This file contains common utilities for the golf scorecard application.
 * @author Jim Kottas
 * @copyright Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.
 * @license MIT
 * @requires jquery.js
 * @requires underscore.js
 * @requires backbone.js
 * @requires md5.js
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
	 * Namespace object for the common utility functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Utilities = gsc2app.Utilities || {};

	/**
	 * Object for triggering events the whole Golf Scorecard JavaScript library can use.
	 * This is a trick that was mentioned on {@link https://backbonejs.org} and adapted for
	 * use here.
	 * @type {object}
	 */
	gsc2app.Utilities.eventDispatcher = {};
	gsc2app.Utilities.eventDispatcher = _.clone(Backbone.Events);

	/**
	 * Extend the string object so it can calculate a simple numeric hash code.
	 * Adapted from {@link https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript}.
	 * This hash code does not require cryptographic strength.
	 * @example
	 * let s = "Hello, world";
	 * s.hashCode();
	 * // Returns -476288596.
	 * @returns {number} The hash value for the associated string object.
	 */
	Object.defineProperty(String.prototype, 'hashCode', {
	  value: function() {
		let hash = 0, i, chr;
		for (i = 0; i < this.length; i++) {
		  chr   = this.charCodeAt(i);
		  hash  = ((hash << 5) - hash) + chr;
		  hash |= 0; // Convert to a 32-bit integer.
		}
		return hash;
	  }
	});

	/*
	 * //JK// HERE I AM
	 * Try to adapt this SHA-256 function so it can be run here instead of MD5.
	 * 
	 * Adapted from https://stackoverflow.com/questions/18338890/are-there-any-sha-256-javascript-implementations-that-are-generally-considered-t.
	 * 
		async function sha256(message) {
			// encode as UTF-8
			const msgBuffer = new TextEncoder().encode(message);                    

			// hash the message
			const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

			// convert ArrayBuffer to Array
			const hashArray = Array.from(new Uint8Array(hashBuffer));

			// convert bytes to hex string                  
			const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
			return hashHex;
		}	
	*/


	/**
	 * Compute a simple 32-bit hash code of string.  Returns the hash as an 8-digit hex string.
	 * This does not require cryptographic strength, so MD5 is acceptable here.
	 * @example
	 * gsc2app.Utilities.calcHashCode("Hello, world");
	 * // Returns "02712a05".
	 * @param {string} message - The input string for which the hash code is to be computed.
	 * @returns {string} The hash code as a 32-bit hexadecimal string.
	 */
	gsc2app.Utilities.calcHashCode = function(message) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.calcHashCode", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		let md5digest = md5(message);
		let hashValue = md5digest.hashCode();			// The .hashCode() function returns a 32-bit signed integer.
		let hexString = '';
		if (hashValue >= 0) {
			hexString = hashValue.toString(16);
			hexString = ('00000000' + hexString);		// Make sure the string has leading zeros.
			hexString = hexString.substr(hexString.length - 8);
		} else {
			// Calculate the two's complement in a JavaScript-y way and hex that.
			// Otherwise, JavaScript would compute the hex presentation of the positive value for the number
			// and simply retain the negative sign.  For example, without this method, -10 would become -A in hex.
			hashValue += Math.pow(2, 32);	// 2 ** 32
			hexString = hashValue.toString(16);
			hexString = ('FFFFFFFF' + hexString);		// Make sure the string has leading F's to indicate the original number's negative-ness.
			hexString = hexString.substr(hexString.length - 8);
		}
		return hexString;
	};


	/**
	 * Function to return a default value if the input value is null or an empty object.
	 * @example
	 * gsc2app.Utilities.safeValue("Hello, world");
	 * // Returns "Hello, world".
	 * gsc2app.Utilities.safeValue(null, "<NULL>");
	 * // Returns "<NULL>".
	 * @param {?*} theValue - The input object, which can be null.
	 * @param {*} [defaultValue=''] - The default value to return if the input value is null or an empty object.
	 * @returns {*} A safe string/object that is not null or an empty object.
	 */
	gsc2app.Utilities.safeValue = function(theValue, defaultValue = '') {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.safeValue", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		return ((theValue === null || theValue === {}) ? defaultValue : theValue);
	};


	/**
	 * Function to return an approximate string suffix to indicate plurality or not.
	 * @example
	 * gsc2app.Utilities.plural(1);
	 * // Returns "".
	 * gsc2app.Utilities.plural(2);
	 * // Returns "s".
	 * gsc2app.Utilities.plural(someNumber, "candy", "candies");
	 * // Returns "candy" if someNumber is 1, otherwise "candies".
	 * @param {number} num - The input number, which is expected to be an integer.
	 * @param {string} [singularForm=''] - The suffix to return if num is 1.
	 * @param {string} [pluralForm ='s'] - The suffix to return if num is not 1.
	 * @returns {string} The suffix corresponding to the plurality of the input number.
	 */
	gsc2app.Utilities.plural = function(num, singularForm = '', pluralForm = 's') {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.plural", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		return ((num === 1) ? singularForm : pluralForm);
	};

	/**
	 * Function to log a message to the browser console.
	 * @example
	 * gsc2app.Utilities.logMsg("Just did something important");
	 * @param {string} msg - The input message to log to the console.
	 */
	gsc2app.Utilities.logMsg = function(msg) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.logMsg", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		/*DEV*/console.log(msg);
	};

	/**
	 * Function to display a message as a warning message to the user.  Also logs the warning message to the browser console.
	 * @example
	 * gsc2app.Utilities.warningMsg("Something suspicious just happened");
	 * @param {string} msg - The warning message to display and log.
	 */
	gsc2app.Utilities.warningMsg = function(msg) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.warningMsg", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		let msg2 = 'WARNING: ' + msg;
		gsc2app.Utilities.logMsg(msg2);
		alert(msg2);
	};

	/**
	 * Function to display a message as an error message to the user.  Also logs the error message to the browser console.
	 * @example
	 * gsc2app.Utilities.errorMsg("Something bad just happened");
	 * @param {string} msg - The error message to display and log.
	 */
	gsc2app.Utilities.errorMsg = function(msg) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.errorMsg", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		let msg2 = 'ERROR: ' + msg;
		gsc2app.Utilities.logMsg(msg2);
		alert(msg2);
	};

	/**
	 * Function to log a message that was generated by an internal exception.
	 * @example
	 * try {
	 *     throw "MyException";
	 * }
	 * catch (e) {
	 *     gsc2app.Utilities.exceptionMsg(e, "Something bad just happened");
	 * }
	 * @param {string} e - The exception objection that was generated by the exception being thrown.
	 * @param {string} msg - The error message to display and log.
	 */
	gsc2app.Utilities.exceptionMsg = function(e, msg) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.exceptionMsg", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		if (!msg) {
			msg = '<none>';
		}
		let msg2 = `EXCEPTION: ${e};  Context: ${msg}`;
		gsc2app.Utilities.logMsg(msg2);
	};

	/**
	 * Function to display a message as an informational message to the user.
	 * Does not log the message to the browser console.
	 * @example
	 * gsc2app.Utilities.infoMsg("Something interesting just happened");
	 * @param {string} msg - The informational message to display.
	 */
	gsc2app.Utilities.infoMsg = function(msg) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.infoMsg", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		alert(msg);
	};


	/**
	 * Function to generate a random integer in the range [min, max] according to a pseudo-uniform probability distribution.
	 * @example
	 * gsc2app.Utilities.randomIntFromInterval(0, 100);
	 * // Returns a random number between 0 and 100, inclusive.
	 * @param {number} min - The minimum integer to return.
	 * @param {number} max - The maximum integer (inclusive) to return.
	 * @returns {number} The integer that was randomly generated.
	 */
	gsc2app.Utilities.randomIntFromInterval = function(min, max) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.randomIntFromInterval", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		return Math.floor(Math.random()*(max - min + 1) + min);
	};

	/**
	 * Function to sort the characters in the given string.  Adapted from {@link https://stackoverflow.com/questions/30912663/sort-a-string-alphabetically-using-a-function#30912718}.
	 * @example
	 * gsc2app.Utilities.sortStringChars("bfbedcaf");
	 * // Returns "abbcdeff".
	 * @param {string} textInput - The input string whose characters will be sorted in increasing order.
	 * @returns {string} The character-sorted string.
	 */
	gsc2app.Utilities.sortStringChars = function(textInput) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.sortStringChars", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		let s = '';
		if (textInput && textInput !== '') {
			s = textInput.split('').sort().join('');
		}
		return s;
	};


	/**
	 * Function to prompt the user to enter in a string.  Returns the value from the JavaScript prompt()
	 * function, unless the user cancels the prompt dialog box/message, in which case the specified
	 * default value is returned.
	 * @example
	 * gsc2app.Utilities.promptUser("Are you sure?", "no");
	 * // Returns the string entered in by the user, or "no" if the user cancelled the dialog box.
	 * @param {string} promptMessage - The message to display to the user.
	 * @param {string} [defValue=''] - The optional default value to return to the user if the user cancels the dialog box.
	 * @returns {string} The string entered by the user in the dialog box, or the default value if cancelled.
	 */
	gsc2app.Utilities.promptUser = function(promptMessage, defValue = '') {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.promptUser", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		let s = prompt(promptMessage, defValue);
		return s;
	};


	/**
	 * Function to generate a reasonable GUID.
	 * Adapted from {@link https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid}.
	 * This code is in the public domain, thanks to MIT.
	 * @example
	 * gsc2app.Utilities.generateUUID();
	 * // Returns, for example, "f5374095-5232-4668-9379-c6728a03dc77".
	 * @returns {string} The GUID that was generated.
	 */
	gsc2app.Utilities.generateUUID = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Utilities.generateUUID", 'nodetype':"function", 'group':"gsc2app.Utilities", 'datatype':"node"}
		let d = new Date().getTime(); // Timestamp
		let d2 = (performance && performance.now && (performance.now()*1000)) || 0;	// Time in microseconds since page-load or 0 if unsupported
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16; // Random number between 0 and 16
			if (d > 0) { // Use timestamp until depleted
				r = (d + r)%16 | 0;
				d = Math.floor(d/16);
			} else { // Use microseconds since page-load if supported
				r = (d2 + r)%16 | 0;
				d2 = Math.floor(d2/16);
			}
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
	};

})();
