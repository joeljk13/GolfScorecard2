 /**
 * @file JavaScript module for the GolfScorecard2 web application.  This file contains
 * the JavaScript router for client-side control of the logical "pages" of the golf
 * scorecard application.
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
 * @requires 5-collections.js
 * @requires 6-controllers.js
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
	 * Namespace object for the routing-related functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Routes = gsc2app.Routes || {};

	// Some basic but useful guidance on the Backbone router is available at:
	//		http://mrbool.com/backbone-js-router/28001

	// For the Golf Scorecard version 2 application, here are the main routes, by example,
	// as defined for the HTML URL:
	//
	//		Start page for the application.  This is where the user space identifier is
	//		entered in.
	//			''
	//			'#start'
	//
	//		After the userspace identifier, the flow brings the user to the home page.
	//		If the userspace identifier was "demo", the userspace hash ID would be "15ee1cfb".
	//			'#home/15ee1cfb'
	//
	//		If a logical page is bookmarked, ask the user to confirm the userspace name
	//		to make sure it matches the userspace ID that is part of the URL.
	//			'#confirm/15ee1cfb'
	//
	//		On the home page, the user can start the workflow for creating a new scorecard,
	//		which involves first selecting the desired course.
	//			'#select-course/15ee1cfb'
	//
	//		When the desired course is selected, a new course is created and displayed.
	//		Suppose the course that was selected had the course ID '03709882-f4a3-44dc-b0ba-f5f5aa73aec0'.
	//			'#new-scorecard/15ee1cfb/03709882-f4a3-44dc-b0ba-f5f5aa73aec0'
	//
	//		Also, when on the home page, the user can manage their existing scorecards.
	//			'#manage-scorecards/15ee1cfb'
	//
	//		The user can select an existing scorecard and open it. Supposed the selected
	// 		scorecard has the IT ABC123.
	//			'#open-scorecard/15ee1cfb/ABC123'
	//
	//		Also on the home page, the user can manage their course list.
	//			'#manage-courses/15ee1cfb'
	//
	/**
	 * The gsc2app.Routes.MainAppRouter class provides the routing functionality so that
	 * the different views that the user can navigate to are translated as URL changes that
	 * may be bookmarked and saved in the browser history.  The definition of the routing
	 * keywords is in the 'routes' member of the class.
	 * @example
	 * let router = new gsc2app.Routes.MainAppRouter();
	 * @class {function} gsc2app.Routes.MainAppRouter
	 */
	gsc2app.Routes.MainAppRouter = Backbone.Router.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Routes.MainAppRouter", 'nodetype':"class", 'group':"gsc2app.Routes", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Routes.MainAppRouter.routes - Set of relative URL routes and the corresponding functions for nagivating to them.
		 */
		routes: {
			'':			'gotoStartPage',	// Initial startup route, along with some synonyms
			'start':	'gotoStartPage',	// '#start'
			'restart':	'gotoStartPage',	// '#restart'

			// Note: All "pages" referenced below are logical pages and not physical pages.

			// Confirmation page for the user to enter in the userspace name to make sure it
			// matches the userspace ID.  Expects the destination URL to be saved in ??? so
			// that it can be navigated to if the userspace ID does match.
			// Example: '#confirm/15ee1cfb'
			'confirm/:userspaceID/:targetPage': 'gotoConfirmPage',

			// Home page for the user with the given userspace hash ID.
			// Example:	'#home/15ee1cfb'
			'home/:userspaceID': 'gotoHomePage',

			// Course selection page for the user with the given userspace hash ID.
			// Example:	'#select-course/15ee1cfb'
			'select-course/:userspaceID': 'gotoSelectCoursePage',

			// Create a new scorecard given the userspace hash ID and the course ID.
			// Example:	'#new-scorecard/15ee1cfb/03709882-f4a3-44dc-b0ba-f5f5aa73aec0'
			'new-scorecard/:userspaceID/:courseID': 'gotoNewScorecardPage',

			// Go to the page for managing existing scorecards, given the userspace hash ID.
			// Example:	'#manage-scorecards/15ee1cfb'
			'manage-scorecards/:userspaceID': 'niy1',

			// Open an existing scorecard, given the userspace hash ID and the scorecard ID.
			// Example:	'#open-scorecard/15ee1cfb/ABC123'
			'open-scorecard/:userspaceID/scorecardID': 'niy3',

			// Go to the page for managing the list of courses for the given userspace hash ID.
			// Example:	'#manage-courses/15ee1cfb'
			'manage-courses/:userspaceID': 'niy1',

			'*path':	'gotoStartPage'		// Default route, start from the beginning.
		},

		/**
		 * Check to see if the specified userspaceID matches the current userspace ID.
		 * Returns true if so.  If it does not match, it navigates to the confirmation
		 * page, and if the userspace ID gets confirmed, that will trigger the navigation
		 * to the navigateTargetPage, which should be a route name in the table above.
		 * In this case, the function returns false.
		 * @example
		 * router.validateUserspaceID("demospace", "home/b32307a1");
		 * // Returns true since the hashcode of "demospace" is "b32307a1".
		 * @param {string} userspaceID - The userspace ID specified in the URL.
		 * @param {string} navigateTargetPage - The relative URL to navigate to if the
		 * userspace ID does not match the currently active userspace ID.
		 * @member {function} gsc2app.Routes.MainAppRouter.validateUserspaceID
		 * @returns {boolean} Returns true if it is okay to navigate to the requested
		 * virtual page, false if the user needs to confirm their userspace name.
		 */
		validateUserspaceID: function(userspaceID, navigateTargetPage) {
			if (userspaceID && userspaceID === gsc2app.State.userspaceID) {
				// Okay, do the default operation.
				return true;
			}
			// Otherwise, navigate to the confirmation page.
			gsc2app.Controllers.appNavigate(`confirm/${userspaceID}/${navigateTargetPage}`, '', false);
			return false;
		},

		/**
		 * Navigate to the Start page where a user can enter in their userspace name.
		 * @example
		 * router.gotoStartPage();
		 * @member {function} gsc2app.Routes.MainAppRouter.gotoStartPage
		 */
		gotoStartPage: function() {
			gsc2app.Controllers.navigateToStartPage();
		},

		/**
		 * Navigate to the Confirm page where a user can re-enter their userspace name so its
		 * corresponding userspace ID may be compared with the currnently active userspace ID.
		 * @example
		 * router.gotoConfirmPage("a80de0f0", "select-course/b32307a1");
		 * // The userspace ID "a80de0f0" does not match the userspace ID "b32307a1" in the
		 * // relative URL, so the function prompts the user to enter in the userspace name
		 * // that corresponds to "b32307a1".  If the user does this, the function navigates
		 * // to the "select-course/b32307a1" URL.  If not, the user is directed to the
		 * // Start page.
		 * @param {string} targetUserspaceID - The currently active userspace ID.
		 * @param {string} targetPage - The relative URL to navigate to if the userspace ID is confirmed by the user.
		 * @member {function} gsc2app.Routes.MainAppRouter.gotoConfirmPage
		 */
		gotoConfirmPage: function(targetUserspaceID, targetPage) {
			gsc2app.Controllers.navigateToConfirmPage(targetUserspaceID, targetPage);
		},

		/**
		 * Navigate to the Home page which is the main page after the user has entered in
		 * their userspace name.
		 * @example
		 * router.gotoHomePage("b32307a1");
		 * // Navigates to the Home page if the userspace ID "b32307a1" matches the currently
		 * // active userspace ID.  Otherwise, it navigates to the Confirm page.
		 * @param {string} userspaceID - The claimed userspace ID.
		 * @member {function} gsc2app.Routes.MainAppRouter.gotoHomePage
		 */
		gotoHomePage: function(userspaceID) {
			if (this.validateUserspaceID(userspaceID, 'home')) {
				gsc2app.Controllers.navigateToHomePage(userspaceID);
			}
		},

		/**
		 * Navigate to the Select-Course page on which the user may select the desired golf
		 * course for a new scorecard.
		 * @example
		 * router.gotoSelectCoursePage("b32307a1");
		 * // Navigates to the Select-Course page if the userspace ID "b32307a1" matches the
		 * // currently active userspace ID.  Otherwise, it navigates to the Confirm page.
		 * @param {string} userspaceID - The claimed userspace ID.
		 * @member {function} gsc2app.Routes.MainAppRouter.gotoSelectCoursePage
		 */
		gotoSelectCoursePage: function(userspaceID) {
			if (this.validateUserspaceID(userspaceID, 'select-course')) {
				gsc2app.Controllers.navigateToSelectCoursePage(userspaceID);
			}
		},

		/**
		 * Navigate to the New-Scorecard page for the course previously selected by the user.
		 * This causes a new scorecard to be created.
		 * @example
		 * router.gotoNewScorecardPage("b32307a1", "03709882-f4a3-44dc-b0ba-f5f5aa73aec0");
		 * // Navigates to the Select-Course page if the userspace ID "b32307a1" matches the
		 * // currently active userspace ID.  Otherwise, it navigates to the Confirm page.
		 * // The new scorecard will be based on the course specified by the course ID
		 * // "03709882-f4a3-44dc-b0ba-f5f5aa73aec0".
		 * @param {string} userspaceID - The claimed userspace ID.
		 * @param {string} courseID - The course ID for the course to use in the new scorecard.
		 * @member {function} gsc2app.Routes.MainAppRouter.gotoNewScorecardPage
		 */
		gotoNewScorecardPage: function(userspaceID, courseID) {
			if (this.validateUserspaceID(userspaceID, 'new-scorecard')) {
				gsc2app.Controllers.navigateToNewScorecardPage(userspaceID, courseID);
			}
		},

		niy1: function(userspaceID) {
			alert(`Sorry, not implemented yet for userspace ID ${userspaceID}.`);
		},

		niy2: function(userspaceID, courseID) {
			alert(`Sorry, not implemented yet for userspace ID ${userspaceID} and course ID ${courseID}.`);
		},

		niy3: function(userspaceID, scorecardID) {
			alert(`Sorry, not implemented yet for userspace ID ${userspaceID} and scorecard ID ${scorecardID}.`);
		}
	});

	// Create a new instance of the application router and start it up.
	/**
	 * Master application routing object.
	 * @type {gsc2app.Routes.MainAppRouter}
	 */
	gsc2app.Routes.appRouter = new gsc2app.Routes.MainAppRouter();
	Backbone.history.start();
	// This will also start the main app because it recognizes the nagivation
	// to the empty relative path ''.

})();
