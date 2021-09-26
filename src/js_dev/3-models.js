/**
 * @file JavaScript module for the GolfScorecard2 web application.
 * This file contains the BackboneJS models for the golf scorecard.
 * @author Jim Kottas
 * @copyright Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.
 * @license MIT
 * @requires jquery.js
 * @requires underscore.js
 * @requires backbone.js
 * @requires 1-commonutils.js
 * @requires 2-serverapi.js
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
	 * Namespace object for the model-related functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Models = gsc2app.Models || {};

	/**
	 * Namespace object for storing stateful working variables.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.State = gsc2app.State || {};

	/**
	 * Store the hash ID (hashCode) for the userspace string for the current user.
	 * Also known as the userspace ID.  Since the userspace ID is fundamental to
	 * the operation of this app, it needs to be stored in the State area.
	 * @type {string}
	 */
	gsc2app.State.userspaceID = '';

	// Remember that a Backbone model definition returns a constructor function.

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.Date model defines a mechanism to get today's date in an "M/D/YYYY" format.
	 * @example
	 * let dateModel = new gsc2app.Models.Date();
	 * @class {function} gsc2app.Models.Date
	 */
	gsc2app.Models.Date = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.Date", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		constructor: function() {
			let d = new Date();
			this.theDate = `${ 1 + d.getMonth() }/${ d.getDate() }/${ d.getFullYear() }`;
		},

		/**
		 * Return the formatted date associated with this Date model.
		 * @example
		 * dateModel.fetchDate();
		 * // Returns, for example, "11/5/2020", representing November 5, 2020.
		 * @member {function} gsc2app.Models.Date.fetchData
		 */
		fetchDate: function() {
			return this.theDate;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.UserSpace model defines the fields to keep track of the current user space.
	 * @example
	 * let userspaceModel = new gsc2app.Models.UserSpace();
	 * @class {function} gsc2app.Models.UserSpace
	 */
	gsc2app.Models.UserSpace = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.UserSpace", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.UserSpace.defaults - The default values for the attributes
		 * in a gsc2app.Models.UserSpace object.
		 * 
		 * @property {string} gsc2app.Models.UserSpace.defaults.userSpaceName - The phrase entered in
		 * by the user to identify the scorecard userspace.
		 * 
		 * @property {string} gsc2app.Models.UserSpace.defaults.hashCode - The hashcode for the phrase,
		 * which corresponds to the userspace ID.
		 */
		defaults: {
			'userSpaceName': '',
			'hashCode': ''		// This will be the userspace ID.
		},
		
		/**
		 * Set the userspace name for this UserSpace model.  This triggers the hashcode
		 * (the userspace ID) to be calculated.
		 * @example
		 * userspaceModel.setUserSpaceName("demospace");
		 * // Returns this.
		 * @param {string} name - The userspace name entered in by the user.
		 * @member {function} gsc2app.Models.UserSpace.setUserSpaceName
		 * @returns {gsc2app.Models.UserSpace} Returns this.
		 */
		setUserSpaceName: function(name) {
			this.set('userSpaceName', name);
			let hashString = gsc2app.Utilities.calcHashCode(name);
			this.set('hashCode', hashString);
			gsc2app.Controllers.setOrUpdateUserspaceID(hashString, name);
			return this;
		},

		/**
		 * Return the hashcode (userspace ID) associated with this UserSpace model.
		 * @example
		 * userspaceModel.getHashCode();
		 * // Returns "b32307a1" when the userspace name is set to "demospace".
		 * @member {function} gsc2app.Models.UserSpace.getHashCode
		 * @returns {string} Returns the hashcode as a string.
		 */
		getHashCode: function() {
			// This is the userspace ID.
			return this.get('hashCode');
		},

		/**
		 * Return the userspace name associated with this UserSpace model.
		 * @example
		 * userspaceModel.getUserSpaceName();
		 * // Returns "demospace".
		 * @member {function} gsc2app.Models.UserSpace.getUserSpaceName
		 * @returns {string} Returns the userspace name.
		 */
		getUserSpaceName: function() {
			return this.get('userSpaceName');
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.Course model defines the fields to define and characterize a golf course.
	 * @example
	 * let courseModel = new gsc2app.Models.Course();
	 * @class {function} gsc2app.Models.Course
	 */
	gsc2app.Models.Course = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.Course", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.Course.defaults - The default values for the
		 * attributes in a gsc2app.Models.Course object.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.name - The name of the course.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.address - The street address
		 * for the course.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.city - The city in the address
		 * for the course.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.state - The 2-letter state
		 * abbreviation for the address of the course.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.zip - The 5-digit ZIP code for
		 * the course.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.info_url - A URL for more
		 * information on this course.  Typically, this is a link to DGCourseReview.com.
		 * 
		 * @property {number} gsc2app.Models.Course.defaults.num_holes - The number of holes
		 * on this course.  When adding and removing holes, the holes defined here cannot be
		 * deleted.
		 * 
		 * @property {string[]} gsc2app.Models.Course.defaults.holes - An array of hole
		 * numbers/names/identifiers.  Typically "1" through "18".
		 * 
		 * @property {number[]} gsc2app.Models.Course.defaults.pars - An array of the par
		 * values for each hole, one per hold, starting with hole #1.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.course_id - An arbitrary ID
		 * string to uniquely identify this course internally within this web application.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.notes - Any notes regarding
		 * this course.
		 * 
		 * @property {string} gsc2app.Models.Course.defaults.sort_group - A 3-digit number,
		 * stored as string, that is the primary sorting index (smallest to largest).  The
		 * course name is the secondary sort field.
		 * 
		 * @property {boolean} gsc2app.Models.Course.defaults.enabled - If true, this course
		 * is enabled within the web application.  If false, this course is ignored.
		 */
		defaults: {
			'name': '',
			'address': '',
			'city': '',
			'state': '',
			'zip': '',
			'info_url': '',
			'num_holes': 0,
			'holes': [],
			'pars': [],
			'course_id': '',
			'notes': '',
			'sort_group': '999',
			'enabled': false
		},
		
		/**
		 * Return the value on which to sort this course.  A lexical small-than value should
		 * be higher up in the list.
		 * @example
		 * let sortVal = courseModel.sortValue();
		 * // Returns "500Friendly Holes Golf Course".
		 * @member {function} gsc2app.Models.Course.sortValue
		 * @returns {string} Returns a string that can be used for lexically sorting the courses.
		 * @see {@link gsc2app.Models.Course.getCourseSortGroup}
		 */
		sortValue: function() {
			return this.sort_group + this.name;
		},

		/**
		 * Return the name of this course.
		 * @example
		 * let name = courseModel.getCourseName();
		 * // Returns, for example, "MyTown Disc Golf Course".
		 * @member {function} gsc2app.Models.Course.getCourseName
		 * @returns {string} Returns a string that is the name of this course.
		 */
		getCourseName: function() {
			return this.get('name');
		},
		
		/**
		 * Return the street address for this course.
		 * @example
		 * let streetAddress = courseModel.getCourseAddress();
		 * // Returns, for example, "123 Main Street".
		 * @member {function} gsc2app.Models.Course.getCourseAddress
		 * @returns {string} Returns a string that is the street address for this course.
		 */
		getCourseAddress: function() {
			return this.get('address');
		},
		
		/**
		 * Return the city for the address of this course.
		 * @example
		 * let city = courseModel.getCourseCity();
		 * // Returns, for example, "Jamestown".
		 * @member {function} gsc2app.Models.Course.getCourseCity
		 * @returns {string} Returns a string that is the city for the address of this course.
		 */
		getCourseCity: function() {
			return this.get('city');
		},

		/**
		 * Return the two-letter state abbreviation for the address of this course.
		 * @example
		 * let state = courseModel.getCourseState();
		 * // Returns, for example, "NY".
		 * @member {function} gsc2app.Models.Course.getCourseState
		 * @returns {string} Returns a string that is the two-letter state abbreviation for
		 * the address of this course.
		 */
		getCourseState: function() {
			return this.get('state');
		},

		/**
		 * Return the ZIP code for the address of this course.  Note that ZIP code could be a
		 * five-digit string (like "#####") or a 10-digit string ("#####-####"), depending on
		 * how the address for the course was defined originally.
		 * @example
		 * let zip = courseModel.getCourseZipCode();
		 * // Returns, for example, "12345" or "12345-6789".
		 * @member {function} gsc2app.Models.Course.getCourseZipCode
		 * @returns {string} Returns a string that is the ZIP code for the address of this course.
		 */
		getCourseZipCode: function() {
			return this.get('zip');
		},

		/**
		 * Return the informational URL for this course.  If no informational URL is defined for
		 * this course, an empty string is returned.
		 * @example
		 * let url = courseModel.getCourseInfoUrl();
		 * // Returns, for example, "https://www.dgcoursereview.com/course.php?id=8477".
		 * @member {function} gsc2app.Models.Course.getCourseInfoUrl
		 * @returns {string} Returns a string that is informational URL for this course.
		 * May be an empty string.
		 */
		getCourseInfoUrl: function() {
			return this.get('info_url');
		},

		/**
		 * Return the number of holes for this course.
		 * @example
		 * let numHoles = courseModel.getCourseNumHoles();
		 * // Returns, for example, 18.
		 * @member {function} gsc2app.Models.Course.getCourseNumHoles
		 * @returns {number} Returns the number of holes for this course.
		 */
		getCourseNumHoles: function() {
			return this.get('num_holes');
		},

		/**
		 * Return an array of strings with the hole numbers/labels/names for each hole
		 * on this course.  Each hole number is a string because some holes are designated
		 * as "14a".
		 * @example
		 * let holeLabels = courseModel.getCourseHoleNumbers();
		 * // Returns, for example, ["1", "2", "3", ..., "18"].
		 * @member {function} gsc2app.Models.Course.getCourseHoleNumbers
		 * @returns {string[]} Returns an array of strings with the hole numbers/labels/names
		 * for each hole on this course.
		 */
		getCourseHoleNumbers: function() {
			return this.get('holes');
		},

		/**
		 * Return an array of numbers with the par for each hole on this course.
		 * @example
		 * let holePars = courseModel.getCourseHolePars();
		 * // Returns, for example, [3, 3, 4, 3, 5, ..., 3].
		 * @member {function} gsc2app.Models.Course.getCourseHolePars
		 * @returns {number[]} Returns an array of numbers with the par for each hole on this course.
		 */
		getCourseHolePars: function() {
			return this.get('pars');
		},

		/**
		 * Return the total par for the course.
		 * @example
		 * let totalPar = courseModel.getCourseTotalPar();
		 * // Returns, for example, 58.
		 * @member {function} gsc2app.Models.Course.getCourseTotalPar
		 * @returns {number[]} Returns the total par for this course.
		 */
		getCourseTotalPar: function() {
			let holePars = this.getCourseHolePars();
			if (holePars) {
				let totalPar = holePars.reduce(function (accumVariable, curValue) {
						return accumVariable + curValue;
					}, 0);
				return totalPar;
			} else {
				return 0;
			}
		},

		/**
		 * Return the course ID for this course.  This is typically a GUID.
		 * @example
		 * let courseID = courseModel.getCourseID();
		 * // Returns, for example, "e8639fbb-4142-4cc0-bb76-dba581bacd22".
		 * @member {function} gsc2app.Models.Course.getCourseID
		 * @returns {string} Returns the ID for this course.
		 */
		getCourseID: function() {
			// The course ID cannot be empty, so create one on the fly.
			let courseID = this.get('course_id');
			if (courseID === '') {
				courseID = gsc2app.Utilities.generateUUID();
				this.set('course_id', courseID);
			}
			return courseID;
		},

		/**
		 * Return the notes for this course, if any notes are defined.
		 * @example
		 * let notes = courseModel.getCourseNotes();
		 * // Returns, for example, "Beware of the wetlands on hole #2.".
		 * @member {function} gsc2app.Models.Course.getCourseNotes
		 * @returns {string} Returns the notes for this course.
		 */
		getCourseNotes: function() {
			return this.get('notes');
		},
		
		/**
		 * Return the sort group for this course.  The sort group is the beginning part of the
		 * sort value that is returned by the gsc2app.Models.Course.sortValue() function.  It
		 * typically is a 3-digit number, stored as a string.
		 * @example
		 * let sortGroup = courseModel.getCourseSortGroup();
		 * // Returns, for example, "200".
		 * @member {function} gsc2app.Models.Course.getCourseSortGroup
		 * @returns {string} Returns the sort group for this course.
		 * @see {@link gsc2app.Models.Course.sortValue}
		 */
		getCourseSortGroup: function() {
			return this.get('sort_group');
		},

		/**
		 * Return a boolean value which indicates if the course is active or not.  If the course
		 * is active, it is presented in the list of courses when the user is prompted to select
		 * a course.  If it is inactive, then the course will not be shown to the user.
		 * @example
		 * let isCourseActive = courseModel.isCourseEnabled();
		 * // Returns, for example, true.
		 * @member {function} gsc2app.Models.Course.isCourseEnabled
		 * @returns {boolean} Returns true if this course is active, false if not.
		 */
		isCourseEnabled: function() {
			return this.get('enabled');
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.StringField model defines the fields necessary to define a string field
	 * that can be both displayed and edited.  It useful for storing player names and hole numbers,
	 * which could contain letters (like hole "14a").
	 * @example
	 * let stringFieldModel = new gsc2app.Models.StringField();
	 * @class {function} gsc2app.Models.StringField
	 */
	gsc2app.Models.StringField = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.StringField", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.StringField.defaults - The default values
		 * for the attributes in a gsc2app.Models.StringField object.
		 * 
		 * @property {string} gsc2app.Models.StringField.defaults.value - The string
		 * value for this field, such as a player name or a hole number, like "14a".
		 */
		defaults: {
			'value': ''
		},

		/**
		 * @property {string} gsc2app.Models.StringField.model_type - The string name
		 * for this model, namely "gsc2app.Models.StringField".  This allows common
		 * event handlers between the gsc2app.Models.StringField and
		 * gsc2app.Models.NumberField objects.
		 */
		model_type: 'gsc2app.Models.StringField',

		/**
		 * Set the value for this string field.
		 * @example
		 * stringFieldModel.setValue("14a");
		 * // Sets the name for the hole to be "14a".
		 * @member {function} gsc2app.Models.StringField.setValue
		 * @returns {gsc2app.Models.StringField} Returns this.
		 * @see {@link gsc2app.Models.StringField.getValue}
		 */
		setValue: function(value) {
			this.set('value', value);
			return this;
		},

		/**
		 * Get the string value for this field.
		 * @example
		 * let fieldValue = stringFieldModel.getValue();
		 * // Returns the string value for this field, for example, "14a".
		 * @member {function} gsc2app.Models.StringField.getValue
		 * @returns {string} Returns the string value for this field.
		 * @see {@link gsc2app.Models.StringField.setValue}
		 */
		getValue: function() {
			return this.get('value');
		},

		/**
		 * Get the model type string to identify this object.
		 * @example
		 * let modelType = stringFieldModel.getModelType();
		 * // Returns "gsc2app.Models.StringField".
		 * @member {function} gsc2app.Models.StringField.getModelType
		 * @returns {string} Returns "gsc2app.Models.StringField".
		 */
		getModelType: function() {
			return this.model_type;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.ScoreRankingsEnum declares the constants for identifying the various
	 * statistics that that are defined for each player.
	 * @readonly
	 * @enum {string}
	 */
	gsc2app.Models.ScoreRankingsEnum = {
		NONE: 'none',
		HOLE_IN_ONE: 'hole-in-one',
		TWO_UNDER_OR_BETTER: 'eagle-or-better',
		ONE_UNDER: 'birdie',
		EVEN: 'par',
		ONE_OVER: 'bogey',
		TWO_OVER: 'double-bogey',
		THREE_OVER_OR_WORSE: 'triple-bogey-or-worse'
	};

	/**
	 * Check to see if a rank level is valid, which means is it a value within the
	 * gsc2app.Models.ScoreRankingsEnum enumeration.  Returns true if it is valid,
	 * false if not.
	 * @example
	 * let isValid1 = gsc2app.Models.isScoreRankingLevelValid("eagle-or-better");
	 * // isValid1 is set to true.
	 * let isValid2 = gsc2app.Models.isScoreRankingLevelValid("bogeys-are-bad");
	 * // isValid2 is set to false.
	 * @param {string} rankLevel - The input rank level to test for validity.
	 * @returns {boolean} Returns true if rankLevel is valid, false if not.
	 * @see {@link gsc2app.Models.ScoreRankingsEnum}
	 */
	gsc2app.Models.isScoreRankingLevelValid = function(rankLevel) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.isScoreRankingLevelValid", 'nodetype':"function", 'group':"gsc2app.Models", 'datatype':"node"}
		for (let rankName in gsc2app.Models.ScoreRankingsEnum) {
			if (gsc2app.Models.ScoreRankingsEnum[rankName] === rankLevel) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Function to transform the score value and its associated par value for a hole and
	 * return a string from the gsc2app.Models.ScoreRankingsEnum enumeration.
	 * @example
	 * let scoreRankLevel = gsc2app.Models.mapScoreToRankLevel(5, 3);   // Oops, a double-bogey.
	 * // Returns the string corresponding to gsc2app.Models.ScoreRankingsEnum.TWO_OVER.
	 * @param {number} score - The current score value for this hole.  Expected to be a
	 * positive integer value.
	 * @param {number} par - The par value for the hole.  Expected to be a positive integer.
	 * @returns {string} The rank level string from gsc2app.Models.ScoreRankingsEnum.
	 * @see {@link gsc2app.Models.ScoreRankingsEnum}
	 */
	gsc2app.Models.mapScoreToRankLevel = function(score, par) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.mapScoreToRankLevel", 'nodetype':"function", 'group':"gsc2app.Models", 'datatype':"node"}
		if (par > 0 && score > 0) {
			if (score === 1) {
				return gsc2app.Models.ScoreRankingsEnum.HOLE_IN_ONE;
			}
			if (score === par) {
				return gsc2app.Models.ScoreRankingsEnum.EVEN;
			}

			let scoreDiff = score - par;
			if (scoreDiff === 1) {
				return gsc2app.Models.ScoreRankingsEnum.ONE_OVER;
			}
			if (scoreDiff === 2) {
				return gsc2app.Models.ScoreRankingsEnum.TWO_OVER;
			}
			if (scoreDiff >= 3) {
				return gsc2app.Models.ScoreRankingsEnum.THREE_OVER_OR_WORSE;
			}
			if (scoreDiff === -1) {
				return gsc2app.Models.ScoreRankingsEnum.ONE_UNDER;
			}
			if (scoreDiff <= -2) {
				return gsc2app.Models.ScoreRankingsEnum.TWO_UNDER_OR_BETTER;
			}
		}
		return gsc2app.Models.ScoreRankingsEnum.NONE;
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.NumberField model defines the fields necessary to define a numeric
	 * golf score (or par), with possible alphanumeric qualifiers such as "m" for mulligan.
	 * @example
	 * let scoreFieldModel = new gsc2app.Models.NumberField();
	 * @class {function} gsc2app.Models.NumberField
	 */
	gsc2app.Models.NumberField = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.NumberField", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.NumberField.defaults - The default values for the
		 * attributes in a gsc2app.Models.NumberField object.
		 * 
		 * @property {number} gsc2app.Models.NumberField.defaults.value - The integer score/value
		 * for this hole.
		 * 
		 * @property {string} gsc2app.Models.NumberField.defaults.qualifiers - Character codes
		 * to indicate qualifiers on the score (like "b" means out of bounds, "m" for mulligan,
		 * "*" for clang rule, etc.).
		 * 
		 * @property {boolean} gsc2app.Models.NumberField.defaults.qualifiers_allowed - If true,
		 * this hole may have qualifier codes.  If false, it may only be numeric.
		 * 
		 * @property {boolean} gsc2app.Models.NumberField.defaults.numeric_only - If true, this
		 * field should only allow numeric values to be entered in.
		 * 
		 * @property {number} gsc2app.Models.NumberField.defaults.player_number - The 1-based
		 * number for the player, mainly used as a reference for updating the total score and
		 * statisics for this player.
		 * 
		 * @property {number} gsc2app.Models.NumberField.defaults.hole_number - The 1-based
		 * number for the hole, mainly used as a reference for obtaining the par value for this
		 * hole so that the score may be highlighted appropriately.
		 * 
		 * @property {boolean} gsc2app.Models.NumberField.defaults.show_ranking - If true,
		 * show the score ranking, which is a visual styling representation if the score was a
		 * par, birdie, bogey, etc.  If false, no show any indication of the score ranking.
		 * 
		 * @property {gsc2app.Models.ScoreRankingsEnum} - ranking_level - The string value
		 * from the gsc2app.Models.ScoreRankingsEnum enumeration which indicates how the score
		 * compared to par.  Only meaningful if the gsc2app.Models.NumberField.defaults.show_ranking
		 * is true.
		 * @see {@link gsc2app.Models.ScoreRankingsEnum}
		 */
		defaults: {
			'value': 0,
			'qualifiers': '',
			'qualifiers_allowed': true,
			'numeric_only': false,
			'player_number': 0,
			'hole_number': 0,
			'show_ranking': false,
			'ranking_level': gsc2app.Models.ScoreRankingsEnum.NONE
		},

		/**
		 * @property {string} gsc2app.Models.NumberField.model_type - The string name for this
		 * model, namely "gsc2app.Models.NumberField".  This allows common event handlers between
		 * the gsc2app.Models.StringField and gsc2app.Models.NumberField objects, while still
		 * allowing the processing to be tweaked depending on the model type.
		 */
		model_type: 'gsc2app.Models.NumberField',

		/**
		 * Enable qualifiers for the field so that qualifier characters may be entered.
		 * @example
		 * scoreFieldModel.enableQualifiers();
		 * @member {function} gsc2app.Models.NumberField.enableQualifiers
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.disableQualifiers}
		 * @see {@link gsc2app.Models.NumberField.areQualifiersAllowed}
		 */
		enableQualifiers: function() {
			this.set('qualifiers_allowed', true);
			return this;
		},

		/**
		 * Disable qualifiers for the field so that qualifier characters are not allowed to be entered.
		 * @example
		 * scoreFieldModel.disableQualifiers();
		 * @member {function} gsc2app.Models.NumberField.disableQualifiers
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.enableQualifiers}
		 * @see {@link gsc2app.Models.NumberField.areQualifiersAllowed}
		 */
		disableQualifiers: function() {
			this.set('qualifiers_allowed', false);
			return this;
		},

		/**
		 * Returns the flag value for whether or not qualifiers for the field are permitted.
		 * @example
		 * let qualifiersAllowed = scoreFieldModel.areQualifiersAllowed();
		 * @member {function} gsc2app.Models.NumberField.areQualifiersAllowed
		 * @returns {boolean} Returns true if the field allows qualifiers, false if not.
		 * @see {@link gsc2app.Models.NumberField.enableQualifiers}
		 * @see {@link gsc2app.Models.NumberField.disableQualifiers}
		 */
		areQualifiersAllowed: function() {
			return this.get('qualifiers_allowed');
		},

		/**
		 * Set the value for this field, which normally is the score or par value for the hole.
		 * @example
		 * scoreFieldModel.setValue(3);
		 * // Sets the score/par value for the hole to be 3.
		 * @member {function} gsc2app.Models.NumberField.setValue
		 * @param {number} value - The score/par value to set for this hole.  Must be non-negative.
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.getValue}
		 */
		setValue: function(value) {
			// The value must be non-negative.
			if (value >= 0) {
				this.set('value', value);
			} else {
				gsc2app.Utilities.logMsg(`Invalid score/par value, ignoring it: "${value}"`);
			}
			return this;
		},
		
		/**
		 * Get the value for this field, which normally is the score or par value for the hole.
		 * @example
		 * let currentValue = scoreFieldModel.getValue();
		 * // Returns the score/par value for the hole, for example, 3.
		 * @member {function} gsc2app.Models.NumberField.getValue
		 * @returns {number} Returns the current value for this field, which normally is the
		 * score or par value for this hole.
		 * @see {@link gsc2app.Models.NumberField.setValue}
		 */
		getValue: function() {
			return this.get('value');
		},
		
		/**
		 * Set a string of qualifiers for the value in this field.  A qualifier is zero or more
		 * characters which can indicate something about the value in the field.
		 * @example
		 * scoreFieldModel.setQualifiers("bbttt");
		 * // Sets the qualifiers to be two "b", perhaps indicating two out-of-bounds instances,
		 * // and three "t", perhaps indicate three instances when a tree was hit.
		 * @member {function} gsc2app.Models.NumberField.setQualifiers
		 * @param {string} qualifiers - The string with the qualifier characters to be set.
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.getQualifiers}
		 */
		setQualifiers: function(qualifiers) {
			this.set('qualifiers', qualifiers);
			return this;
		},
		
		/**
		 * Get the string with the qualifiers for this field.
		 * @example
		 * let qualifiers = scoreFieldModel.getQualifiers();
		 * // Returns a string with the qualifier characters.
		 * @member {function} gsc2app.Models.NumberField.getQualifiers
		 * @returns {string} Returns the string with the qualifier characters for this field.
		 * @see {@link gsc2app.Models.NumberField.setQualifiers}
		 */
		getQualifiers: function() {
			return this.get('qualifiers');
		},
		
		/**
		 * Enable the flag to have the field only accept and display numeric values.  No qualifiers
		 * will be shown, even if any qualifiers are set programmatically.
		 * @example
		 * scoreFieldModel.setNumericOnly();
		 * @member {function} gsc2app.Models.NumberField.setNumericOnly
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.isNumericOnly}
		 */
		setNumericOnly: function() {
			this.set('numeric_only', true);
			return this;
		},
		
		/**
		 * Disable the flag that restricts the field to only accept and display numeric values.
		 * With this flag disabled, the field will accept and show both a numeric value and
		 * its qualifiers.
		 * @example
		 * scoreFieldModel.clearNumericOnly();
		 * @member {function} gsc2app.Models.NumberField.clearNumericOnly
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.isNumericOnly}
		 */
		clearNumericOnly: function() {
			this.set('numeric_only', false);
			return this;
		},

		/**
		 * Return the state of the numeric-only flag
		 * @example
		 * let onlyShowNumbers = scoreFieldModel.isNumericOnly();
		 * // Returns true if only numbers and no qualifiers should be shown.
		 * @member {function} gsc2app.Models.NumberField.isNumericOnly
		 * @returns {boolean} Returns true if the field should only show numeric values and no
		 * qualifiers, and false if both numeric values and qualifiers should be shown.
		 * @see {@link gsc2app.Models.NumberField.setNumericOnly}
		 * @see {@link gsc2app.Models.NumberField.clearNumericOnly}
		 */
		isNumericOnly: function() {
			return this.get('numeric_only');
		},

		/**
		 * Return the 1-based number for the player to which this field is associated.  If no
		 * player is associated with this field, the return value is zero.
		 * @example
		 * let playerNum = scoreFieldModel.getPlayerNumber();
		 * // Returns 1 for player #2, 2 for player #2, etc.
		 * @member {function} gsc2app.Models.NumberField.getPlayerNumber
		 * @returns {number} Returns the 1-based number of the player to which this field is associated.
		 * @see {@link gsc2app.Models.v.setPlayerNumber}
		 */
		getPlayerNumber: function() {
			return this.get('player_number');
		},

		/**
		 * Set the 1-based number for the player for which this field is associated.  If no
		 * player should be associated with this field, set the value to be zero.
		 * @example
		 * scoreFieldModel.setPlayerNumber(2);
		 * // Associate this field with player #2.
		 * @member {function} gsc2app.Models.NumberField.setPlayerNumber
		 * @param {number} n - 1-based player number.
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.getPlayerNumber}
		 */
		setPlayerNumber: function(n) {
			// To be a valid player number, n should be 1-based.
			this.set('player_number', n);
			return this;
		},

		/**
		 * Return the 1-based number for the hole to which this field is associated.  If no
		 * hole is associated with this field, the return value is zero.
		 * @example
		 * let holeNum = scoreFieldModel.getHoleNumber();
		 * // Returns 1 for hole #2, 2 for hole #2, etc.
		 * @member {function} gsc2app.Models.NumberField.getHoleNumber
		 * @returns {number} Returns the 1-based number of the hole to which this field is associated.
		 * @see {@link gsc2app.Models.v.setHoleNumber}
		 */
		getHoleNumber: function() {
			return this.get('hole_number');
		},

		/**
		 * Set the 1-based number for the hole for which this field is associated.  If no
		 * hole should be associated with this field, set the value to be zero.
		 * @example
		 * scoreFieldModel.setHoleNumber(2);
		 * // Associate this field with hole #2.
		 * @member {function} gsc2app.Models.NumberField.setHoleNumber
		 * @param {number} n - 1-based hole number.
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.getHoleNumber}
		 */
		setHoleNumber: function(n) {
			// To be a valid hole number, n should be 1-based.
			this.set('hole_number', n);
			return this;
		},

		/**
		 * Enable the score ranking to be shown for this number field.
		 * @example
		 * scoreFieldModel.enableScoreRanking();
		 * @member {function} gsc2app.Models.NumberField.enableScoreRanking
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.disableScoreRanking}
		 * @see {@link gsc2app.Models.NumberField.shouldShowScoreRanking}
		 */
		enableScoreRanking: function() {
			this.set('show_ranking', true);
			return this;
		},

		/**
		 * Disable the score ranking to be shown for this number field.
		 * @example
		 * scoreFieldModel.disableScoreRanking();
		 * @member {function} gsc2app.Models.NumberField.disableScoreRanking
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.NumberField.enableScoreRanking}
		 * @see {@link gsc2app.Models.NumberField.shouldShowScoreRanking}
		 */
		disableScoreRanking: function() {
			this.set('show_ranking', false);
			return this;
		},

		/**
		 * Return true if the score ranking should be show for this number field, false if not.
		 * @example
		 * let showScoreRanking = scoreFieldModel.shouldShowScoreRanking();
		 * @member {function} gsc2app.Models.NumberField.shouldShowScoreRanking
		 * @returns {boolean} Returns true if score ranking is enabled for this number field, false if not.
		 * @see {@link gsc2app.Models.v.enableScoreRanking}
		 * @see {@link gsc2app.Models.v.disableScoreRanking}
		 */
		shouldShowScoreRanking: function() {
			return this.get('show_ranking');
		},

		/**
		 * Return the current score ranking string for this number field.  Only meaningful if
		 * score ranking is enabled.
		 * @example
		 * let scoreRank = scoreFieldModel.getScoreRankingLevel();
		 * // Returns a gsc2app.Models.ScoreRankingsEnum enumeration string.
		 * @member {function} gsc2app.Models.NumberField.getScoreRankingLevel
		 * @returns {string} Returns the score ranking, which should be a string defined in the
		 * gsc2app.Models.ScoreRankingsEnum enumeration.
		 * @see {@link gsc2app.Models.ScoreRankingsEnum}
		 * @see {@link gsc2app.Models.enableScoreRanking}
		 * @see {@link gsc2app.Models.shouldShowScoreRanking}
		 */
		getScoreRankingLevel: function() {
			if (this.shouldShowScoreRanking()) {
				return this.get('ranking_level');
			}
			return gsc2app.Models.ScoreRankingsEnum.NONE;
		},

		/**
		 * Set the current score ranking string for this number field.  Only meaningful if
		 * score ranking is enabled.
		 * @example
		 * scoreFieldModel.setScoreRankingLevel(gsc2app.Models.ScoreRankingsEnum.ONE_OVER);
		 * // The player got a bogey on this hole.
		 * @param {gsc2app.Models.ScoreRankingsEnum} rankLevel - The desired rank level which
		 * should be a string from the gsc2app.Models.ScoreRankingsEnum enumeration.
		 * @member {function} gsc2app.Models.NumberField.setScoreRankingLevel
		 * @returns {gsc2app.Models.NumberField} Returns this.
		 * @see {@link gsc2app.Models.ScoreRankingsEnum}
		 * @see {@link gsc2app.Models.enableScoreRanking}
		 * @see {@link gsc2app.Models.shouldShowScoreRanking}
		 */
		setScoreRankingLevel: function(rankLevel) {
			if (this.shouldShowScoreRanking()) {
				if (gsc2app.Models.isScoreRankingLevelValid(rankLevel)) {
					this.set('ranking_level', rankLevel);
				}
			}
			return this;
		},

		/**
		 * Get the model type string to identify this object.
		 * @example
		 * let modelType = scoreFieldModel.getModelType();
		 * // Returns "gsc2app.Models.NumberField".
		 * @member {function} gsc2app.Models.NumberField.getModelType
		 * @returns {string} Returns "gsc2app.Models.NumberField".
		 */
		getModelType: function() {
			return this.model_type;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.OneStat model defines the base class for a hole statistic to track
	 * for a player. 
	 * @example
	 * let oneStat = new gsc2app.Models.OneStat();
	 * oneStat.initialize("num-pars");
	 * @class {function} gsc2app.Models.OneStat
	 */
	gsc2app.Models.OneStat = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.OneStat", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.OneStat.defaults - The default values for the
		 * attributes in a gsc2app.Models.OneStat object.
		 * 
		 * @property {string} gsc2app.Models.OneStat.defaults.stat_name - A string name
		 * for the particular statistic.
		 * 
		 * @property {gsc2app.Models.NumberField} gsc2app.Models.Player.defaults.stat_value -
		 * An instance of a gsc2app.Models.NumberField object to keep track of this particular
		 * statistic.
		 * @see {@link gsc2app.Models.NumberField}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.NumberField", 'tonodename':"gsc2app.Models.OneStat", 'datatype':"edge", 'edgetype':"normal"}
		 */
		defaults: {
			'stat_name': '',
			'stat_value': {}
		},

		/**
		 * Initialize this statistic with a name.  Prepares the number field attributes.
		 * @example
	 	 * oneStat.initialize("num-pars");
		 * @member {function} gsc2app.Models.OneStat.initialize
		 * @param {string} statName - The name for this statistic.
		 * @returns {gsc2app.Models.OneStat} Returns this.
		 */
		initialize: function(statName) {
			let newStat = new gsc2app.Models.NumberField();
			newStat
				.disableQualifiers()
				.enableScoreRanking()
				.setScoreRankingLevel(statName)
				.setNumericOnly()
				.setValue(0);
			this.set('stat_value', newStat);
			this.set('stat_name', statName);
			return this;
		},

		/**
		 * Return the name of this statistic.
		 * @example
	 	 * let thisStatName = oneStat.getStatName();
		 * // Returns, for example, "num-pars".
		 * @member {function} gsc2app.Models.OneStat.getStatName
		 * @returns {string} Returns the name of this statistic.
		 */
		getStatName: function() {
			return this.get('stat_name');
		},

		/**
		 * Return the underlying number field model for this statistic.
		 * @example
	 	 * let thisStatField = oneStat.getStatFieldModel();
		 * @member {function} gsc2app.Models.OneStat.getStatFieldModel
		 * @returns {gsc2app.Models.NumberField} Returns the name of this statistic.
		 * @see {@link gsc2app.Models.NumberField}
		 */
		getStatFieldModel: function() {
			return this.get('stat_value');
		},

		/**
		 * Return the value for this statistic.
		 * @example
	 	 * let statValue = oneStat.getValue();
		 * @member {function} gsc2app.Models.OneStat.getValue
		 * @returns {number} Returns the value for this statistic.
		 */
		getValue: function() {
			return this.get('stat_value').getValue();
		},

		/**
		 * Set the value for this statistic.
		 * @example
	 	 * oneStat.setValue(6);
		 * @member {function} gsc2app.Models.OneStat.setValue
		 * @param {number} val - The numeric value for the statistic to set.
		 * @returns {number} Returns the value for this statistic.
		 */
		setValue: function(val) {
			this.get('stat_value').setValue(val);
			return this;
		},

		/**
		 * Clear the value of this statistic.  Resets it to zero.
		 * @example
	 	 * oneStat.clear();
		 * @member {function} gsc2app.Models.OneStat.clear
		 * @returns {gsc2app.Models.OneStat} Returns this.
		 */
		clear: function() {
			this.get('stat_value').setValue(0);
			return this;
		},

		/**
		 * Increments the statistical counter by the given value, which defaults to 1.
		 * @example
	 	 * oneStat.increment();
		 * @member {function} gsc2app.Models.OneStat.clearStat
		 * @param {number} [n=1] - Amount to increment the statistical counter.
		 * @returns {gsc2app.Models.OneStat} Returns this.
		 */
		increment: function(n = 1) {
			let thisStat = this.get('stat_value');
			let thisStatValue = thisStat.getValue();
			thisStat.setValue(thisStatValue + n);
			this.set('stat_value', thisStat);
			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.PlayerStats model defines the fields to keep track of a player's statistics
	 * for the round of golf.
	 * @example
	 * let playerStats = new gsc2app.Models.PlayerStats();
	 * @class {function} gsc2app.Models.PlayerStats
	 */
	gsc2app.Models.PlayerStats = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.PlayerStats", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.PlayerStats.defaults - The default values for the
		 * attributes in a gsc2app.Models.PlayerStats object.
		 * 
		 * @property {object} gsc2app.Models.PlayerStats.defaults.stats_list - The list of the
		 * various statistical models.  Will be set to an instance of a gsc2app.Collections.Stats
		 * object.
		 * @see {@link gsc2app.Collections.Stats}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Collections.Stats", 'tonodename':"gsc2app.Models.PlayerStats", 'datatype':"edge", 'edgetype':"normal"}
		 */
		defaults: {
			'stats_list': {}		// Will be set to an instance of a gsc2app.Collections.Stats object.
		},

		/**
		 * Initialize the list of statistical models.
		 * @example
	 	 * playerStats.initialize();
		 * @member {function} gsc2app.Models.PlayerStats.initialize
		 * @returns {gsc2app.Models.PlayerStats} Returns this.
		 */
		initialize: function() {
			let statList = new gsc2app.Collections.Stats();
			// Iterate over the statistics enum and allocate a statistics field
			// for each one.
			for (let statID in gsc2app.Models.ScoreRankingsEnum) {
				let statName = gsc2app.Models.ScoreRankingsEnum[statID];
				let newStat = new gsc2app.Models.OneStat();
				newStat.initialize(statName);
				statList.add(newStat);
			}
			this.set('stat_list', statList);
			return this;
		},

		/**
		 * Retrieve the statistics object for the given statistics name, which should be a
		 * gsc2app.Models.ScoreRankingsEnum value.
		 * @example
		 * let statModel = playerStats.getStatFieldModel();
		 * @param {gsc2app.Models.ScoreRankingsEnum} statName - The gsc2app.Models.ScoreRankingsEnum value to
		 * specify the desired statistic name.
		 * @member {function} gsc2app.Models.PlayerStats.getStatFieldModel
		 * @returns {gsc2app.Models.OneStat} Returns the underylying field model for this statistic.
		 * @see {@link gsc2app.Models.OneStat}
		 * @see {@link gsc2app.Models.ScoreRankingsEnum}
		 */
		getStatFieldModel: function(statName) {
			let statList = this.get('stat_list');
			for (let n = 0; n < statList.length; n++) {
				let statModel = statList.at(n);
				if (statName === statModel.getStatName()) {
					// Found it.
					return statModel;
				}
			}
			return null;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.Player model defines the fields to define a person playing a round of golf.
	 * @example
	 * let playerModel = new gsc2app.Models.Player();
	 * @class {function} gsc2app.Models.Player
	 */
	gsc2app.Models.Player = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.Player", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.Player.defaults - The default values for the attributes
		 * in a gsc2app.Models.Player object.
		 * 
		 * @property {gsc2app.Models.StringField} gsc2app.Models.Player.defaults.player_name - The
		 * name of the player as an editable field.
		 * @see {@link gsc2app.Models.StringField}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.StringField", 'tonodename':"gsc2app.Models.Player", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {number} gsc2app.Models.Player.defaults.player_number - The 1-based number for
		 * the player in the array of players.
		 * 
		 * @property {gsc2app.Collections.NumberFields} gsc2app.Models.Player.defaults.hole_scores -
		 * Will be set to a gsc2app.Collections.NumberFields object.
		 * @see {@link gsc2app.Collections.NumberFields}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Collections.NumberFields", 'tonodename':"gsc2app.Models.Player", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {gsc2app.Models.NumberField} gsc2app.Models.Player.defaults.total_score -
		 * Will be set to an instance of a gsc2app.Models.NumberField object.
		 * @see {@link gsc2app.Models.NumberField}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.NumberField", 'tonodename':"gsc2app.Models.Player", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {gsc2app.Models.PlayerStats} gsc2app.Models.Player.defaults.player_stats -
		 * Will be set to an instance of a gsc2app.Collection.PlayerStats object for keeping
		 * track of the player statistics over the round of golf.
		 * @see {@link gsc2app.Models.PlayerStats}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.PlayerStats", 'tonodename':"gsc2app.Models.Player", 'datatype':"edge", 'edgetype':"normal"}
		 */
		defaults: {
			'player_name': {},
			'player_number': 0,
			'hole_scores': {},
			'total_score': {},
			'player_stats': {}
		},
		
		/**
		 * Allocate the holes for this player object.
		 * @example
		 * playerModel.allocateHoles(18);
		 * // Allocates 18 holes
		 * @member {function} gsc2app.Models.Player.allocateHoles
		 * @param {number} numHoles - Number of holes to allocate.
		 * @returns {gsc2app.Models.Player} Returns this.
		 */
		allocateHoles: function(numHoles) {
			// Start with allocating a new player name field.
			let playerName = new gsc2app.Models.StringField();
			this.set('player_name', playerName);

			if (numHoles && numHoles > 0) {
				let holeScores = new gsc2app.Collections.NumberFields();
				for (let n = 0; n < numHoles; n++) {
					let newHole = new gsc2app.Models.NumberField();
					newHole
						.enableQualifiers()
						.clearNumericOnly()
						.enableScoreRanking()
						.setHoleNumber(n+1);
					holeScores.add(newHole);
				}
				this.set('hole_scores', holeScores);
				
				let totalScore = new gsc2app.Models.NumberField();
				totalScore
					.enableQualifiers()
					.clearNumericOnly()
					.disableScoreRanking()
					.setValue(0);
				this.set('total_score', totalScore);

				let theStats = new gsc2app.Models.PlayerStats();
				theStats.initialize();
				this.set('player_stats', theStats);
			} else {
				gsc2app.Utilities.errorMsg(`Cannot allocate array of holes: Number of holes is invalid: ${ numHoles }.`);
			}
			return this;
		},

		/**
		 * Set the player name.
		 * @example
		 * playerModel.setPlayerName("John");
		 * @member {function} gsc2app.Models.Player.setPlayerName
		 * @param {string} playerName - The player name to set.
		 * @returns {gsc2app.Models.Player} Returns this.
		 * @see {@link gsc2app.Models.Player.getPlayerName}
		 */
		setPlayerName: function(playerName) {
			if (!playerName) {
				playerName = '';
			}
			this.get('player_name').setValue(playerName);
			return this;
		},

		/**
		 * Get the player name.
		 * @example
		 * let thisPlayer = playerModel.getPlayerName();
		 * @member {function} gsc2app.Models.Player.getPlayerName
		 * @returns {string} Returns the player name.
		 * @see {@link gsc2app.Models.Player.setPlayerName}
		 */
		getPlayerName: function() {
			return this.get('player_name').getValue();
		},

		/**
		 * Get the model field object for the player name.
		 * @example
		 * let playerNameFieldModel = playerModel.getPlayerNameFieldModel();
		 * @member {function} gsc2app.Models.Player.getPlayerNameFieldModel
		 * @returns {gsc2app.Models.StringField} Returns the player name.
		 * @see {@link gsc2app.Models.Player.getPlayerName}
		 * @see {@link gsc2app.Models.StringField}
		 */
		getPlayerNameFieldModel: function() {
			return this.get('player_name');
		},

		/**
		 * Set the player number, which should be a 1-based number (so it is 1 for player #1).
		 * @example
		 * playerModel.setPlayerNumber(2);
		 * @member {function} gsc2app.Models.Player.setPlayerNumber
		 * @param {number} n - The 1-based player number to set.
		 * @returns {gsc2app.Models.Player} Returns this.
		 * @see {@link gsc2app.Models.Player.getPlayerNumber}
		 */
		setPlayerNumber: function(n) {
			// The 1-based player number needs to be saved in this object, and in each
			// hole score object, and in the total score object.
			this.set('player_number', n);

			let holeScores = this.get('hole_scores');
			holeScores.setPlayerNumber(n);
			this.set('hole_scores', holeScores);

			let totalScore = this.get('total_score');
			totalScore.setPlayerNumber(n);
			this.set('total_score', totalScore);

			return this;
		},

		/**
		 * Get the 1-based player number.
		 * @example
		 * let thisPlayerNumber = playerModel.getPlayerNumber();
		 * @member {function} gsc2app.Models.Player.getPlayerNumber
		 * @returns {number} Returns the 1-based player number.
		 * @see {@link gsc2app.Models.Player.setPlayerNumber}
		 */
		getPlayerNumber: function() {
			return this.get('player_number');
		},

		/**
		 * Get a collection of the editable fields for the hole scores.  Assumes the holes
		 * have been allocated already.
		 * @example
		 * let holeScoreCollection = playerModel.getHoleScores();
		 * @member {function} gsc2app.Models.Player.getHoleScores
		 * @returns {gsc2app.Collections.NumberFields} Returns a gsc2app.Collections.NumberFields object.
		 * @see {@link gsc2app.Models.Player.allocateHoles}
		 * @see {@link gsc2app.Collections.NumberFields}
		 */
		getHoleScores: function() {
			// Returns a gsc2app.Collections.NumberFields object.
			return this.get('hole_scores');
		},

		/**
		 * Get an editable field which contains the total score for this player.  Assumes
		 * the holes have been allocated already.
		 * @example
		 * let totalScoreForPlayer = playerModel.getTotalScore();
		 * @member {function} gsc2app.Models.Player.getTotalScore
		 * @returns {gsc2app.Models.NumberField} Returns a gsc2app.Models.NumberField object.
		 * @see {@link gsc2app.Models.Player.allocateHoles}
		 * @see {@link gsc2app.Models.NumberField}
		 */
		getTotalScore: function() {
			// Returns a gsc2app.Models.NumberField object.
			return this.get('total_score');
		},

		/**
		 * Update the total score for this player.
		 * @example
		 * playerModel.updateScoreTotal();
		 * @member {function} gsc2app.Models.Player.updateScoreTotal
		 * @returns {gsc2app.Models.Player} Returns this.
		 * @see {@link gsc2app.Models.Scorecard.updateScoreTotal}
		 */
		updateScoreTotal: function() {
			let holeScores = this.get('hole_scores');
			let sumScore = 0;
			let sumQualifiers = '';
			for (let n = 0; n < holeScores.length; n++) {
				let thisHole = holeScores.at(n);		// This is a gsc2app.Models.NumberField object.
				sumScore += thisHole.getValue();
				sumQualifiers += thisHole.getQualifiers();
			}
			let totalScore = this.get('total_score');
			totalScore.setValue(sumScore);
			totalScore.setQualifiers(sumQualifiers);
			return this;
		},

		/**
		 * Get the gsc2app.Models.PlayerStats object containing the player statistics for this
		 * round of golf.
		 * @example
		 * let thisPlayerStats = playerModel.getPlayerStats();
		 * @member {function} gsc2app.Models.Player.getPlayerStats
		 * @returns {gsc2app.Models.PlayerStats} Returns the object containing the player statistics.
		 * @see {@link gsc2app.Models.PlayerStats}
		 */
		getPlayerStats: function() {
			return this.get('player_stats');
		},

		/**
		 * Update the statistics for this player.
		 * @example
		 * playerModel.updateStats(parCollection);
		 * @param {gsc2app.Collections.NumberFields} parCollection - The collection of number fields
		 * containing the hole par values from the scorecard.  Note that the original hole pars
		 * should not be used here because the user may have modified a par value for a hole.
		 * @member {function} gsc2app.Models.Player.updateStats
		 * @returns {gsc2app.Models.Player} Returns this.
		 * @see {@link gsc2app.Collections.NumberFields}
		 * @see {@link gsc2app.Models.Scorecard.updateStats}
		 */
		updateStats: function(parCollection) {
			if (parCollection && parCollection.length > 0) {
				let holeScores = this.get('hole_scores');
				if (holeScores && holeScores.length === parCollection.length) {
					// Initialize a set of statistic counters so that all of the
					// stats may be updated at once, so the display doesn't flicker
					// with multiple updates as the statistics are accummulated.
					let statAccums = {};
					for (let rankName in gsc2app.Models.ScoreRankingsEnum) {
						statAccums[gsc2app.Models.ScoreRankingsEnum[rankName]] = 0;
					}

					// Now scan through the holes and determine their ranking,
					// accummulating the statistics along the way.
					for (let n = 0; n < holeScores.length; n++) {
						let thisHole = holeScores.at(n);		// This is a gsc2app.Models.NumberField object.
						let holePar = parCollection.at(n);		// This is a gsc2app.Models.NumberField object.
						let holeScoreValue = thisHole.getValue();
						let holeParValue = holePar.getValue();
						let rankLevel = gsc2app.Models.mapScoreToRankLevel(holeScoreValue, holeParValue);
						if (rankLevel !== thisHole.getScoreRankingLevel()) {
							thisHole.setScoreRankingLevel(rankLevel);
						}
						statAccums[rankLevel]++;
					}

					// Now update the statistical fields.
					let playerStats = this.get('player_stats');
					if (playerStats) {
						for (let rankName in statAccums) {
							let statValue = statAccums[rankName];
							playerStats.getStatFieldModel(rankName).setValue(statValue);
						}
					}
				}
			}
			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Generate a new scorecard ID string given a userspace ID.
	 * @example
	 * gsc2app.Models.newScorecardID("b32307a1");
	 * // Returns a new scorecard ID string, for example, "b32307a1_20201121_185016039_796742".
	 * @param {string} userspaceID - The userspace ID to include in the scorecard ID.
	 * @returns {string} The new scorecard ID.s
	 */
	gsc2app.Models.newScorecardID = function(userspaceID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.newScorecardID", 'nodetype':"function", 'group':"gsc2app.Models", 'datatype':"node"}
		// Generates a new scorecard ID, starting from the current date/time.
		let d = new Date();

		let yyyy = d.getFullYear();

		let mm = d.getMonth() + 1;
		if (mm < 10) { mm = '0' + mm; }

		let dd = d.getDate();
		if (dd < 10) { dd = '0' + dd; }

		let HH = d.getHours();
		if (HH < 10) { HH = '0' + HH; }

		let MM = d.getMinutes();
		if (MM < 10) { MM = '0' + MM; }

		let SS = d.getSeconds();
		if (SS < 10) { SS = '0' + SS; }

		let MMM = d.getMilliseconds();
		if (MMM < 10) { MMM = '00' + MMM; }
		else if (MMM < 100) { MMM = '0' + MMM; }

		let randValue = gsc2app.Utilities.randomIntFromInterval(100000, 999999);

		// The concatenation with blank strings below ensures that string concatenation
		// will be done instead of mathematical addition.
		let newID = `${yyyy}${mm}${dd}_${HH}${MM}${SS}${MMM}_${randValue}`;
		if (userspaceID && userspaceID !== '') {
			newID = `${userspaceID}_${newID}`;
		}
		gsc2app.Utilities.logMsg(`New scorecard ID = ${newID}`);
		return newID;
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler function to update the total score value in the model.  The this object
	 * is an instance of a gsc2app.Models.Scorecard object.
	 * @param {event} evt - The event object with information on what generated the event.
	 * The value evt.player_number should be set to the 1-based player number for the hole
	 * that was updated, or 0 if the par of a hole was updated.
	 * @this gsc2app.Models.Scorecard
	 * @see {@link gsc2app.Models.Scorecard}
	 * @see {@link gsc2app.Models.Scorecard.updateParTotal}
	 * @see {@link gsc2app.Models.Scorecard.updateScoreTotal}
	 */
	gsc2app.Models.updateModelTotalScoreHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.updateModelTotalScoreHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Models", 'datatype':"node"}
		// In this handler, the "this" object is already set to be an instance of a
		// gsc2app.Models.Scorecard object.
		if (evt.player_number > 0) {
			this.updateScoreTotal(evt.player_number)
				.updateStats(evt.player_number);
		} else {
			// 0 = all players below.
			this.updateParTotal()
				.updateStats(0);
		}
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Models.Scorecard model defines the fields in a scorecard for a round of golf.
	 * @example
	 * let scorecardModel = new gsc2app.Models.Scorecard();
	 * @class {function} gsc2app.Models.Scorecard
	 */
	gsc2app.Models.Scorecard = Backbone.Model.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Models.Scorecard", 'nodetype':"class", 'group':"gsc2app.Models", 'datatype':"node"}
		// Set the default values for a new instance of this model type.
		/**
		 * @property {object} gsc2app.Models.Scorecard.defaults - The default values for
		 * the attributes in a gsc2app.Models.Scorecard object.
		 * 
		 * @property {string} gsc2app.Models.Scorecard.defaults.scorecard_id - The generated
		 * ID string assigned to this scorecard for this round of golf.
		 * 
		 * @property {gsc2app.Models.Course} gsc2app.Models.Scorecard.defaults.course - Will
		 * be set to a gsc2app.Models.Course for the current course.
		 * @see {@link gsc2app.Models.Course}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Course", 'tonodename':"gsc2app.Models.Scorecard", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {gsc2app.Collections.StringFields} gsc2app.Models.Scorecard.hole_numbers -
		 * Will be set to a gsc2app.Collections.StringFields object to store the hole numbers
		 * as strings.
		 * @see {@link gsc2app.Collections.StringFields}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Collections.StringFields", 'tonodename':"gsc2app.Models.Scorecard", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {gsc2app.Collections.NumberFields} gsc2app.Models.Scorecard.hole_pars -
		 * Will be set to a gsc2app.Collections.NumberFields object to store the hole pars as
		 * numbers.
		 * @see {@link gsc2app.Collections.NumberFields}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Collections.NumberFields", 'tonodename':"gsc2app.Models.Scorecard", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {gsc2app.Models.NumberField} gsc2app.Models.Scorecard.defaults.holes_par_total -
		 * Will be set to a gsc2app.Models.NumberField object for the total par score.
		 * @see {@link gsc2app.Models.NumberField}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.NumberField", 'tonodename':"gsc2app.Models.Scorecard", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {gsc2app.Collections.Players} gsc2app.Models.Scorecard.defaults.players -
		 * Will be set to a gsc2app.Collections.Players instance.
		 * @see {@link gsc2app.Collections.Players}
		 * @@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Collections.Players", 'tonodename':"gsc2app.Models.Scorecard", 'datatype':"edge", 'edgetype':"normal"}
		 * 
		 * @property {string} gsc2app.Models.Scorecard.notes - Notes entered into the scorecard
		 * about the round.
		 */
		defaults: {
			'scorecard_id': '',
			'course': {},
			'hole_numbers': {},
			'hole_pars': {},
			'holes_par_total': {},
			'players': {},
			'notes': ''
		},
		url: '',	// Not needed because a custom server access protocol will be used.

		/**
		 * Create a new scorecard given userspace ID and a course model.
		 * @example
		 * let courseModel = new gsc2app.Models.Course();
		 * // Set up courseModel parameters here to define the course.
		 * scorecardModel.createScorecard("b32307a1", courseModel);
		 * @member {function} gsc2app.Models.Scorecard.createScorecard
	 	 * @param {string} userspaceID - The userspace ID for the new scorecard.
		 * @param {gsc2app.Models.Course} courseModel - A gsc2app.Models.Course object that
		 * contains the definition of the course to use for the new scorecard.
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 * @see {@link gsc2app.Models.Course}
		 */
		createScorecard: function(userspaceID, courseModel) {
			this.set('scorecard_id', gsc2app.Models.newScorecardID(userspaceID));
			this.set('course', courseModel);

			let numHoles = courseModel.getCourseNumHoles();
			let holeNumbers = courseModel.getCourseHoleNumbers();
			let holePars = courseModel.getCourseHolePars();
			if (numHoles && holeNumbers && holePars &&
				numHoles === holeNumbers.length && numHoles === holePars.length)
			{
				let holeNumberCollection = new gsc2app.Collections.StringFields();
				let holeParCollection = new gsc2app.Collections.NumberFields();
				let holeCollection = new gsc2app.Collections.NumberFields();
				// Set the hole name and par value for each hole.
				let parSum = 0;
				for (let n = 0; n < numHoles; n++) {
					// Build up a collection of hole numbers that is suitable for the a BackboneJS view.
					let thisHoleNumberModel = new gsc2app.Models.StringField();
					let thisHoleNumber = holeNumbers[n];
					if (thisHoleNumber === '') {
						// If no hole number was defined, just use the current hole number.
						thisHoleNumber = `${ n+1 }`;
					}
					thisHoleNumberModel.setValue(thisHoleNumber);
					holeNumberCollection.add(thisHoleNumberModel);

					// Build up a collection of par numbers.
					let thisHoleParModel = new gsc2app.Models.NumberField();
					let thisHolePar = holePars[n];
					thisHoleParModel
						.setValue(thisHolePar)
						.disableQualifiers()
						.disableScoreRanking()
						.setNumericOnly();
					holeParCollection.add(thisHoleParModel);
				}
				this.set('hole_numbers', holeNumberCollection);
				this.set('hole_pars', holeParCollection);

				// Create the total par sum.
				let totalHole = new gsc2app.Models.NumberField();
				totalHole
					.setValue(parSum)	// The total par value based on the original pars.
					.disableQualifiers()
					.disableScoreRanking()
					.setNumericOnly();
				gsc2app.Utilities.eventDispatcher.on(
					'gsc2event:updateModelTotalScore',
					gsc2app.Models.updateModelTotalScoreHandler, this);
				this.set('holes_par_total', totalHole);

				// Create a player object and allocate the scores for the first as-of-yet-unnamed player.
				let playerCollection = new gsc2app.Collections.Players();
				this.set('players', playerCollection);
				this.addNewPlayer();
			} else {
				gsc2app.Utilities.errorMsg(`Course definition is inconsistent: The number of holes (${ holeNumbers.length }) and the list of hole pars (${ holePars.length}) is not consistent.`);
			}
			return this;
		},

		/**
		 * Return the number of holes for this scorecard.
		 * @example
		 * let numHoles = scorecardModel.getNumHoles();
		 * // Returns, for example, 18.
		 * @member {function} gsc2app.Models.Scorecard.getNumHoles
		 * @returns {number} Returns the number of holes for this scorecard.
		 */
		getNumHoles: function() {
			return this.get('hole_pars').length;
		},

		/**
		 * Add a new player to the current scorecard.
		 * @example
		 * scorecardModel.addNewPlayer();
		 * // Adds a new player with no name specified.
		 * @example
		 * scorecardModel.addNewPlayer("Susan");
		 * // Adds a new player named "Susan".
		 * @member {function} gsc2app.Models.Scorecard.addNewPlayer
	 	 * @param {string} [playerName=""] - The optional player name for the new player that
		 * will be added to the current scorecard.
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 */
		addNewPlayer: function(playerName = '') {
			let courseModel = this.get('course');
			let holeNumbers = courseModel.getCourseHoleNumbers();

			let playerCollection = this.get('players');
			let newPlayer = new gsc2app.Models.Player();
			newPlayer.allocateHoles(holeNumbers.length);
			if (playerName !== '') {
				newPlayer.setPlayerName(playerName);
			}
			newPlayer.setPlayerNumber(playerCollection.length + 1);
			playerCollection.push(newPlayer);
			this.set('players', playerCollection);
			return this;
		},

		/**
		 * Remove the last player that was added to the current scorecard.  Does nothing if there
		 * is only one player on the current scorecard.
		 * @example
		 * scorecardModel.removeLastPlayer();
		 * @member {function} gsc2app.Models.Scorecard.removeLastPlayer
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 */
		removeLastPlayer: function() {
			let playerCollection = this.get('players');
			if (playerCollection.length > 1) {
				let playerRemovedModel = playerCollection.pop();
				this.set('players', playerCollection);
			}
			return this;
		},

		/**
		 * Get the current scorecard's ID string.
		 * @example
		 * let scorecardID = scorecardModel.getScorecardID();
		 * @member {function} gsc2app.Models.Scorecard.getScorecardID
		 * @returns {string} Returns the scorecard ID.
		 */
		getScorecardID: function() {
			return this.get('scorecard_id');
		},
		
		/**
		 * Get the current scorecard's course model.
		 * @example
		 * let courseModel = scorecardModel.getCourseModel();
		 * @member {function} gsc2app.Models.Scorecard.getCourseModel
		 * @returns {gsc2app.Models.Course} Returns a gsc2app.Models.Course object for this scorecard.
		 * @see {@link gsc2app.Models.Course}
		 */
		getCourseModel: function() {
			return this.get('course');
		},
		
		/**
		 * Get the current scorecard's collection of hole numbers, which are the numbers/names/identifiers
		 * for each hole.
		 * @example
		 * let holeNumbersCollection = scorecardModel.getHoleNumbersCollection();
		 * @member {function} gsc2app.Models.Scorecard.getHoleNumbersCollection
		 * @returns {gsc2app.Collections.StringFields} Returns a gsc2app.Collections.StringFields
		 * object for this scorecard with the hole numbers.
		 * @see {@link gsc2app.Collections.StringFields}
		 */
		getHoleNumbersCollection: function() {
			return this.get('hole_numbers');
		},

		/**
		 * Get the current scorecard's collection of hole pars.
		 * @example
		 * let holeParsCollection = scorecardModel.getHoleParsCollection();
		 * @member {function} gsc2app.Models.Scorecard.getHoleParsCollection
		 * @returns {gsc2app.Collections.NumberFields} Returns a gsc2app.Collections.NumberFields
		 * object for this scorecard with the hole pars.
		 * @see {@link gsc2app.Collections.NumberFields}
		 */
		getHoleParsCollection: function() {
			return this.get('hole_pars');
		},

		/**
		 * Get the par value for the specified 1-based hole number.  Returns zero if
		 * no such hole exists.
		 * @example
		 * let parValue = scorecardModel.getParForHole(12);
		 * // Returns the par value, say, 3, for hole number 12.
		 * @member {function} gsc2app.Models.Scorecard.getParForHole
		 * @returns {number} Returns the par value for the requested hole.
		 */
		getParForHole: function(n) {
			if (n > 0) {
				// Make sure the requested hole is 1-based.
				let holeParCollection = this.getHoleParsCollection();
				if (holeParCollection && n <= holeParCollection.length) {
					let holeParModel = holeParCollection.at(n - 1);
					if (holeParModel) {
						let parValue = holeParModel.getValue();
						return parValue;
					}
				}
			}
			return 0;
		},

		/**
		 * Get the field for the total par score for the scorecard.
		 * @example
		 * let parTotal = scorecardModel.getHolesParTotal();
		 * @member {function} gsc2app.Models.Scorecard.getHolesParTotal
		 * @returns {gsc2app.Models.NumberField} Returns a gsc2app.Models.NumberField object
		 * for par total for this scorecard.
		 * @see {@link gsc2app.Models.NumberField}
		 */
		getHolesParTotal: function() {
			return this.get('holes_par_total');
		},

		/**
		 * Update total par for the course.  This function should be called when the user
		 * edits a par value for a hole.
		 * @example
		 * // Usually called from within an event handler, in which case the this object
		 * // is an instance of gsc2app.Models.Scorecard.
		 * this.updateParTotal();
		 * @member {function} gsc2app.Models.Scorecard.updateParTotal
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 * @see {@link gsc2app.Models.updateModelTotalScoreHandler}
		 */
		updateParTotal: function() {
			let holeParCollection = this.getHoleParsCollection();
			if (holeParCollection && holeParCollection.length > 0) {
				let parSum = 0;
				for (let n = 0; n < holeParCollection.length; n++) {
					parSum += holeParCollection.at(n).getValue();
				}
				let holesTotal = this.getHolesParTotal();
				holesTotal.setValue(parSum);
				this.set('holes_par_total', holesTotal);
			}
			return this;
		},

		/**
		 * Update the total score for a specified player number, which should be 1-based.  This
		 * function should be called when the user updates the score within a hole.
		 * @example
		 * // Update the total score for player #2.
		 * scorecardModel.updateScoreTotal(2);
		 * @param {number} playerNumber - The 1-based player number whose total score should be updated.
		 * @member {function} gsc2app.Models.Scorecard.updateScoreTotal
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 * @see {@link gsc2app.Models.updateModelTotalScoreHandler}
		 */
		updateScoreTotal: function(playerNumber) {
			let playerCollection = this.get('players');
			if (playerCollection && playerNumber >= 1 && playerNumber <= playerCollection.length) {
				let thisPlayer = playerCollection.at(playerNumber - 1);
				thisPlayer.updateScoreTotal();
			}
			return this;
		},

		/**
		 * Update the statistics for a specified player number, which should be 1-based.  This
		 * function should be called when the user updates the score within a hole.  If the user
		 * updates the par for a hole, the statistics for all players need to be recalculated,
		 * so pass in the number 0 for the player number to recalculate the statistics for all
		 * players.  Also updates the rank levels for the holes.
		 * @example
		 * // Update the statistics for player #2.
		 * scorecardModel.updateStats(2);
		 * @param {number} playerNumber - The 1-based player number whose total score should be updated.
		 * If 0, then recalculate the statistics for all players.
		 * @member {function} gsc2app.Models.Scorecard.updateStats
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 * @see {@link gsc2app.Models.updateModelTotalScoreHandler}
		 * @see {@link gsc2app.Models.Player.updateStats}
		 */
		updateStats: function(playerNumber) {
			let playerCollection = this.get('players');
			if (playerCollection) {
				let holeParCollection = this.getHoleParsCollection();
				if (holeParCollection) {
					if (playerNumber >= 1 && playerNumber <= playerCollection.length) {
						// Update the statistics for one player.
						let thisPlayer = playerCollection.at(playerNumber - 1);
						thisPlayer.updateStats(holeParCollection);
					} else if (playerNumber === 0) {
						// Update the statistics for all players.
						for (let n = 0; n < playerCollection.length; n++) {
							let thisPlayer = playerCollection.at(n);
							thisPlayer.updateStats(holeParCollection);
						}
					}
				}
			}
			return this;
		},

		/**
		 * Get the collection of players on the scorecard.
		 * @example
		 * let playerCollection = scorecardModel.getPlayersCollection();
		 * @member {function} gsc2app.Models.Scorecard.getPlayersCollection
		 * @returns {gsc2app.Collections.Players} Returns a gsc2app.Collections.Players object
		 * containing the information for all players on this scorecard.
		 * @see {@link gsc2app.Collections.Players}
		 */
		getPlayersCollection: function() {
			return this.get('players');
		},

		/**
		 * Return the number players that are defined for the scorecard.
		 * @example
		 * let numPlayers = scorecardModel.getNumPlayers();
		 * @member {function} gsc2app.Models.Scorecard.getNumPlayers
		 * @returns {number} Returns the number of players currently defined.
		 * @see {@link gsc2app.Models.Scorecard.getPlayersCollection}
		 */
		getNumPlayers: function() {
			let playerCollection = this.get('players');
			if (playerCollection) {
				return playerCollection.length;
			}
			return 0;
		},

		/**
		 * Get a particular player's model from the scorecard.  The player is specified by its
		 * 1-based index, so 1 is player #1, 2 is player #2, etc.
		 * @example
		 * let playerModel = scorecardModel.getPlayerModel(2);
		 * // Returns the player model for player #2.
		 * @member {function} gsc2app.Models.Scorecard.getPlayerModel
		 * @param {number} n - The 1-based player number for the player on the scorecard.
		 * @returns {gsc2app.Models.Player} Returns a gsc2app.Models.Player object containing
		 * the information for the specified player on this scorecard.
		 * @see {@link gsc2app.Models.Player}
		 */
		getPlayerModel: function(n) {
			// Returns the gsc2app.Models.Player instance at 0-based index in the players collection.
			let playerCollection = this.get('players');
			if (n > 0 && n <= playerCollection.length) {
				let playerModel = playerCollection.at(n - 1);
				return playerModel;
			}
			return null;
		},

		/**
		 * Get the notes for the scorecard.
		 * @example
		 * let scorecardNotes = scorecardModel.getNotes();
		 * @member {function} gsc2app.Models.Scorecard.getNotes
		 * @returns {string} Returns the notes for this scorecard.
		 * @see {@link setNotes}
		 */
		getNotes: function() {
			return this.get('notes');
		},

		/**
		 * Set the notes for the scorecard.
		 * @example
		 * scorecardModel.setNotes("The water hazard on hole #8 was hard to avoid.");
		 * @member {function} gsc2app.Models.Scorecard.setNotes
		 * @param {string} s - The notes string to set for this scorecard.
		 * @returns {gsc2app.Models.Scorecard} Returns this.
		 * @see {@link getNotes}
		 */
		setNotes: function(s) {
			this.set('notes', s);
			return this;
		}
	});

})();
