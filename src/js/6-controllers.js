 /**
 * @file JavaScript module for the GolfScorecard2 web application.  This file contains
 * the JavaScript controllers for the BackboneJS models, views, and collections for
 * the golf scorecard application.
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
	 * Namespace object for the controller-related functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Controllers = gsc2app.Controllers || {};

	/**
	 * Namespace object for storing stateful working variables.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.State = gsc2app.State || {};
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Forward declaration for the application router so there can be a utility function
	// defined here that facilities backbone navigation.
	/**
	 * Namespace object for the routing-related functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Routes = gsc2app.Routes || {};
	gsc2app.Routes.appRouter = {};	// This object will be replaced by a real backbone router later on.
	gsc2app.Routes.appRouter.navigate = function(fragment, options = null) {};

	/**
	 * Format a backbone route and then navigate to it.  Automatically adds in the userspace
	 * ID by default.  Automatically prepends '#' to the route fragment.
	 * @example
	 * gsc2app.Controllers.appNavigate('start', '', false);
	 * // Navigates to "#start".
	 * @example
	 * gsc2app.Controllers.appNavigate('select-course');
	 * // Navigates to "#select-course/15ee1cfb".  Assumes the current userspace ID is "15ee1cfb".
	 * @example
	 * gsc2app.Controllers.appNavigate('new-scorecard', '03709882-f4a3-44dc-b0ba-f5f5aa73aec0');
	 * // Navigates to "#new-scorecard/15ee1cfb/03709882-f4a3-44dc-b0ba-f5f5aa73aec0".
	 * // Assumes the current userspace ID is "15ee1cfb".
	 * @param {string} userspaceID - The userspace ID to use for the New-Scorecard page.
	 * @param {string} courseID - The ID of the course to use to create the new scorecard.
	 * @param {boolean} [adduserspaceid=true] - If true, then add current userspace ID to the
	 * URL fragment. Otherwise, don't add it in.
	 */
	gsc2app.Controllers.appNavigate = function(fragment, secondID = '', adduserspaceid = true) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.appNavigate", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		if (fragment) {
			let urlFragment = '#' + fragment;
			if (adduserspaceid) {
				if (gsc2app.State.userspaceID && gsc2app.State.userspaceID !== '') {
					urlFragment += '/' + gsc2app.State.userspaceID;
				}
			}
			if (secondID && secondID !== '') {
				urlFragment += '/' + secondID;
			}
			gsc2app.Routes.appRouter.navigate(urlFragment, {trigger: true});
		}
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Set the given userspace ID as the currently active one, if it isn't already active.
	 * @example
	 * gsc2app.Controllers.setOrUpdateUserspaceID("b32307a1");
	 * // Sets the given userspace ID to be the currently active one.
	 * @example
	 * gsc2app.Controllers.setOrUpdateUserspaceID("b32307a1", "demospace");
	 * // Sets both the given userspace ID and the corresponding userspace name as the currently active values.
	 * @param {string} userspaceID - The userspace ID to set as the active userspace ID.
	 * @param {string} [userspaceName] - The userspace name that corresponds to the userspace ID.  Mainly used for reference purposes.  Ignored if it is an empty string.
	 */
	gsc2app.Controllers.setOrUpdateUserspaceID = function(userspaceID, userspaceName = '') {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.setOrUpdateUserspaceID", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		if (userspaceID && userspaceID !== gsc2app.State.userspaceID) {
			// The userspace ID has been changed or overridden.
			gsc2app.Utilities.logMsg(`Userspace ID set to ${userspaceID}`);
			gsc2app.State.userspaceID = userspaceID;
			if (userspaceName !== '') {
				gsc2app.State.userspaceName = userspaceName;
			}
		}
	};

	/**
	 * If the given username ID does not match the currently active userspace ID, this function
	 * prompts the user to enter in the userspace name that should correspond to the userspace ID.
	 * @example
	 * let sameID = gsc2app.Controllers.confirmUserspaceID("b32307a1");
	 * @param {string} userspaceID - The userspace ID to confirm.
	 * @returns {boolean} Returns true if the user confirms the userspace ID, false if not.
	 */
	gsc2app.Controllers.confirmUserspaceID = function(userspaceID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.confirmUserspaceID", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Returns true if the userspace ID was confirmed, false if not.
		if (userspaceID && userspaceID !== gsc2app.State.userspaceID) {
			let userspaceName = gsc2app.Utilities.promptUser('Enter username for confirmation:');
			if (userspaceName === null) {
				// The user canceled the confirmation.
				return false;
			}
			let newID = gsc2app.Utilities.calcHashCode(userspaceName);
			if (newID === userspaceID) {
				// Confirmed!
				return true;
			}
			// Here, the entered userspace name does not correspond to the userspace ID,
			// so alert the user.
			gsc2app.Utilities.infoMsg(`Userspace name does not match the userspace ID "${userspaceID}".`);
			return false;
		} else {
			return true;
		}
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Hide the major containers in the primary HTML table.  Allows a container to be prepared with
	 * visual controls before it is actually made visible.
	 * @example
	 * gsc2app.Controllers.hideAll();
	 */
	gsc2app.Controllers.hideAll = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.hideAll", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Function to hide all of the major rows in the main display table.
		// Don't hide the title container, though, in $('#title-container').
		$('#pageheaderrow-container').hide();
		$('#userspacerow-container').hide();
		$('#commandrow-container').hide();
		$('#courseselectorrow-container').hide();
		$('#scorecardmgmtrow-container').hide();
		$('#coursemgmtrow-container').hide();
		$('#scorecard-container').hide();
	};

	/**
	 * Hide the major containers in the primary HTML table.  Allows a container to be prepared with
	 * visual controls before it is actually made visible.
	 * @example
	 * gsc2app.Controllers.showContainer("commandrow-container");
	 * // Makes the HTML tag with the ID attribute "commandrow-container" visible.
	 * @param {string} containerID - The ID attribute of the HTML tag to show.
	 */
	gsc2app.Controllers.showContainer = function(containerID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.showContainer", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Displays the HTML element with the given container ID, which should not have the
		// leading '#' character.
		let element = '#' + containerID;
		if ($(element).is(":hidden")) {
			gsc2app.Controllers.hideAll();
			$(element).show();
		}
	};

	/**
	 * Set the page header text.  Show Home and Restart links if specified.
	 * @example
	 * gsc2app.Controllers.showPageHeader("Confirm");
	 * // Sets the page header text to be "Confirm".
	 * @example
	 * gsc2app.Controllers.showPageHeader("Home", false, true);
	 * // Sets the page header text to be "Home".  Shows the Restart link but not the Home link.
	 * @example
	 * gsc2app.Controllers.showPageHeader("Active Scorecard", true, true);
	 * // Sets the page header text to be "Active Scorecard".  Shows the Home and Restart links.
	 * @param {string} pageHeaderText - The text to show in the page header area.
	 * @param {boolean} [showHomeButton=false] - If true, show the Home link. Useful after the user selects an operation from the Home page.
	 * @param {boolean} [showStartButton=false] - If true, show the Restart link. Useful after the user gets to the Home page or beyond.
	 */
	gsc2app.Controllers.showPageHeader = function(pageHeaderText, showHomeButton = false, showStartButton = false) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.showPageHeader", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Function set to the page header and display it.  If the show*Button arguments are true,
		// they will be shown in the main navigation area in the page header.
		gsc2app.State.pageHeaderViewInstance = new gsc2app.Views.PageHeader({
			page_header_text: pageHeaderText,
			show_home_button: showHomeButton,
			show_start_button: showStartButton
		});
		$('#pageheaderrow-container').show();
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create a new scorecard based on the course that was selected given its course ID
	 * (typically a GUID).
	 * @example
	 * gsc2app.Controllers.createNewScorecardForCourse("03709882-f4a3-44dc-b0ba-f5f5aa73aec0");
	 * @param {string} courseID - The ID of the course to use to create the new scorecard.
	 */
	gsc2app.Controllers.createNewScorecardForCourse = function(courseID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.createNewScorecardForCourse", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// First, determine the course index from the course ID.
		let index = gsc2app.State.coursesCollectionInstance.getIndexFromCourseID(courseID);
		if (index < 0) {
			gsc2app.Utilities.errorMsg('No course selected');
			return;
		}
		if (index >= gsc2app.State.coursesCollectionInstance.length) {
			// Should never happen.
			gsc2app.Utilities.errorMsg('Invalid course selection');
			return;
		}
		// Save the course index and ID for reference.
		gsc2app.State.selectedCourseIndex = index;
		gsc2app.State.selectedCourseID = courseID;

		// First create the scorecard from the scorecard model.
		let activeCourseModel = gsc2app.State.coursesCollectionInstance.at(gsc2app.State.selectedCourseIndex);
		gsc2app.State.activeScorecard = new gsc2app.Models.Scorecard();
		let userspaceID = gsc2app.State.userSpaceModelInstance.getHashCode();
		gsc2app.State.activeScorecard.createScorecard(userspaceID, activeCourseModel);

		// Create the view for showing the active course information.
		gsc2app.State.scorecardCourseViewInstance = new gsc2app.Views.ScorecardCourse({model: activeCourseModel});

		// Create the view for the scorecard data.
		gsc2app.State.scorecardDataViewInstance = new gsc2app.Views.ScorecardData({model: gsc2app.State.activeScorecard});

		// Create the view for the scorecard statistics.
		gsc2app.State.scorecardStatsViewInstance = new gsc2app.Views.ScorecardStats({model: gsc2app.State.activeScorecard});
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Navigate to the Manage My Scorecards page which is where the user can view or reload existing scorecards
	 * associated with their userspace ID.
	 * @example
	 * gsc2app.Controllers.cmdManageMyScorecards();
	 */
	gsc2app.Controllers.cmdManageMyScorecards = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.cmdManageMyScorecards", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		$('#commandrow-container').hide();
		$('#scorecardmgmtrow-container').show();
		//JK// HERE I AM
		gsc2app.Controllers.appNavigate('manage-scorecards');
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Navigate to the Manage My Courses page which is where the user can view, add, or remove courses
	 * from their userspace ID.
	 * @example
	 * gsc2app.Controllers.cmdManageMyCourses();
	 */
	gsc2app.Controllers.cmdManageMyCourses = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.cmdManageMyCourses", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		$('#commandrow-container').hide();
		$('#coursemgmtrow-container').show();
		//JK// HERE I AM
		gsc2app.Controllers.appNavigate('manage-courses');
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// ***** Backbone Navigation Functions *****

	/**
	 * Navigate to the Start page which is where the user can enter in their userspace name.
	 * This is the first page of the workflow.  This function invokes the Backbone router function.
	 * @example
	 * gsc2app.Controllers.navigateToStartPage();
	 */
	gsc2app.Controllers.navigateToStartPage = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.navigateToStartPage", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Business logic for id="userspacerow-container".
		gsc2app.State.userSpaceModelInstance = new gsc2app.Models.UserSpace();
		gsc2app.State.userSpaceViewInstance = new gsc2app.Views.UserSpace({model: gsc2app.State.userSpaceModelInstance});

		// Then show this container area.
		gsc2app.Controllers.showContainer('userspacerow-container');
		gsc2app.Controllers.showPageHeader('Start');
	};

	/**
	 * Navigate to the Confirm page which is where the user can enter in their userspace name so
	 * it can be compared to the currently active userspace ID.  This function invokes the
	 * Backbone router function.  If the userspace ID is not confirmed, the function navigates
	 * to the Start page so the user can start over.
	 * @example
	 * gsc2app.Controllers.navigateToConfirmPage("b32307a1", "select-course/b32307a1");
	 * // Causes the app to navigate to the "select-course/b32307a1" if the user enters in the
	 * // userspace name that corresponds to userspace ID "b32307a1".
	 * @param {string} targetUserspaceID - The userspace ID to be confirmed.  This should be the
	 * currently active userspace ID.
	 * @param {string} targetPage - Backbone router string representing the page to navigate to
	 * if the hash code of userspace name entered by the user matches the targetUserspaceID.
	 */
	gsc2app.Controllers.navigateToConfirmPage = function(targetUserspaceID, targetPage) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.navigateToConfirmPage", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Business logic for id="userspacerow-container".
		gsc2app.State.userSpaceModelInstance = new gsc2app.Models.UserSpace();
		gsc2app.State.userSpaceViewInstance = new gsc2app.Views.ConfirmUserspace({
			model: gsc2app.State.userSpaceModelInstance,
			target_userspaceID: targetUserspaceID,
			target_navigatePage: targetPage
		});

		// Then show this container area.
		gsc2app.Controllers.showContainer('userspacerow-container');
		gsc2app.Controllers.showPageHeader('Confirm Userspace', false, true);
	};

	/**
	 * Navigate to the Home page which is where the user can manage their scorecards and create
	 * a new scorecard.  This function invokes the Backbone router function.  If the specified
	 * userspace ID does not match the currently active userspace ID, the user will be asked to
	 * confirm their userspace name before the Home page is shown.
	 * @example
	 * gsc2app.Controllers.navigateToHomePage("b32307a1");
	 * @param {string} userspaceID - The userspace ID to use for the Home page.
	 */
	gsc2app.Controllers.navigateToHomePage = function(userspaceID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.navigateToHomePage", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Update the userspace ID if necessary.
		if (gsc2app.Controllers.confirmUserspaceID(userspaceID)) {
			// Create the home page view.
			gsc2app.State.mainCommandsViewInstance = new gsc2app.Views.MainCommands();

			// Then show this container area.
			gsc2app.Controllers.showContainer('commandrow-container');
			gsc2app.Controllers.showPageHeader('Home', false, true);

		} else {
			gsc2app.Controllers.appNavigate('restart', '', false);
		}
	};

	/**
	 * Navigate to the Select-Course page which is where the user can select the course for
	 * a new scorecard.  This function invokes the Backbone router function.  If the specified
	 * userspace ID does not match the currently active userspace ID, the user will be asked to
	 * confirm their userspace name before the Select-Course page is shown.
	 * @example
	 * gsc2app.Controllers.navigateToSelectCoursePage("b32307a1");
	 * @param {string} userspaceID - The userspace ID to use for the Select-Course page.
	 */
	gsc2app.Controllers.navigateToSelectCoursePage = function(userspaceID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.navigateToSelectCoursePage", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Backbone router function for when the course for a new score needs to be
		// selected.

		// Update the userspace ID if necessary.
		if (gsc2app.Controllers.confirmUserspaceID(userspaceID)) {
			// Load in the available courses.
			gsc2app.Utilities.logMsg('Attempting to load the courses for the current userspace');
			gsc2app.State.coursesCollectionInstance = new gsc2app.Collections.Courses();
			gsc2app.State.coursesCollectionInstance.setUrl(gsc2app.State.userspaceID);
			gsc2app.State.coursesCollectionInstance.loadCourses({showErrors: false})
				.then((result) => {
					if (result) {
						// The courses loaded successfully.
						if (gsc2app.State.coursesCollectionInstance.getNumCourses() > 0) {
							// We have at least one course.  Populate the course selection element.
							gsc2app.State.courseSelectorViewInstance = new gsc2app.Views.CourseSelector();
							gsc2app.State.courseSelectorViewInstance.populateCourseSelectionList(gsc2app.State.coursesCollectionInstance);
						}
					} else {
						gsc2app.Utilities.logMsg('No courses found for the current userspace');
						gsc2app.Utilities.logMsg('Attempting to load the default list of courses');
						const lastErrorMsg = gsc2app.State.coursesCollectionInstance.lastErrorMsg;

						// The userspace-specific course list could not be found, so load in the default course list.
						// Note that this code is effectively working on the same object instance as it was called on.
						gsc2app.State.coursesCollectionInstance.resetUrl();
						gsc2app.State.coursesCollectionInstance.loadCourses({showErrors: false})
							.then((result) => {
								if (result) {
									// The courses loaded successfully.
									if (gsc2app.State.coursesCollectionInstance.getNumCourses() > 0) {
										// We have at least one course.  Populate the course selection element.
										gsc2app.State.courseSelectorViewInstance = new gsc2app.Views.CourseSelector();
										gsc2app.State.courseSelectorViewInstance.populateCourseSelectionList(gsc2app.State.coursesCollectionInstance);
									}
								} else {
									gsc2app.Utilities.logMsg('Could not load the default list of courses');
									gsc2app.Utilities.errorMsg('No list of courses could be loaded');
								}
						});
					}
				});

			// Then show this container area.
			gsc2app.Controllers.showContainer('courseselectorrow-container');
			gsc2app.Controllers.showPageHeader('Course Selection', true, true);

		} else {
			gsc2app.Controllers.appNavigate('restart', '', false);
		}
	};

	/**
	 * Navigate to the New-Scorecard page which displays a blank scorecard for a specified
	 * course.  This function invokes the Backbone router function.  If the specified
	 * userspace ID does not match the currently active userspace ID, the user will be asked to
	 * confirm their userspace name before the New-Scorecard page is shown.
	 * @example
	 * gsc2app.Controllers.navigateToNewScorecardPage("b32307a1", "03709882-f4a3-44dc-b0ba-f5f5aa73aec0");
	 * @param {string} userspaceID - The userspace ID to use for the New-Scorecard page.
	 * @param {string} courseID - The ID of the course to use to create the new scorecard.
	 */
	gsc2app.Controllers.navigateToNewScorecardPage = function(userspaceID, courseID) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.navigateToNewScorecardPage", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Update the userspace ID if necessary.
		if (gsc2app.Controllers.confirmUserspaceID(userspaceID)) {
			//JK// HERE I AM, load in the courses for this userspace ID if this hasn't been done yet.

			// Then create the new scorecard.
			gsc2app.Controllers.createNewScorecardForCourse(courseID);

			// Then show this container area.
			gsc2app.Controllers.showContainer('scorecard-container');
			gsc2app.Controllers.showPageHeader('Active Scorecard', true, true);

		} else {
			gsc2app.Controllers.appNavigate('restart', '', false);
		}
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Main function for the Golf Scorecard 2 application.  This function sets the initial view
	 * state and starts the workflow.
	 * @example
	 * gsc2app.Controllers.appStart();
	 */
	gsc2app.Controllers.appStart = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Controllers.appStart", 'nodetype':"function", 'group':"gsc2app.Controllers", 'datatype':"node"}
		// Main startup function for the golf scorecard application.
		// Does not do any initial navigation.  Expects the Backbone router to do that.

		// Scripts are enabled, so show the overall container.  Hide everything first.
		$('#outer-container').hide();
		gsc2app.Controllers.hideAll();

		// Business logic for id="title-container".
		gsc2app.State.dateModelInstance = new gsc2app.Models.Date();
		gsc2app.State.dateViewInstance = new gsc2app.Views.Date({model: gsc2app.State.dateModelInstance});

		// Any other application initialization goes here.

		// Finally, show everything.
		$('#title-container').show();
		gsc2app.Controllers.showPageHeader('Initializing...');
		// Finally, show the overall container once its rows have been shown/hidden properly.
		$('#outer-container').show();
	};

	// Start the app.
	gsc2app.Controllers.appStart();

})();
