 /**
 * @file JavaScript module for the GolfScorecard2 web application.  This file contains
 * the BackboneJS collections for the relevant models for the golf scorecard application.
 * @author Jim Kottas
 * @copyright Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.
 * @license MIT
 * @requires jquery.js
 * @requires underscore.js
 * @requires backbone.js
 * @requires 1-commonutils.js
 * @requires 2-serverapi.js
 * @requires 3-models.js
 * @requires 4-views.js
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
	'use strict';

	/**
	 * Namespace object for the collection-related functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Collections = gsc2app.Collections || {};

	// Reminders:
	// 		1. A Backbone collection definition returns a constructor function.

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Collections.Courses collection holds a list of gsc2app.Models.Course models.
	 * @example
	 * let courseModelList = new gsc2app.Collections.Courses();
	 * @class {function} gsc2app.Collections.Courses
	 */
    gsc2app.Collections.Courses = Backbone.Collection.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Collections.Courses", 'nodetype':"class", 'group':"gsc2app.Collections", 'datatype':"node"}
		/**
		 * @property {function} gsc2app.Collections.Courses.model - The model on which
		 * this collection is based, which is gsc2app.Models.Course.
		 * @see {@link gsc2app.Models.Course}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Course", 'tonodename':"gsc2app.Collections.Courses", 'datatype':"edge", 'edgetype':"normal"}
		 */
		model: gsc2app.Models.Course,

		/**
		 * @property {string} gsc2app.Collections.Courses.url - The URL to use to download the list
		 * of courses for a particular userspace ID.
		 */
		url: 'data/course_list_default.js',

		/**
		 * @property {string} gsc2app.Collections.Courses.myUserspaceID - The userspace ID for the
		 * collection of courses.
		 */
		myUserspaceID: 'default',

		/**
		 * @property {string} gsc2app.Collections.Courses.lastErrorMsg - The last error message
		 * that was generated, because loading a list of courses can generate multiple error messages.
		 */
		lastErrorMsg: '',

		/**
		 * Return the data value from the course list JSON from the server that has the actual
		 * array of courses in it.  Overloads the default function provided by the BackboneJS library.
		 * Not intended to be called directly.
		 * @param {object} data - The JSON data object with the list of courses that was returned from the server.
		 * @member {function} gsc2app.Collections.Courses.parse
		 * @returns {object} Returns the JSON member with the array of courses.
		 */
		parse: function(data) {
			if (data && data.data) {
				let course_list_json = JSON.parse(data.data);
				if (course_list_json && course_list_json.course_list) {
					return course_list_json.course_list;
				}
			}
			return null;
		},

		/**
		 * Determine and set the URL to use to retrieve the list of courses from the server, given
		 * the userspace ID.
		 * @example
		 * courseModelList.setUrl("b32307a1");
		 * @param {string} userspaceID - The userspace ID to use to specify the list of courses to retrieve from the server.
		 * @member {function} gsc2app.Collections.Courses.setUrl
		 * @returns {gsc2app.Collections.Courses} Returns this.
		 */
		setUrl: function(userspaceID) {
			this.url = gsc2app.ServerAPI.makeServerApiUrl('courses', userspaceID);
			this.myUserspaceID = userspaceID;
			return this;
		},

		/**
		 * Resets the URL for retrieving the list of courses from the server to the default form.
		 * @example
		 * courseModelList.resetUrl();
		 * @member {function} gsc2app.Collections.Courses.resetUrl
		 * @returns {gsc2app.Collections.Courses} Returns this.
		 */
		resetUrl: function() {
			this.setUrl('default');
			return this;
		},
		
		/**
		 * Compare two course models and return a number that indicates how they should be sorted.
		 * Not intended to be called directly.
		 * @param {gsc2app.Models.Course} a - The first course model to consider for the sorting.
		 * @param {gsc2app.Models.Course} b - The second course model to consider for the sorting.
		 * @member {function} gsc2app.Collections.Courses.comparator
		 * @returns {number} Returns 0 if the sort criteria is equal, +1 if course (a) should be listed after course (b), -1 if course (a) should be listed before course (b).
		 * @see {@link gsc2app.Models.Course}
		 */
		comparator: function(a, b) {
			// This function ensures that the courses will be sorted properly upon being loaded.
			// The arguments a and b are course models.
			// The primary sort field is the sort_group field.
			let a1 = a.get('sort_group');
			let b1 = b.get('sort_group');
			if (a1 && b1) {
				if (a1 < b1) { return -1; }
				if (a1 > b1) { return 1; }
			}
			// The secondary sort field is the course name.
			let a2 = a.get('name');
			let b2 = b.get('name');
			if (a2 && b2) {
				if (a2 < b2) { return -1; }
				if (a2 > b2) { return 1; }
			}
			return 0;
		},
		
		/**
		 * Resets the URL for retrieving the list of courses from the server to the default form.
		 * @example
		 * courseModelList.loadCourses();
		 * // Retrieve the list of courses from the server using all default values.
		 * @example
		 * courseModelList.loadCourses({
		 *     showErrors: true
		 * }, function(loadResult) {
		 *     if (loadResult) {
		 *         // The list of courses was retrieved successfully, do something interesting with them.
		 *     }
		 * });
		 * // Retrieve the list of courses from the server, showing error messages to the user,
		 * // and then post-process the list.
		 * @param {object} options - The option values to control the operation of the function.
		 * @property {boolean} options.showErrors - If true, show error messages to the user, otherwise fail silently.
		 * @param {function} postProccessingFunction - Function to process the course list that was retrieved.  Takes one boolean argument that indicates is the course load was successful (true) or not (false).
		 * @member {function} gsc2app.Collections.Courses.loadCourses
		 * @returns {boolean} Returns true if the course list was retrieved successfully, false if not.
		 */
		loadCourses: async function(options = {}, postProcessFunction = null) {
			// If options.showErrors is true, then error messages are shown to the user.
			// postProcessFunction() is called after the courses have been loaded.  It takes one
			// boolean argument, which is set to true if the load succeeded, and false if not.
			this.reset();
			this.lastErrorMsg = '';
			let result = false;
			try {
				const fetchResult = await this.fetch(options);
				if (this.length > 0) {
					gsc2app.Utilities.logMsg(`For userspace ID ${this.myUserspaceID}, ${this.length} course${ gsc2app.Utilities.plural(this.length) } loaded.`);
					result = true;
					// The collection is defined to sort automatically.
					
				} else {
					gsc2app.Utilities.logMsg(`For userspace ID ${this.myUserspaceID}, no courses loaded.`);
					this.lastErrorMsg = `For userspace ID ${this.myUserspaceID}, no courses could be loaded.`;
					if (options.showErrors) {
						gsc2app.Utilities.errorMsg(this.lastErrorMsg);
					}
				}
			}
			catch (err) {
				this.lastErrorMsg = `For userspace ID ${this.myUserspaceID}, no courses could be loaded: Status code ${err.status} - ${err.statusText}`;
				if (options.showErrors) {
					gsc2app.Utilities.errorMsg(this.lastErrorMsg);
				}
			}

			// Do the post processing, if requested.
			if (postProcessFunction && typeof(postProcessFunction) === 'function') {
				postProcessFunction(result);
			}
			
			return result;
		},

		/**
		 * Return the number of courses retrieved from the server.
		 * @example
		 * let numCoursesLoaded = courseModelList.getNumCourses();
		 * // Returns, for example, 5, indicating 5 courses were loaded from the server.
		 * @member {function} gsc2app.Collections.Courses.getNumCourses
		 * @returns {number} Returns the number of courses loaded.
		 */
		getNumCourses: function() {
			return this.length;
		},

		/**
		 * Return the 0-based index for the course with the specified course ID in the list of courses.
		 * @example
		 * let courseIndex = courseModelList.getIndexFromCourseID("e8639fbb-4142-4cc0-bb76-dba581bacd22");
		 * // Returns, for example, 1, if the identified course is the second course in the list.
		 * @param {string} courseID - The course ID to find in the list of courses.
		 * @member {function} gsc2app.Collections.Courses.getIndexFromCourseID
		 * @returns {number} Returns the 0-based index of the course if it is found.  Returns -1 if the course ID is not found.
		 */
		getIndexFromCourseID: function(courseID) {
			let index = this.findIndex({'course_id': courseID});
			return index;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Collections.StringFields collection holds an array of
	 * gsc2app.Models.StringField values, which will include player names
	 * and hole numbers, which could be alphanumeric.
	 * @example
	 * let playerNameList = new gsc2app.Collections.StringFields();
	 * @class {function} gsc2app.Collections.StringFields
	 */
    gsc2app.Collections.StringFields = Backbone.Collection.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Collections.StringFields", 'nodetype':"class", 'group':"gsc2app.Collections", 'datatype':"node"}
		/**
		 * @property {function} gsc2app.Collections.StringFields.model - The model on which
		 * this collection is based, which is gsc2app.Models.StringField.
		 * @see {@link gsc2app.Models.StringField}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.StringField", 'tonodename':"gsc2app.Collections.StringFields", 'datatype':"edge", 'edgetype':"normal"}
		 */
		model: gsc2app.Models.StringField,
		url: ''		// Not used here.
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Collections.NumberFields collection holds an array of
	 * gsc2app.Models.NumberField values, which will include golf hole numbers,
	 * hole pars, and hole scores.
	 * @example
	 * let holeModelList = new gsc2app.Collections.NumberFields();
	 * @class {function} gsc2app.Collections.NumberFields
	 */
    gsc2app.Collections.NumberFields = Backbone.Collection.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Collections.NumberFields", 'nodetype':"class", 'group':"gsc2app.Collections", 'datatype':"node"}
		/**
		 * @property {function} gsc2app.Collections.NumberFields.model - The model on which
		 * this collection is based, which is gsc2app.Models.NumberField.
		 * @see {@link gsc2app.Models.NumberField}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.NumberField", 'tonodename':"gsc2app.Collections.NumberFields", 'datatype':"edge", 'edgetype':"normal"}
		 */
		model: gsc2app.Models.NumberField,
		url: '',		// Not used here.

		/**
		 * Sets the 1-based player number field in all of the gsc2app.Models.NumberField objects
		 * in the collection.
		 * @param {number} n - The 1-based player number for this collection of holes.
		 * @member {function} gsc2app.Collections.NumberFields.setPlayerNumber
		 * @returns {gsc2app.Collections.NumberFields} Returns this.
		 */
		setPlayerNumber: function(n) {
			var self = this;
			if (this.models && this.models.length > 0) {
				_(this.models).each(function(editableNumberField) {
					editableNumberField.setPlayerNumber(n);
				});
			}
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Collections.Stats collection holds a list of statistic models for keeping track
	 * of a player's statistics for the round of golf.
	 * @example
	 * let playerStats = new gsc2app.Collections.Stats();
	 * @class {function} gsc2app.Collections.Stats
	 */
    gsc2app.Collections.Stats = Backbone.Collection.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Collections.Stats", 'nodetype':"class", 'group':"gsc2app.Collections", 'datatype':"node"}
		/**
		 * @property {function} gsc2app.Collections.Stats.model - The model on which
		 * this collection is based, which is gsc2app.Models.OneStat.
		 * @see {@link gsc2app.Models.OneStat}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.OneStat", 'tonodename':"gsc2app.Collections.Stats", 'datatype':"edge", 'edgetype':"normal"}
		 */
		model: gsc2app.Models.OneStat,
		url: ''		// Not used here.
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Collections.Players collection holds a list of player models for a scorecard.
	 * @example
	 * let playerModelList = new gsc2app.Collections.Players();
	 * @class {function} gsc2app.Collections.Players
	 */
    gsc2app.Collections.Players = Backbone.Collection.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Collections.Players", 'nodetype':"class", 'group':"gsc2app.Collections", 'datatype':"node"}
		/**
		 * @property {function} gsc2app.Collections.Players.model - The model on which
		 * this collection is based, which is gsc2app.Models.Player.
		 * @see {@link gsc2app.Models.Player}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Player", 'tonodename':"gsc2app.Collections.Players", 'datatype':"edge", 'edgetype':"normal"}
		 */
		model: gsc2app.Models.Player,
		url: ''		// Not used here.
    });

})();
