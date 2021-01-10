/**
 * @file JavaScript module for the GolfScorecard2 web application.  This file contains
 * the BackboneJS views for the corresponding models for the golf scorecard application.
 * @author Jim Kottas
 * @copyright Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.
 * @license MIT
 * @requires jquery.js
 * @requires underscore.js
 * @requires backbone.js
 * @requires 1-commonutils.js
 * @requires 2-serverapi.js
 * @requires 3-models.js
 */

/**
 * Namespace object which will contain all of the avaScript functionality for the
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
	 * Namespace object for the view-related functions.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.Views = gsc2app.Views || {};

	/**
	 * Namespace object for storing stateful working variables.
	 * @type {object}
	 * @namespace
	 */
	gsc2app.State = gsc2app.State || {};
	
	// Declare state variables for these views and the resulting controllers to use.

	/**
	 * Store the currently active userspace ID (the hashCode of the userspace name)
	 * for the current user.
	 * @type {string}
	 */
	gsc2app.State.userspaceID = '';

	/**
	 * Store the 0-based index of the active course in the array of courses.
	 * @type {number}
	 */
	gsc2app.State.selectedCourseIndex = -1;

	/**
	 * Store the course ID for the active course that the user selected.
	 * @type {string}
	 */
	gsc2app.State.selectedCourseID = '';

	/**
	 * Store the number of columns in the scorecard so that the Save button can span
	 * across them.
	 * @type {number}
	 */
	gsc2app.State.numScorecardColumns = 0;
	
	// Reminders:
	//		1. A Backbone view definition returns a constructor function.
	//		2. All calls to create a new view instance should pass in an argument of the form:
	//				{model: modelInstance}
	//		   to establish the link between the modelInstance and this particular view.  Other attributes
	//		   such as el, tagname, and classname may be passed in as well as part of this argument.

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.Date view provides a way to display a gsc2app.Models.Date object.
	 * Injects its view HTML code into the element with the HTML ID "#date-container".  This
	 * view should be constructed using a single JSON parameter called 'model', which should
	 * be an instance of the gsc2app.Models.Date type.
	 * @example
	 * let dateModel = new gsc2app.Models.Date();
	 * let dateView = new gsc2app.Views.Date({model: dateModel});
	 * @class {function} gsc2app.Views.Date
	 * @see {@link gsc2app.Models.Date}
	 */
    gsc2app.Views.Date = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.Date", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Views.Date.el - The jQuery object corresponding to the
		 * HTML parent ID for this view.
		 */
		el: $('#date-container'),

		// Uses the parameter "value" that should be formatted as a date.
		/**
		 * @property {function} gsc2app.Views.Date.template - The UnderscoreJS object with
		 * the HTML for the view.
		 */
		template: _.template('<span><%= value %></span>'),

		/**
		 * Initialize a newly created gsc2app.Views.Date view object.  Automatically called
		 * as part of the constructor operation.
		 * @member {function} gsc2app.Views.Date.initialize
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render this gsc2app.Views.Date view object into the target HTML ID container tag.
		 * Automatically called as part of the gsc2app.Views.Date.initialize() function.
		 * @member {function} gsc2app.Views.Date.render
		 * @returns {this} Returns this.
		 */
		render: function() {
			this.$el.html(this.template({value: this.model.fetchDate()}));
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler for when the Home button is clicked.  Causes the router to navigate to the
	 * Home page.
	 * @param {event} [evt=null] - The event data from the Home button click.
	 */
	gsc2app.Views.homeClicked = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.homeClicked", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt) {
			evt.stopPropagation();
		}
		gsc2app.Controllers.appNavigate('home');
	};

	/**
	 * Event handler for when the Start button is clicked.  Causes the router to navigate to the
	 * Start page.
	 * @param {event} [evt=null] - The event data from the Start button click.
	 */
	gsc2app.Views.startClicked = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.startClicked", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt) {
			evt.stopPropagation();
		}
		gsc2app.Controllers.appNavigate('start', '', false);
	};

	/**
	 * The gsc2app.Views.PageHeader view renders the page header area.  The view should be
	 * constructed using a single JSON parameter ("options") that will be passed to the
	 * gsc2app.Views.PageHeader.initialize() function as the options.  See that function for
	 * information on what options are available.
	 * @example
	 * let options = {
	 *     page_header_text: "Home",        // Indicate that this is the Home Page.
	 *     show_home_button: false,         // Don't show the Home button since we're on the Home page.
	 * 	   show_start_button: true          // Show the Start button so the user can start over with a new userspace.
	 * };
	 * let pageHeaderView = new gsc2app.Views.PageHeader(options);
	 * @class {function} gsc2app.Views.PageHeader
	 * @see {@link gsc2app.Views.PageHeader.initialize}
	 */
	gsc2app.Views.PageHeader = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.PageHeader", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Views.PageHeader.el - The jQuery object corresponding to
		 * the HTML parent ID for this view.
		 */
		el: $('#pageheader-container'),

		/**
		 * @property {string} gsc2app.Views.PageHeader.page_header_text - The text to display
		 * in the page header area.
		 */
		page_header_text: '',				// The text to display in the page header area.

		/**
		 * @property {boolean} gsc2app.Views.PageHeader.show_home_link - If true, show the Home
		 * link/button.  If false, hide it.
		 */
		show_home_link: false,				// If true, show and enable a Home link in the page header area.

		/**
		 * @property {boolean} gsc2app.Views.PageHeader.show_start_link - If true, show the Start
		 * (Restart) link/button.  If false, hide it.
		 */
		show_start_link: false,				// If true, show and enable a Restart link in the page header area.

		/**
		 * @property {function} gsc2app.Views.PageHeader.template - The UnderscoreJS object with
		 * the HTML for the view.
		 */
		template: _.template(
			'<table class="pageheadercontainer__table"><tr> \
			<td id="pageheadertext-container" class="pageheaderarea__text"><%= pageHeaderText %></td> \
			<td id="pageheaderlinks-container" class="pageheaderarea__links"> \
			<a class="<%= homeLinkCssClass %>" href="#home/<%= userspaceID %>" onclick="javascript:gsc2app.Views.homeClicked();">Home</a> \
			&nbsp;&nbsp; \
			<a class="<%= startLinkCssClass %>" href="#start" onclick="javascript:gsc2app.Views.startClicked();">Restart</a> \
			&nbsp; \
			</td></tr></table>'
		),

		/**
		 * Initialize the gsc2app.Views.PageHeader view using any options given, and then renders
		 * it.  Note that this function will be called by the BackboneJS framework.  It is not
		 * intended to be called directly.  The options may be specified as a single argument to
		 * the view's constructor function.  See the constructor function for an example.
		 * @param {object} options - An object with the option values to control this view.
		 * @param {string} options.page_header_text - Specifies the text to set in the page
		 * header area.
		 * @param {boolean} options.show_home_button - Specify true if the Home button (or
		 * link) should be displayed, otherwise false if it should be hidden.
		 * @param {boolean} options.show_start_button - Specify true if the Start/Restart
		 * button (or link) should be displayed, otherwise false if it should be hidden.
		 * @member {function} gsc2app.Views.PageHeader.initialize
		 * @see {@link gsc2app.Views.PageHeader}
		 */
		initialize: function(options) {
			this.model = {};
			this.page_header_text = options.page_header_text;
			this.show_home_link = options.show_home_button;
			this.show_start_link = options.show_start_button;
			this.render();
		},

		/**
		 * Render the gsc2app.Views.PageHeader view.  Usually called by the
		 * gsc2app.Views.PageHeader.initialize function.
		 * @member {function} gsc2app.Views.PageHeader.render
		 * @returns {gsc2app.Views.PageHeader} Returns this.
		 * @see {@link gsc2app.Views.PageHeader.initialize}
		 */
		render: function() {
			this.$el.html(this.template({
				pageHeaderText: this.page_header_text,
				homeLinkCssClass: (this.show_home_link ? 'pageheaderarea__links--visible' : 'pageheaderarea__links--hidden'),
				userspaceID: gsc2app.State.userspaceID,
				startLinkCssClass: (this.show_start_link ? 'pageheaderarea__links--visible' : 'pageheaderarea__links--hidden')
			}));
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler to process the userspace name as entered by the user.
	 * @param {event} [evt=null] - The event data from the Submit button click.
	 */
	gsc2app.Views.processUserSpaceNameEntry = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processUserSpaceNameEntry", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt) {
			evt.stopPropagation();
		}
		let nameEntered = $('#usname').val().trim();
		if (nameEntered === '') {
			gsc2app.Utilities.errorMsg('Userspace name cannot be empty, try again.');
			// Clear the existing value and return the focus to the input field.
			$('#usname').val('').focus();
		} else {
			// Save the userspace name that was entered.
			gsc2app.State.userSpaceViewInstance.model.setUserSpaceName(nameEntered);
			// Navigate to the home page, now that the userspace name (and thus ID)
			// are known.
			gsc2app.Controllers.appNavigate('home');
		}
	};

	/**
	 * The gsc2app.Views.UserSpace view renders the page area where the user can enter in their
	 * userspace name, from which a userspace ID will be computed.  Pass in as the single parameter
	 * an object with a model member which contains a gsc2app.Models.UserSpace object.
	 * @example
	 * let userSpaceModel = new gsc2app.Models.UserSpace();
	 * let userspaceView = new gsc2app.Views.UserSpace({model: userSpaceModel});
	 * @class {function} gsc2app.Views.UserSpace
	 * @see {@link gsc2app.Models.UserSpace}
	 */
    gsc2app.Views.UserSpace = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.UserSpace", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Views.UserSpace.el - The jQuery object corresponding
		 * to the HTML parent ID for this view.
		 */
		el: $('#userspace-container'),
		
		/**
		 * @property {function} gsc2app.Views.UserSpace.template - The UnderscoreJS object
		 * with the HTML for the view.
		 */
		template: _.template(
			'<br/> \
			<form id="usform" class="userspaceform"> \
			  <table> \
			    <tr> \
				  <td><label for="usname" class="userspaceform__promptlabel">Enter your userspace name:</label></td> \
				  <td>&nbsp;</td> \
				  <td><input type="password" id="usname" name="usname" value="" autocomplete="off" autofocus class="userspaceform__textinput"></td> \
				  <td>&nbsp;</td> \
				  <td><input id="usform-submit-button" type="button" value="Submit" class="mybutton mybutton__submit"></td> \
			    </tr> \
			  </table> \
			</form>'
		),

		/**
		 * Initialize and render the gsc2app.Views.UserSpace view.  Usually called by the
		 * BackboneJS framework.  It does not have any options that the caller can set.
		 * function.
		 * @member {function} gsc2app.Views.UserSpace.initialize
		 * @returns {gsc2app.Views.UserSpace} Returns this.
		 * @see {@link gsc2app.Views.UserSpace.render}
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render the gsc2app.Views.UserSpace view.  Usually called by the
		 * gsc2app.Views.UserSpace.initialize function.
		 * @member {function} gsc2app.Views.UserSpace.render
		 * @returns {gsc2app.Views.UserSpace} Returns this.
		 * @see {@link gsc2app.Views.UserSpace.initialize}
		 */
		render: function() {
			this.$el.html(this.template());
			$('#usname').on('keypress', function(evt) {
				if (evt.keyCode === 13) {
					evt.preventDefault();
					gsc2app.Views.processUserSpaceNameEntry();
				}
			});
			$('#usform-submit-button').click(gsc2app.Views.processUserSpaceNameEntry);
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler to process the userspace name as entered by the user when in confirmation mode.
	 * @param {event} [evt=null] - The event data from the Confirm button click.
	 */
	gsc2app.Views.processUserSpaceNameEntryForConfirmation = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processUserSpaceNameEntryForConfirmation", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt) {
			evt.stopPropagation();
		}
		let nameEntered = $('#usname').val().trim();
		if (nameEntered === '') {
			gsc2app.Utilities.errorMsg('Userspace name cannot be empty, try again.');
			// Clear the existing value and return the focus to the input field.
			$('#usname').val('').focus();
		} else {
			// Save the userspace name that was entered.
			gsc2app.State.userSpaceViewInstance.model.setUserSpaceName(nameEntered);
			// Test to see if the resulting userspaceID matches what was expected.
			let target_userspaceID = gsc2app.State.userSpaceViewInstance.target_userspaceID;
			let entered_userspaceID = gsc2app.State.userSpaceViewInstance.model.getHashCode();
			if (target_userspaceID === entered_userspaceID) {
				// Yes, the correct userspace name was entered, so navigate to the desired page.
				let target_navigatePage = gsc2app.State.userSpaceViewInstance.target_navigatePage;
				if (target_navigatePage) {
					gsc2app.Controllers.appNavigate(target_navigatePage);
				} else {
					gsc2app.Utilities.errorMsg('Internal error: Target redirect page not specified, starting over.');
					gsc2app.Controllers.appNavigate('restart', '', false);
				}
			} else {
				// The userspace IDs don't match, so alert the user and then navigate to the start page.
				gsc2app.Utilities.logMsg(`The userspace ID that was entered ("${entered_userspaceID}") does not match the target userspace ID ("${target_userspaceID}").`);
				gsc2app.Utilities.warningMsg(`Userspace name does not correspond to the target userspace ID "${target_userspaceID}", starting over.`);
				gsc2app.Controllers.appNavigate('restart', '', false);
			}
		}
	};

	/**
	 * The gsc2app.Views.ConfirmUserspace view allows the user to enter in their userspace name
	 * so it can be compared with the current userspace ID to see if they match.  If they do
	 * match, the app navigates to the original page (view) that was requested by the user.  If
	 * not, the app navigates to the Start page (view) so the user can start over.  The view
	 * should be constructed using a single JSON parameter ("options") that will be passed to the
	 * gsc2app.Views.ConfirmUserspace.initialize() function as the options.  See that function for
	 * information on what options are available.
	 * @example
	 * let options = {
	 *     model: currentUserSpaceModel,                    // An initialized instance of a gsc2app.Models.UserSpace object.
	 *     target_userspaceID: "b32307a1",                  // Specify the userspace ID to be confirmed.
	 *     target_navigatePage: "select-course/b32307a1"	// The page/URL in the BackboneJS routing table to navigate to if the userspace ID is confirmed.
	 * };
	 * let confirmUserspaceView = new gsc2app.Views.ConfirmUserspace(options);
	 * @class {function} gsc2app.Views.ConfirmUserspace
	 * @see {@link gsc2app.Views.ConfirmUserspace.initialize}
	 */
    gsc2app.Views.ConfirmUserspace = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.ConfirmUserspace", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Views.ConfirmUserSpace.el - The jQuery object corresponding
		 * to the HTML parent ID for this view.
		 */
		el: $('#userspace-container'),		// Reuse the same container as the one for entering in the userspace name.

		/**
		 * @property {gsc2app.Models.UserSpace} gsc2app.Views.ConfirmUserspace.model - An instance of
		 * a gsc2app.Models.UserSpace object that stores the userspace information.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.UserSpace", 'tonodename':"gsc2app.Views.ConfirmUserspace", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {string} gsc2app.Views.ConfirmUserspace.target_userspaceID - The userspace
		 * ID to be confirmed.
		 */
		target_userspaceID: '',

		/**
		 * @property {string} gsc2app.Views.ConfirmUserspace.target_navigatePage - The BackboneJS
		 * routing URL for the page to navigate to if the target userspace ID is confirmed.
		 */
		target_navigatePage: '',
		
		/**
		 * @property {function} gsc2app.Views.ConfirmUserSpace.template - The UnderscoreJS
		 * object with the HTML for the view.
		 */
		template: _.template(
			'<br/> \
			<form id="usform" class="userspaceform"> \
			  <table> \
				<tr> \
				  <td><label for="usname" class="userspaceform__promptlabel">Enter userspace name for confirmation:</label></td> \
				  <td>&nbsp;</td> \
				  <td><input type="password" id="usname" name="usname" value="" autocomplete="off" autofocus class="userspaceform__textinput"></td> \
				  <td>&nbsp;</td> \
				  <td><input id="usform-submit-button" type="button" value="Submit" class="mybutton mybutton__submit"></td> \
				</tr> \
			  </table> \
			</form>'
		),

		/**
		 * Initialize the gsc2app.Views.ConfirmUserspace view using any options given, and then
		 * renders it.  Note that this function will be called by the BackboneJS framework.  It
		 * is not intended to be called directly.  The options may be specified as a single
		 * argument to the view's constructor function.  See the constructor function for an
		 * example.
		 * @param {object} options - An object with the option values to control this view.
		 * @param {string} options.target_userspaceID - The userspace ID to be confirmed.
		 * @param {boolean} options.target_navigatePage - The BackboneJS routing URL for the
		 * page to navigate to if the target userspace ID is confirmed.
		 * @member {function} gsc2app.Views.ConfirmUserspace.initialize
		 * @see {@link gsc2app.Views.ConfirmUserspace}
		 */
		initialize: function(options) {
			this.model = options.model;
			this.target_userspaceID = options.target_userspaceID;
			this.target_navigatePage = options.target_navigatePage;
			this.render();
		},

		/**
		 * Render the gsc2app.Views.ConfirmUserspace view.  Usually called by the
		 * gsc2app.Views.ConfirmUserspace.initialize function.
		 * @member {function} gsc2app.Views.ConfirmUserspace.render
		 * @returns {gsc2app.Views.ConfirmUserspace} Returns this.
		 * @see {@link gsc2app.Views.ConfirmUserspace.initialize}
		 */
		render: function() {
			this.$el.html(this.template());
			$('#usname').on('keypress', function(evt) {
				if (evt.keyCode === 13) {
					evt.preventDefault();
					gsc2app.Views.processUserSpaceNameEntryForConfirmation();
				}
			});
			$('#usform-submit-button').click(gsc2app.Views.processUserSpaceNameEntryForConfirmation);
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler to process the new-scorecard button click, which navigates to the
	 * new-scorecard page.
	 * @param {event} [evt=null] - The event data from the new-scorecard button click.
	 */
	gsc2app.Views.actionNewScorecard = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.actionNewScorecard", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		// Event handler for the new-scorecard button click.  This involves starting
		// the select-course workflow.
		if (evt) {
			evt.stopPropagation();
		}
		gsc2app.Controllers.appNavigate('select-course');
	};

	/**
	 * The gsc2app.Views.MainCommands view renders the page area which displays the main commands
	 * that the user can select.  There are no options that may be specified by the caller.
	 * @example
	 * let mainCommandsView = new gsc2app.Views.MainCommands();
	 * @class {function} gsc2app.Views.MainCommands
	 */
    gsc2app.Views.MainCommands = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.MainCommands", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Views.MainCommands.el - The jQuery object corresponding
		 * to the HTML parent ID for this view.
		 */
		el: $('#command-container'),
		
        // Possible commands are:  New scorecard, Open current scorecard, Retrieve previous scorecard.
		/**
		 * @property {function} gsc2app.Views.MainCommands.template - The UnderscoreJS object
		 * with the HTML for the view.
		 */
		template: _.template(
			'<br/> \
			<table class="logicalpagecontainer logicalpagecontainer__commandarea"> \
				<tr> \
					<td class="commandarea commandarea__outercell"> \
						<button id="new-scorecard-button" type="button" class="mybutton mybutton__command">New Scorecard</button> \
					</td> \
					<td class="commandarea commandarea__innercell"> \
						<button id="manage-scorecards-button" type="button" class="mybutton mybutton__command">My Scorecards</button> \
					</td> \
					<td class="commandarea commandarea__outercell"> \
						<button id="manage-courses-button" type="button" class="mybutton mybutton__command">My Courses</button> \
					</td> \
				</tr> \
			</table>'
		),

		/**
		 * Initialize and render the gsc2app.Views.MainCommands view.  Usually called by the
		 * BackboneJS framework.  It does not have any options that the caller can set.
		 * function.
		 * @member {function} gsc2app.Views.MainCommands.initialize
		 * @returns {gsc2app.Views.MainCommands} Returns this.
		 * @see {@link gsc2app.Views.MainCommands.render}
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render the gsc2app.Views.MainCommands view.  Usually called by the
		 * gsc2app.Views.MainCommands.initialize function.
		 * @member {function} gsc2app.Views.MainCommands.render
		 * @returns {gsc2app.Views.MainCommands} Returns this.
		 * @see {@link gsc2app.Views.MainCommands.initialize}
		 */
		render: function() {
			this.$el.html(this.template());
			$('#new-scorecard-button').click(gsc2app.Views.actionNewScorecard);
			$('#manage-scorecards-button').click(gsc2app.Controllers.cmdManageMyScorecards);
			$('#manage-courses-button').click(gsc2app.Controllers.cmdManageMyCourses);
			$('#new-scorecard-button').focus();
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler to process the submit button when the user selects a golf course.
	 * @param {event} [evt=null] - The event data from the Select button click.
	 */
	gsc2app.Views.processSelectedCourse = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processSelectedCourse", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt) {
			evt.stopPropagation();
		}
		// Retrieve the course that was selected.
		gsc2app.State.selectedCourseIndex = $('#courselist-selector').val();
		let activeCourseModel = gsc2app.State.coursesCollectionInstance.at(gsc2app.State.selectedCourseIndex);
		gsc2app.State.selectedCourseID = activeCourseModel.getCourseID();
		gsc2app.Controllers.appNavigate('new-scorecard', gsc2app.State.selectedCourseID);
	};

	/**
	 * Event handler to update the course information when the course pull-down selector is changed
	 * to a different course.
	 * @param {event} [evt=null] - The event data from the course-selection pull-down list control.
	 */
	gsc2app.Views.updateSelectedCourseInfo = function(evt = null) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.updateSelectedCourseInfo", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt) {
			evt.stopPropagation();
		}
		let selectedCourseIndex = $('#courselist-selector').val();
		let courseModel = gsc2app.State.courseSelectorViewInstance.coursesCollection.at(selectedCourseIndex);
		$('#form-cs-numholes').html(gsc2app.Utilities.safeValue(courseModel.getCourseNumHoles()));
		$('#form-cs-totalpar').html(gsc2app.Utilities.safeValue(courseModel.getCourseTotalPar()));
		$('#form-cs-address').html(gsc2app.Utilities.safeValue(courseModel.getCourseAddress()));
		$('#form-cs-city').html(gsc2app.Utilities.safeValue(courseModel.getCourseCity()));
		$('#form-cs-state').html(gsc2app.Utilities.safeValue(courseModel.getCourseState()));
		$('#form-cs-zipcode').html(gsc2app.Utilities.safeValue(courseModel.getCourseZipCode()));

		let linkurl = gsc2app.Utilities.safeValue(courseModel.getCourseInfoUrl());
		if (linkurl === '') {
			$('#form-cs-moreinfo').html('');
		} else {
			$('#form-cs-moreinfo').html(`<a href="${linkurl}" target="_blank">${linkurl}</a>`);
		}
		$('#form-cs-notes').html(gsc2app.Utilities.safeValue(courseModel.getCourseNotes()));
	};

	/**
	 * The gsc2app.Views.CourseSelector view renders the page area in which the user can select
	 * select the golf source to use for the new scorecard.  There are no options that may be
	 * specified by the caller.
	 * @example
	 * let mainCommandsView = new gsc2app.Views.CourseSelector();
	 * @class {function} gsc2app.Views.CourseSelector
	 */
    gsc2app.Views.CourseSelector = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.CourseSelector", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {object} gsc2app.Views.CourseSelector.el - The jQuery object corresponding
		 * to the HTML parent ID for this view.
		 */
		el: $('#courseselector-container'),

		/**
		 * @property {gsc2app.Collections.Courses} gsc2app.Views.CourseSelector.coursesCollection - 
		 * Will be set to the course collection instance of type gsc2app.Collections.Courses that
		 * this view should use.
		 */
		coursesCollection: {},
		
		/**
		 * @property {function} gsc2app.Views.CourseSelector.template - The UnderscoreJS object
		 * with the HTML for the view.
		 */
		template: _.template(
			'<br/> \
			<form id="courselistform"> \
				<fieldset> \
					<legend class="selectcoursearea__groupheading">Where are you playing today?</legend> \
					<table class="logicalpagecontainer logicalpagecontainer__selectcoursearea"> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label"> \
								<label for="courselist-selector">Available&nbsp;courses:</label> \
							</td> \
							<td> \
								<select name="courselist-selector" id="courselist-selector" title="Select course" size="1" disabled="true" autofocus onchange="javascript:gsc2app.Views.updateSelectedCourseInfo();"> \
									<option value="loading">Loading...</option> \
								</select> \
								&nbsp; &nbsp; &nbsp; \
								<input id="select-course-button" type="button" value="Select" class="mybutton mybutton__select" onclick="javascript:gsc2app.Views.processSelectedCourse();"> \
							</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">Number&nbsp;of&nbsp;holes:</td> \
							<td id="form-cs-numholes" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">Total&nbsp;par:</td> \
							<td id="form-cs-totalpar" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">Address:</td> \
							<td id="form-cs-address" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">City:</td> \
							<td id="form-cs-city" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">State:</td> \
							<td id="form-cs-state" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">ZIP&nbsp;code:</td> \
							<td id="form-cs-zipcode" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">Course&nbsp;information:</td> \
							<td id="form-cs-moreinfo" class="selectcoursearea selectcoursearea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="selectcoursearea selectcoursearea__label">Notes:</td> \
							<td class="selectcoursearea selectcoursearea__value"> \
							  <p id="form-cs-notes" class="selectcoursearea__value--notes">&nbsp;</p> \
							</td> \
						</tr> \
					</table> \
				</fieldset> \
			</form>'
		),

		/**
		 * Initialize and render the gsc2app.Views.CourseSelector view.  Usually called by the
		 * BackboneJS framework.  It does not have any options that the caller can set.
		 * @member {function} gsc2app.Views.CourseSelector.initialize
		 * @returns {gsc2app.Views.CourseSelector} Returns this.
		 * @see {@link gsc2app.Views.CourseSelector.render}
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render the gsc2app.Views.CourseSelector view.  Usually called by the
		 * gsc2app.Views.CourseSelector.initialize function.
		 * @member {function} gsc2app.Views.CourseSelector.render
		 * @returns {gsc2app.Views.CourseSelector} Returns this.
		 * @see {@link gsc2app.Views.CourseSelector.initialize}
		 */
		render: function() {
			this.$el.html(this.template());
			return this;
		},

		/**
		 * Set the list of sources to be available in the <select> tag above.
		 * Remove any existing courses there.  Enable the <select> tag as well.
		 * @example
		 * let coursesCollection = new gsc2app.Collections.Courses();
		 * let userspaceID = "b32307a1";
		 * coursesCollection.setUrl(userspaceID);
		 * coursesCollection.loadCourses({showErrors: true})
		 *     .then((result) => {
		 *         if (result) {
		 *             // The courses loaded successfully.
		 *             if (coursesCollection.getNumCourses() > 0) {
		 *                 // We have at least one course.  Populate the course selection element.
		 *                 let courseSelectorView = new gsc2app.Views.CourseSelector();
		 *                 courseSelectorView.populateCourseSelectionList(coursesCollection);
		 *             }
		 *         } else {
		 *             // Handle error conditions here.
		 *         }
		 *     });
		 * @param {gsc2app.Collections.Courses} coursesCollectionInstance - An instance of a
		 * gsc2app.Collections.Courses object that has loaded the list of available courses already.
		 * @member {function} gsc2app.Views.CourseSelector.populateCourseSelectionList
		 * @returns {gsc2app.Views.CourseSelector} Returns this.
		 * @see {@link gsc2app.Collections.Courses}
		 */
		populateCourseSelectionList: function(coursesCollectionInstance) {
			this.coursesCollection = coursesCollectionInstance;
			if (this.coursesCollection && this.coursesCollection.length > 0) {
				$('#courselist-selector').empty();
				$('#courselist-selector').prop('disabled', true);
				let numDone = 0;
				for (let i = 0; i < this.coursesCollection.length; i++) {
					let courseModel = this.coursesCollection.at(i);
					let enabled = courseModel.isCourseEnabled();
					if (enabled === true) {
						let cmName = courseModel.getCourseName();
						let cmCity = courseModel.getCourseCity();
						let cmState = courseModel.getCourseState();
						if (cmName) {
							let s = cmName;
							if (cmState) {
								if (cmCity) {
									s += ` (${cmCity}, ${cmState})`;
								} else {
									s += ` (${cmState})`;
								}
							}
							$('#courselist-selector').append($('<option></option>').val(i).html(s));
							numDone++;
						}
					}
				}
				if (numDone > 0) {
					$('#courselist-selector').change(gsc2app.Views.updateSelectedCourseInfo);
					$('#select-course-button').click(gsc2app.Views.processSelectedCourse);
					$('#courselist-selector')
						.prop('disabled', false)
						.focus();
					gsc2app.Views.updateSelectedCourseInfo();
				}
			}
			return this;
		}
    });

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.ScorecardCourse view renders a scorecard based on a course model.
	 * It should be created with a single object that has a model member that is a gsc2app.Models.Course
	 * object.  The example code combines the creation of the gsc2app.Views.ScorecardCourse view and the
	 * gsc2app.Views.ScorecardData view since they are usually coupled together.
	 * @example
	 * let index = 2;   // Use the third course in the course collection as the target course.
	 * let activeCourseModel = coursesCollection.at(index);    // This is a gsc2app.Collections.Courses object.
	 * let activeScorecard = new gsc2app.Models.Scorecard();
	 * let userspaceID = "b32307a1";
	 * activeScorecard.createScorecard(userspaceID, activeCourseModel);
	 * let scorecardCourseView = new gsc2app.Views.ScorecardCourse({model: activeCourseModel});
	 * let scorecardDataView = new gsc2app.Views.ScorecardData({model: activeScorecard});
	 * @class {function} gsc2app.Views.ScorecardCourse
	 * @see {@link gsc2app.Views.ScorecardData}
	 * @see {@link gsc2app.Models.Course}
	 * @see {@link gsc2app.Models.Scorecard}
	 * @see {@link gsc2app.Collections.Courses}
	 */
    gsc2app.Views.ScorecardCourse = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.ScorecardCourse", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		// The model to pass in here is a gsc2app.Models.Course instance, which will be accessable
		// via this.model.
		/**
		 * @property {object} gsc2app.Views.ScorecardCourse.el - The jQuery object corresponding
		 * to the HTML parent ID for this view.
		 */
		el: $('#active-course-container'),

		/**
		 * @property {gsc2app.Models.Course} gsc2app.Views.ScorecardCourse.model - An instance of
		 * a gsc2app.Models.Course object that has the information for the desired course.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Course", 'tonodename':"gsc2app.Views.ScorecardCourse", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {function} gsc2app.Views.ScorecardCourse.template - The UnderscoreJS object
		 * with the HTML for the view.
		 */
		template: _.template(
			'<br/> \
			<form id="scorecardcourseform" class="courseviewarea courseviewarea__form"> \
				<fieldset> \
					<legend class="courseviewarea courseviewarea__groupheading">Active&nbsp;Course</legend> \
					<table> \
						<tr> \
							<td class="courseviewarea courseviewarea__label">Name:</td> \
							<td id="form-activecourse-name" class="courseviewarea courseviewarea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="courseviewarea courseviewarea__label">Address:</td> \
							<td id="form-activecourse-fulladdress" class="courseviewarea courseviewarea__value">&nbsp;</td> \
						</tr> \
						<tr> \
							<td class="courseviewarea courseviewarea__label">Details:</td> \
							<td id="form-activecourse-moreinfo" class="courseviewarea courseviewarea__value">&nbsp;</td> \
						</tr> \
					</table> \
				</fieldset> \
			</form>'
		),

		/**
		 * Initialize and render the gsc2app.Views.ScorecardCourse view.  Usually called by the
		 * BackboneJS framework.  It does not have any options that the caller can set.
		 * @member {function} gsc2app.Views.ScorecardCourse.initialize
		 * @returns {gsc2app.Views.ScorecardCourse} Returns this.
		 * @see {@link gsc2app.Views.ScorecardCourse.render}
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render the gsc2app.Views.ScorecardCourse view.  Usually called by the
		 * gsc2app.Views.ScorecardCourse.initialize function.
		 * @member {function} gsc2app.Views.ScorecardCourse.render
		 * @returns {gsc2app.Views.ScorecardCourse} Returns this.
		 * @see {@link gsc2app.Views.ScorecardCourse.initialize}
		 */
		render: function() {
			this.$el.html(this.template());

			if (this.model && this.model.get) {
				// Populate the course information fields in the table.
				let course_name = gsc2app.Utilities.safeValue(this.model.getCourseName());
				let num_holes = gsc2app.Utilities.safeValue(this.model.getCourseNumHoles());
				if (num_holes && (num_holes !== '' || num_holes > 0)) {
					course_name += ` (${num_holes} hole${ gsc2app.Utilities.plural(num_holes) })`;
				}
				$('#form-activecourse-name').html(course_name);
				
				// Make the address information into a single line.
				let cmAddress = gsc2app.Utilities.safeValue(this.model.getCourseAddress());
				let cmCity = gsc2app.Utilities.safeValue(this.model.getCourseCity());
				let cmState = gsc2app.Utilities.safeValue(this.model.getCourseState());
				let cmZip = gsc2app.Utilities.safeValue(this.model.getCourseZipCode());
				let fullAddress = cmAddress;
				if ((fullAddress !== '') && ((cmCity !== '') || (cmState !== '') || (cmZip !== ''))) {
					fullAddress += ', ';
				}
				if (cmCity !== '') {
					fullAddress += cmCity;
					if ((cmState !== '') || (cmZip !== '')) {
						fullAddress += ', ';
					}
				}
				if (cmState !== '') {
					fullAddress += cmState;
					if (cmZip !== '') {
						fullAddress += ' ' + cmZip;
					}
				} else {
					if (cmZip !== '') {
						fullAddress += cmZip;
					}
				}
				$('#form-activecourse-fulladdress').html(fullAddress);

				let linkurl = gsc2app.Utilities.safeValue(this.model.getCourseInfoUrl());
				if (linkurl === '') {
					$('#form-activecourse-moreinfo').html('');
				} else {
					$('#form-activecourse-moreinfo').html(`<a href="${ linkurl }" target="_blank">${ linkurl }</a>`);
				}
			}
			return this;
		}
    });


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.HoleDataViewElementIDMap object maps the HTML IDs from the DIV elements
	 * to the INPUT elements, and vice versa.  This will allow the event handles to switch which
	 * elements are hidden and shown.
	 * @type {Map}
	 */
	gsc2app.Views.HoleDataViewElementIDMap = new Map();

	/**
	 * The gsc2app.Views.IDtoHoleDataViewObjectMap object maps the HTML IDs from the DIV elements
	 * and the INPUT elements to the actual gsc2app.Views.NumberField objects that rendered them.
	 * These view objects container reference the corresponding gsc2app.Models.NumberField
	 * objects.
	 * @type {Map}
	 */
	gsc2app.Views.IDtoHoleDataViewObjectMap = new Map();

	/**
	 * Function to transform a rank level into the CSS class string to use for the hole.
	 * The rank level should be one of the gsc2app.Models.ScoreRankingsEnum enumeration.
	 * @example
	 * let cssHoleClass = gsc2app.Views.getCssFromRankLevel(gsc2app.Models.ScoreRankingsEnum.TWO_OVER);
	 * // Oops, a double-bogey.  Note the best hole.  Returns "holedata__highlight--gotdoublebogey".
	 * // The returned string is a full class name that uses the modifier portion of a BEM class name
	 * // to form the appropriate CSS class name for this hole. 
	 * @param {string} rankLevel - The gsc2app.Models.ScoreRankingsEnum enumeration string
	 * for the current rank level for the hole.
	 * @param {string} [cssBemBaseName='holedata__highlight'] - The BEM class name for
	 * the base CSS class.
	 * @returns {string} The fully modified CSS class name to use.
	 * @see {@link gsc2app.Models.ScoreRankingsEnum}
	 */
	gsc2app.Views.getCssFromRankLevel = function(rankLevel, cssBemBaseName = 'holedata__highlight') {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.getCssFromRankLevel", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		let baseName = cssBemBaseName;
		if (baseName !== '') {
			// Append the BEM modifier delimiter since we have a non-empty base name.
			baseName += '--';
		}

		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.EVEN) {
			return baseName + 'gotpar';
		}
		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.HOLE_IN_ONE) {
			return baseName + 'gotholeinone';
		}
		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.ONE_OVER) {
			return baseName + 'gotbogey';
		}
		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.TWO_OVER) {
			return baseName + 'gotdoublebogey';
		}
		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.THREE_OVER_OR_WORSE) {
			return baseName + 'gottriplebogeyorworse';
		}
		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.ONE_UNDER) {
			return baseName + 'gotbirdie';
		}
		if (rankLevel === gsc2app.Models.ScoreRankingsEnum.TWO_UNDER_OR_BETTER) {
			return baseName + 'goteagleorbetter';
		}

		// Default is to assume rankLevel === gsc2app.Models.ScoreRankingsEnum.NONE.
		if (cssBemBaseName === '') {
			return '';
		}
		return cssBemBaseName + '--none';
	};

	/**
	 * Function to take an instance of a gsc2app.Models.NumberField object and return a
	 * string suitable for an INPUT element for editing the value.
	 * @example
	 * // holeValue is a gsc2app.Models.NumberField object for a player's hole score.
	 * let editableValue = gsc2app.Views.formatEditableNumberFieldForEditing(holeValue);
	 * // If the score was 4 and had two 't' qualifiers and 3 'b' qualifiers in some order,
	 * // save "tbbtt", this function returns "4bbbtt".
	 * @param {gsc2app.Models.NumberField} editableNumberField - The gsc2app.Models.NumberField
	 * object to transform into an editable string.
	 * @returns {string} Returns the editable string for the input gsc2app.Models.NumberField object.
	 */
	gsc2app.Views.formatEditableNumberFieldForEditing = function(editableNumberField) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.formatEditableNumberFieldForEditing", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		let theValue = editableNumberField.getValue();
		let theQualifiers = editableNumberField.getQualifiers();
		// Concatenate the value with a sorted list of the qualifiers.  Example:  If the
		// value is 12 and the qualifiers are 'tffbtf', this function returns '12bffftt'.
		let formattedValue = '' + theValue + gsc2app.Utilities.sortStringChars(theQualifiers);
		return formattedValue;
	};

	/**
	 * Function to transform an input string that contains a hole score value and an optional
	 * set of qualifier characters into the number value portion.
	 * @example
	 * let holeScore = "12tffbtf";
	 * let holeScoreNumber = gsc2app.Views.formatValueForDisplay(holeScore);
	 * // Returns 12.
	 * @param {string} textInput - The input string with the hole score, which is a combination
	 * of a number and any qualifying characters.
	 * @returns {number} Returns the numeric score value from the input string.
	 */
	gsc2app.Views.formatValueForDisplay = function(textInput) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.formatValueForDisplay", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		let intValue = 0;
		if (textInput !== '') {
			let strNumber = '';
			for (var n = 0; n < textInput.length; n++) {
				let c = textInput.charAt(n);
				switch (c) {
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						strNumber += c;
						break;
					// Ignore any other characters.
				}
			}
			if (strNumber !== '') {
				intValue = parseInt(strNumber, 10);
			}
		}
		return intValue;
	};

	/**
	 * Function to transform an input string that represents a hole score value and an optional
	 * set of qualifier characters into the qualifier portion using shorthand notation.
	 * @example
	 * let holeScore = "12tffbtf";
	 * let qualifiersForDisplay = gsc2app.Views.formatQualifiersForDisplay(holeScore);
	 * Returns "bf3t2".
	 * @param {string} textInput - The input string with the hole score, which is a combination
	 * of a number and any qualifying characters.
	 * @returns {string} Returns the qualifiers in a shorthand format, suitable for display
	 * to the user.
	 */
	gsc2app.Views.formatQualifiersForDisplay = function(textInput) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.formatQualifiersForDisplay", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		let formattedQualifiers = '';
		if (textInput !== '') {
			let qualMap = new Map();
			for (var n = 0; n < textInput.length; n++) {
				var c = textInput.charAt(n);
				switch (c) {
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
					case ' ':
						// Ignore these characters.
						break;

					default:
						if (qualMap.has(c)) {
							let v = qualMap.get(c);
							qualMap.set(c, v + 1);
						} else {
							qualMap.set(c, 1);
						}
						break;
				}
			}
			for (const [key, value] of qualMap) {
				if (value === 1) {
					formattedQualifiers += key;
				} else {
					formattedQualifiers += `${value}${key}`;
				}
			}
		}
		return formattedQualifiers;
	};

	/**
	 * Function to transform an input string that represents a hole score value and an optional
	 * set of qualifier characters into the qualifier portion for saving in the model.
	 * @example
	 * let holeScore = "12tffbtf";
	 * let qualifiersForDisplay = gsc2app.Views.formatQualifiersForModel(holeScore);
	 * Returns "bffftt".
	 * @param {string} textInput - The input string with the hole score, which is a combination
	 * of a number and any qualifying characters.
	 * @returns {string} Returns the qualifiers in a long format, suitable for saving in the
	 * hole score model.
	 */
	gsc2app.Views.formatQualifiersForModel = function(textInput) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.formatQualifiersForModel", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		let formattedQualifiers = '';
		if (textInput !== '') {
			let strQuals = '';
			for (var n = 0; n < textInput.length; n++) {
				var c = textInput.charAt(n);
				switch (c) {
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
					case ' ':
						// Ignore these characters.
						break;

					default:
						strQuals += c;
						break;
				}
			}
			formattedQualifiers = gsc2app.Utilities.sortStringChars(strQuals);
		}
		return formattedQualifiers;
	};

	/**
	 * Event handler for when an editable field DIV element is clicked.  The function
	 * reformats the DIV value from the corresponding model such that it can be edited
	 * in the corresponding INPUT field.  The function then hides the DIV element and
	 * shows the INPUT element.  Applicable for both gsc2app.Models.NumberField
	 * and gsc2app.Models.StringField objects.
	 * @param {event} evt - The event data from the DIV click.
	 */
	gsc2app.Views.processEditableFieldDivClickHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processEditableFieldDivClickHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		evt.stopPropagation();
		let thisID = evt.target.id;
		let jThisID = '#' + thisID;		// jQuery format
		if (gsc2app.Views.HoleDataViewElementIDMap.has(thisID)) {
			let thatID = gsc2app.Views.HoleDataViewElementIDMap.get(thisID);
			let jThatID = '#' + thatID;
			// Get the associated gsc2app.Models.NumberField object that corresponds to
			// the initial HTML ID.
			if (gsc2app.Views.IDtoHoleDataViewObjectMap.has(thisID)) {
				let theView = gsc2app.Views.IDtoHoleDataViewObjectMap.get(thisID);
				if (!theView.isReadOnly()) {
					if (!theView.isEditMode()) {
						let theModel = theView.getModel();
						// This code is common between gsc2app.Models.NumberField and
						// gsc2app.Models.StringField objects.
						theView.setEditMode();
						$(jThisID).hide();
						$(jThatID)
							.val(theView.formatInputValue())
							.show()
							.focus();
					}
				}
			}
		}
	};

	/**
	 * Event handler for when an editable field INPUT element loses its focus.  The
	 * function reformats the INPUT value from the corresponding model such that it
	 * can be displayed in the corresponding DIV field.  The function then hides the
	 * INPUT element and shows the DIV element.  Applicable for both
	 * gsc2app.Models.NumberField and gsc2app.Models.StringField objects.
	 * @param {event} evt - The event data for when the INPUT field loses the focus
	 * (i.e., it blurs).
	 */
	gsc2app.Views.processEditableFieldInputBlurHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processEditableFieldInputBlurHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		evt.stopPropagation();
		// Clear the save status notification area.
		gsc2app.Views.clearSaveStatus();
		let thisID = evt.target.id;
		let jThisID = '#' + thisID;
		if (gsc2app.Views.HoleDataViewElementIDMap.has(thisID)) {
			let thatID = gsc2app.Views.HoleDataViewElementIDMap.get(thisID);
			let jThatID = '#' + thatID;
			// Get the associated gsc2app.Models.NumberField object that corresponds to
			// the initial HTML ID.
			if (gsc2app.Views.IDtoHoleDataViewObjectMap.has(thisID)) {
				let theView = gsc2app.Views.IDtoHoleDataViewObjectMap.get(thisID);
				if (theView.isEditMode()) {
					let theModel = theView.getModel();
					// Take the value from the current INPUT element and set it in the
					// corresponding DIV element.
					let inputString = $(jThisID).val();
					let modelType = theModel.getModelType();
					if (modelType === 'gsc2app.Models.NumberField') {
						// This is a score value.
						let newValue = gsc2app.Views.formatValueForDisplay(inputString);
						let newQualifiersForModel = gsc2app.Views.formatQualifiersForModel(inputString);
						theModel
							.setValue(newValue)
							.setQualifiers(newQualifiersForModel);
						theView.clearEditMode();
						$(jThisID).hide();
						$(jThatID)
							.html(theView.formatDivValue())
							.show();
						let playerNumber = theModel.getPlayerNumber();
						gsc2app.Utilities.eventDispatcher.trigger('gsc2event:updateModelTotalScore', {
							'player_number': playerNumber
						});
					} else if (modelType === 'gsc2app.Models.StringField') {
						// This is a simple string value.
						theModel.setValue(inputString.trim());
						theView.clearEditMode();
						$(jThisID).hide();
						$(jThatID)
							.html(theView.formatDivValue())
							.show();
					}
				}
			}
		}
	};

	/**
	 * Event handler for when a key is pressed in an INPUT element.  It restricts what keys
	 * are accepted if the corresponding editable field should be numeric only.  It also
	 * handles the case when the Enter key is pressed, which should behave as if the INPUT
	 * element lost its focus.  Note: This event presumes that an object with a boolean
	 * attribute called "numericOnly" is available.  If "numericOnly" if true, the editable
	 * field may not be a number.  If false, the editable field may be any alphanumeric string.
	 * @param {event} evt - The event data for when a keydown event is generated in an
	 * gsc2app.Views.NumberField object.
	 */
	gsc2app.Views.processEditableFieldKeyDownHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processEditableFieldKeyDownHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		if (evt.keyCode === 13) {
			// The Enter key was pressed.
			//JK// HERE I AM, maybe also do this is the key is the tab key or the backtab key?
			evt.preventDefault();
			gsc2app.Views.processEditableFieldInputBlurHandler(evt);
		} else {
			// Check if key should be ignored.
			if (evt.data.numericOnly) {
				// Only 0-9 should be allowed here.
				if (evt.keyCode < '0'.charCodeAt(0) || evt.keyCode > '9'.charCodeAt(0)) {
					// This character is not 0-9, so ignore it.
					evt.preventDefault();
				}
			}
		}
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.StringField view renders the display field for a string value
	 * such as a player name or a hold number.  It allows the string to be edited if the model
	 * permits it.  The constructor function should be called with a single JSON parameter
	 * ("options") that will be passed to the gsc2app.Views.StringField.initialize()
	 * function as the options.  See that function for information on what options are available.
	 * @example
	 * let options = {
	 *     el_target: "html-container-id",      // The HTML ID for the node/tag that will contain this field.
	 *     model: stringFieldModel,             // An instance of a gsc2app.Models.StringField object that contains the string to display.
	 *     base_id: "id-player2-name",          // Base HTML ID for the DIV and INPUT elements that will comprise this field view.
	 *     css_class_div: "div-class",          // CSS class for the DIV display element.
	 *     read_only: false,                    // If true, this field view is read-only so the value cannot be modified by the user.
	 *     placeholder: "Player 1"              // The placeholder text for both the DIV and INPUT elements.
	 *     // The next two values are only needed if read_only is false:
	 *     css_class_input: "input-class",      // CSS class for the INPUT editing element.
	 *     hint: "Enter player name",           // The hint text to display in an empty field to give the user feedback on what to enter.
	 * };
	 * let stringFieldView = new gsc2app.Views.StringField(options);
	 * @class {function} gsc2app.Views.StringField
	 * @see {@link gsc2app.Models.StringField}
	 * @see {@link gsc2app.Views.StringField.initialize}
	 */
	gsc2app.Views.StringField = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.StringField", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {string} gsc2app.Views.StringField.el_target - The HTML parent element
		 * using an ID attribute that will be set dynamically.
		 */
		el_target: '',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {object} gsc2app.Views.StringField.el - This will be initialized to the
		 * jQuery object corresonding to the HTML ID set in gsc2app.Views.StringField.el_target.
		 * @see {@link gsc2app.Views.StringField.el_target}
		 */
		el: {},		// Delay the instantiation of this cached jQuery element because it doesn't exist initially.

		/**
		 * @property {gsc2app.Models.StringField} gsc2app.Views.StringField.model - An instance of
		 * a gsc2app.Models.StringField object that has the string value to render.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.StringField", 'tonodename':"gsc2app.Views.StringField", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {string} gsc2app.Views.StringField.hint - The hint text to display in an
		 * empty field to give the user feedback on what to enter.
		 */
		hint: '',

		/**
		 * @property {string} gsc2app.Views.StringField.placeholderText - The placeholder text
		 * to display in both the DIV and INPUT elements, giving the user of sense of what to
		 * enter.  This property corresonds to the placeholder attribute for the INPUT element,
		 * but it is set as the DIV element value only if the model value is an empty string.
		 * If the model value is not an empty string, then the placeholder text is ignored for
		 * the DIV element.
		 */
		placeholderText: '',

		/**
		 * @property {string} gsc2app.Views.StringField.base_id - The base HTML ID attribute
		 * that will be used for the two component tags, DIV for display and INPUT for editing.
		 */
		base_id: '',

		/**
		 * @property {string} gsc2app.Views.StringField.div_id - The HTML ID derived from the
		 * base_id value for the DIV tag.
		 */
		div_id: '',

		/**
		 * @property {string} gsc2app.Views.StringField.input_id - The HTML ID derived from
		 * the base_id value for the INPUT tag.
		 */
		input_id: '',

		/**
		 * @property {string} gsc2app.Views.StringField.base_css_class_div - The base CSS class
		 * to use to always be in effect for the DIV tag.
		 */
		base_css_class_div: '',

		/**
		 * @property {string} gsc2app.Views.StringField.base_css_class_input - The base CSS
		 * class to use to always be in effect for the INPUT tag.
		 */
		base_css_class_input: '',

		/**
		 * @property {boolean} gsc2app.Views.StringField.read_only - If true, this field view
		 * is read-only so the value cannot be modified by the user.  If false, the field may
		 * be edited/modified by the user.
		 */
		read_only: false,

		/**
		 * @property {boolean} gsc2app.Views.StringField.edit_mode - If true, the INPUT mode is
		 * active.  If false, the DIV mode is active.
		 */
		edit_mode: false,

		// Define the template view code for the case when read_only is false.  This uses
		// UnderscoreJS.  There is a DIV element for displaying the score in a read-only
		// mode, and an INPUT element for editing the score.  Here are the parameters that
		// are required:
		//		divID				The HTML ID for the DIV element.
		//		inputID				The HTML ID for the INPUT element.
		//		baseCssClassDiv		The CSS class(es) for the DIV element.
		//		baseCssClassInput	The CSS class(es) for the DIV element.
		//		divValue			The initial value to display in the DIV element.
		//		inputValue			The initial value to display in the INPUT element.
		//		inputHint			The HTML title text to display to give the user a hint as to what may be entered for the INPUT element.
		//		inputPlaceholder	The placeholder text for the INPUT element.
		/**
		 * @property {function} gsc2app.Views.StringField.templateReadWrite - The UnderscoreJS
		 * object with the HTML for the view which allows for both display (read) and input
		 * (write) functionality.
		 */
		templateReadWrite: _.template(
			'<div id="<%= divID %>" style="display: inline-block;" class="<%= baseCssClassDiv %>"><%= divValue %></div> \
			<input id="<%= inputID %>" type="text" value="<%= inputValue %>" style="display: none;" \
				class="<%= baseCssClassInput %>" title="<%= inputHint %>" placeholder="<%= inputPlaceholder %>" \
				autofocus onfocus="this.setSelectionRange(this.value.length, this.value.length);">'
		),

		// Define the template view code for the case when read_only is true.  This uses
		// UnderscoreJS.  There is only a DIV element for displaying the score.  There is
		// no INPUT element.  Here are the parameters that are required:
		//		divID				The HTML ID for the DIV element.
		//		baseCssClassDiv		The CSS class(es) for the DIV element.
		//		divValue			The initial value to display in the DIV element.
		/**
		 * @property {function} gsc2app.Views.StringField.templateReadOnly - The UnderscoreJS
		 * object with the HTML for the view which allows only for both display (read)
		 * functionality.
		 */
		templateReadOnly: _.template(
			'<div id="<%= divID %>" style="display: inline-block;" class="<%= baseCssClassDiv %>"><%= divValue %></div>'
		),

		/**
		 * Initialize the gsc2app.Views.StringField view using any options given, and
		 * then renders it.  Note that this function will be called by the BackboneJS framework.
		 * It is not intended to be called directly.  The options may be specified as a single
		 * argument to the view's constructor function.  See the constructor function for an example.
		 * @param {object} options - An object with the option values to control this view.
		 * @param {string} options.el_target - The HTML ID for the node/tag that will contain
		 * this field.
		 * @param {string} options.hint - The hint text to display in an empty field to give
		 * the user feedback on what to enter.
		 * @param {gsc2app.Models.StringField} options.model - An instance of a
		 * gsc2app.Models.StringField object.
		 * @param {string} options.base_id - Base HTML ID for the DIV and INPUT elements.
		 * @param {string} options.css_class_div - CSS class for the DIV display element.
		 * @param {string} options.css_class_input - CSS class for the INPUT editing element.
		 * @param {boolean} options.read_only - If true, this field view is read-only so the
		 * value cannot be modified by the user.  If false, the field may be edited/modified
		 * by the user.
		 * @member {function} gsc2app.Views.StringField.initialize
		 * @see {@link gsc2app.Views.StringField}
		 * @see {@link gsc2app.Views.StringField.render}
		 */
		initialize: function(options) {
			this.el_target = '#' + options.el_target;	// Make the HTML element ID into a jQuery format.
			this.setElement($(this.el_target));			// Connect to the jQuery object and re-establish the cache.
			this.model = options.model;
			this.base_css_class_div = options.css_class_div;
			this.base_id = options.base_id;				// The base_id should just be an ID string and not have any jQuery features about it.
			// Ensure unique IDs with a little randomness.
			let r = gsc2app.Utilities.randomIntFromInterval(10000, 99999);
			this.div_id = this.base_id + '-div-' + r;
			this.read_only = options.read_only;
			this.placeholderText = options.placeholder;

			if (!this.read_only) {
				// The INPUT field is used only when the field is not read-only.
				this.input_id = this.base_id + '-input-' + r;
				if (!gsc2app.Views.HoleDataViewElementIDMap.has(this.div_id)) {
					// Save the ID mapping both ways.
					gsc2app.Views.HoleDataViewElementIDMap.set(this.div_id, this.input_id);
					gsc2app.Views.HoleDataViewElementIDMap.set(this.input_id, this.div_id);
				}
				// Save the mapping from the HTML IDs to the actual model.
				gsc2app.Views.IDtoHoleDataViewObjectMap.set(this.div_id, this);
				gsc2app.Views.IDtoHoleDataViewObjectMap.set(this.input_id, this);
				this.base_css_class_input = options.css_class_input;
				this.hint = options.hint;
			}
			
			// Now render the display view for this string field.
			this.render();

			// And listen in for changes so that this view can be updated.
			this.model.on('change', this.render, this);
		},

		/**
		 * Return the model object associated with this view.
		 * @example
		 * let stringFieldModel = stringFieldView.getModel();
		 * @member {function} gsc2app.Views.StringField.getModel
		 * @returns {gsc2app.Models.StringField}
		 * @see {@link gsc2app.Models.StringField}
		 */
		getModel: function() {
			return this.model;
		},
		
		/**
		 * Return the value to display/edit in this view.
		 * @example
		 * let valueToDisplay = stringFieldView.getValue();
		 * // Returns, for example, "John".
		 * @member {function} gsc2app.Views.StringField.getValue
		 * @returns {number} Returns the string value to be displayed in this view.
		 * @see {@link gsc2app.Models.StringField.getValue}
		 */
		getValue: function() {
			return this.model.getValue();
		},

		/**
		 * Set the read-only flag for this field view, which will make this field be read-only.
		 * @example
		 * stringFieldView.setReadOnly();
		 * @member {function} gsc2app.Views.StringField.setReadOnly
		 * @returns {gsc2app.Views.StringField} Returns this.
		 * @see {@link gsc2app.Views.StringField.clearReadOnly}
		 * @see {@link gsc2app.Views.StringField.isReadOnly}
		 */
		setReadOnly: function() {
			this.read_only = true;
			return this;
		},

		/**
		 * Clear the read-only flag for this field view, which will make this field be editable.
		 * @example
		 * stringFieldView.clearReadOnly();
		 * @member {function} gsc2app.Views.StringField.clearReadOnly
		 * @returns {gsc2app.Views.StringField} Returns this.
		 * @see {@link gsc2app.Views.StringField.setReadOnly}
		 * @see {@link gsc2app.Views.StringField.isReadOnly}
		 */
		clearReadOnly: function() {
			this.read_only = false;
			return this;
		},

		/**
		 * Return the state of the read-only flag for this field view.
		 * @example
		 * let isReadOnly = stringFieldView.isReadOnly();
		 * @member {function} gsc2app.Views.StringField.isReadOnly
		 * @returns {boolean} Returns true if this field is read-only, false if it is editable.
		 * @see {@link gsc2app.Views.StringField.setReadOnly}
		 * @see {@link gsc2app.Views.StringField.clearReadOnly}
		 */
		isReadOnly: function() {
			return this.read_only;
		},

		/**
		 * Set the view mode to be edit mode.
		 * @example
		 * stringFieldView.setEditMode();
		 * // Sets edit mode.
		 * @member {function} gsc2app.Views.StringField.setEditMode
		 * @returns {gsc2app.Views.StringField} Returns this.
		 * @see {@link gsc2app.Views.StringField.clearEditMode}
		 * @see {@link gsc2app.Views.StringField.isEditMode}
		 */
		setEditMode: function() {
			this.edit_mode = true;
			return this;
		},
		
		/**
		 * Set the view mode to be display (no-edit) mode.
		 * @example
		 * stringFieldView.clearEditMode();
		 * // Sets display mode.
		 * @member {function} gsc2app.Views.StringField.clearEditMode
		 * @returns {gsc2app.Views.StringField} Returns this.
		 * @see {@link gsc2app.Views.StringField.setEditMode}
		 * @see {@link gsc2app.Views.StringField.isEditMode}
		 */
		clearEditMode: function() {
			this.edit_mode = false;
			return this;
		},

		/**
		 * Return true if this view is in edit mode, false if it is in display mode.
		 * @example
		 * if (stringFieldView.isEditMode()) {
		 *     // Do something appropriate since we're in edit mode.
		 * } else {
		 *     // Do something appropriate since we're in display mode.
		 * }
		 * // Sets edit mode.
		 * @member {function} gsc2app.Views.StringField.isEditMode
		 * @returns {boolean} Returns true if this view is in edit mode, false if it is in display mode.
		 * @see {@link gsc2app.Views.StringField.setEditMode}
		 * @see {@link gsc2app.Views.StringField.clearEditMode}
		 */
		isEditMode: function() {
			return this.edit_mode;
		},
		
		/**
		 * Returns the HTML string to use to display the value of the model value using the DIV element.
		 * @example
		 * let displayValue = stringFieldView.formatDivValue();
		 * // Returns, for example, "John &amp; Sue" when the model string value is "John & Sue".
		 * @member {function} gsc2app.Views.StringField.formatDivValue
		 * @returns {string} Returns the HTML string to use to display the value of the model
		 * string value using the DIV element.
		 * @see {@link gsc2app.Views.StringField.formatInputValue}
		 */
		formatDivValue: function() {
			let v = this.getValue();
			if (v === '') {
				// The model value is an empty string, so use the placeholder text instead.
				v = this.placeholderText;
			}
			v = _.escape(v);
			return v;
		},
		
		/**
		 * Returns the HTML string to use for editing the value of the model value using
		 * the INPUT element.
		 * @example
		 * let editValue = stringFieldView.formatInputValue();
		 * // Returns, for example, "John &amp; Sue" when the model string value is "John & Sue".
		 * @member {function} gsc2app.Views.StringField.formatInputValue
		 * @returns {string} Returns the HTML string to use for editing the value of the
		 * model value using the INPUT element.
		 * @see {@link gsc2app.Views.StringField.formatDivValue}
		 */
		formatInputValue: function() {
			if (!this.edit_mode) {
				return '';
			}
			let v = this.getValue();
			v = _.escape(v);
			return v;
		},

		/**
		 * Render the gsc2app.Views.StringField view.  Usually called by the
		 * gsc2app.Views.StringField.initialize function.
		 * @member {function} gsc2app.Views.StringField.render
		 * @returns {gsc2app.Views.StringField} Returns this.
		 * @see {@link gsc2app.Views.StringField.initialize}
		 */
		render: function() {
			let divValue = this.formatDivValue();
			if (this.read_only) {
				// Only display the string field.  Don't allow it to be changed.
				this.$el.html(this.templateReadOnly({
					'divID': this.div_id,
					'baseCssClassDiv': this.base_css_class_div,
					'divValue': divValue
				}));

			} else {
				// Both display the string field and allow it to be changed.
				let inputValue = this.formatInputValue();
				this.$el.html(this.templateReadWrite({
					'divID': this.div_id,
					'inputID': this.input_id,
					'baseCssClassDiv': this.base_css_class_div,
					'baseCssClassInput': this.base_css_class_input,
					'divValue': divValue,
					'inputValue': inputValue,
					'inputHint': this.hint,
					'inputPlaceholder': this.placeholderText
				}));
				$('#' + this.div_id).click(gsc2app.Views.processEditableFieldDivClickHandler);
				$('#' + this.input_id).blur(gsc2app.Views.processEditableFieldInputBlurHandler);
				$('#' + this.input_id).keypress(
					{ 'numericOnly': false },
					gsc2app.Views.processEditableFieldKeyDownHandler
				);
			}
			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.NumberField view renders the display field for a hole score, like
	 * 3, 4, 5tb, etc.  It allows the number/value to be edited.  The constructor function
	 * should be called with a single JSON parameter ("options") that will be passed to the
	 * gsc2app.Views.NumberField.initialize() function as the options.  See that function for
	 * information on what options are available.
	 * @example
	 * let options = {
	 *     el_target: "html-container-id",      // The HTML ID for the node/tag that will contain this field.
	 *     model: holeDataModel,                // An instance of a gsc2app.Models.NumberField object.
	 *     base_id: "id-player2-hole12",        // Base HTML ID for the DIV and INPUT elements.
	 *     css_class_div: "div-class",          // CSS class for the DIV display element.
	 *     enable_highlighting: true,           // If true, enabling highlighting the score relative to par.
	 *     show_zero: false,                    // If true, show a zero value as 0.  Otherwise, show an empty field.
	 *     read_only: false,                    // If true, this field view is read-only so the value cannot be modified by the user.
	 *     // The field below is only needed if read_only is false:
	 *     css_class_input: "input-class"       // CSS class for the INPUT editing element.
	 * };
	 * let numberFieldView = new gsc2app.Views.NumberField(options);
	 * @class {function} gsc2app.Views.NumberField
	 * @see {@link gsc2app.Models.NumberField}
	 * @see {@link gsc2app.Views.NumberField.initialize}
	 */
	gsc2app.Views.NumberField = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.NumberField", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {string} gsc2app.Views.NumberField.el_target - The HTML parent element
		 * using an ID attribute that will be set dynamically.
		 */
		el_target: '',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {object} gsc2app.Views.NumberField.el - This will be initialized to
		 * the jQuery object corresonding to the HTML ID set in gsc2app.Views.NumberField.el_target.
		 * @see {@link gsc2app.Views.NumberField.el_target}
		 */
		el: {},				// Delay the instantiation of this cached jQuery element because it doesn't exist initially.

		/**
		 * @property {gsc2app.Models.NumberField} gsc2app.Views.NumberField.model - An instance of
		 * a gsc2app.Models.NumberField object that has the string value to render.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.NumberField", 'tonodename':"gsc2app.Views.NumberField", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {string} gsc2app.Views.NumberField.base_id - The base HTML ID attribute
		 * that will be used for the two component tags, DIV for display and INPUT for editing.
		 */
		base_id: '',

		/**
		 * @property {string} gsc2app.Views.NumberField.div_id - The HTML ID derived from the
		 * base_id value for the DIV tag.
		 */
		div_id: '',

		/**
		 * @property {string} gsc2app.Views.NumberField.input_id - The HTML ID derived from
		 * the base_id value for the INPUT tag.
		 */
		input_id: '',

		/**
		 * @property {string} gsc2app.Views.NumberField.base_css_class_div - The base CSS
		 * class to use to always be in effect for the DIV tag.
		 */
		base_css_class_div: '',

		/**
		 * @property {string} gsc2app.Views.NumberField.base_css_class_input - The base CSS
		 * class to use to always be in effect for the INPUT tag.
		 */
		base_css_class_input: '',

		/**
		 * @property {string} gsc2app.Views.NumberField.special_css_class - This is an
		 * additional CSS class if this hole is to be highlighted in some way.
		 */
		special_css_class: '',

		/**
		* @property {boolean} gsc2app.Views.NumberField.show_zero - If true, show a zero value
		* (0) instead of nothing.  If false, show it as a blank field.
		*/
		show_zero: false,

	   /**
		 * @property {boolean} gsc2app.Views.NumberField.read_only - If true, this field
		 * view is read-only so the value cannot be modified by the user.  If false, the
		 * field may be edited/modified by the user.
		 */
		read_only: false,

		/**
		 * @property {boolean} gsc2app.Views.NumberField.edit_mode - If true, the INPUT
		 * mode is active.  If false, the DIV mode is active.
		 */
		edit_mode: false,

		/**
		 * @property {boolean} gsc2app.Views.NumberField.enable_highlighting - If true,
		 * enable highlighting mode whereby the score value is highlighted based on how it
		 * compares to par.
		 */
		enable_highlighting: false,

		// Define the template view code that supports both display (read) and edit (write)
		// modes.  Also supports highlighting for the display mode.  This uses UnderscoreJS.
		// This view is intended to be used when read_only is false.  Here are the parameters
		// that are required:
		//		divID					The HTML ID for the DIV element.
		//		inputID					The HTML ID for the INPUT element.
		//		baseCssClassDiv			The CSS class(es) for the DIV element.
		//		baseCssClassInput		The CSS class(es) for the DIV element.
		//		baseCssClassHighlight	The CSS class(es) for the highlight element.  Should
		//								be empty if highlighting is not active.
		//		divValue				The initial value to display in the DIV element.
		//		inputValue				The initial value to display in the INPUT element.
		//		inputHint				The HTML title text to display to give the user a hint
		//								as to what may be entered for the INPUT element.
		/**
		 * @property {function} gsc2app.Views.NumberField.templateReadWrite - The UnderscoreJS
		 * object with the HTML for the view that supports highlighed display (read) and edit
		 * (write) modes.
		 */
		templateReadWrite: _.template(
			'<div id="<%= divID %>" style="display: inline-block;" class="<%= baseCssClassDiv %> <%= baseCssClassHighlight %>"><%= divValue %></div> \
			<input id="<%= inputID %>" type="text" value="<%= inputValue %>" style="display: none;" \
				class="<%= baseCssClassInput %>" title="<%= inputHint %>" autofocus \
				onfocus="this.setSelectionRange(this.value.length, this.value.length);">'
		),

		// Define the template view code that supports only display (read) mode.  It also
		// supports highlighting for the display mode.  This uses UnderscoreJS.  This view
		// is intended to be used when read_only is true.  Here are the parameters that are
		// required:
		//		divID					The HTML ID for the DIV element.
		//		baseCssClassDiv			The CSS class(es) for the DIV element.
		//		baseCssClassHighlight	The CSS class(es) for the highlight element.  Should
		//								be empty if highlighting is not active.
		//		divValue				The initial value to display in the DIV element.
		/**
		 * @property {function} gsc2app.Views.NumberField.templateReadOnly - The UnderscoreJS
		 * object with the HTML for the view that supports only highlighed display (read) mode.
		 */
		templateReadOnly: _.template(
			'<div id="<%= divID %>" style="display: inline-block;" class="<%= baseCssClassDiv %> <%= baseCssClassHighlight %>"><%= divValue %></div>'
		),

		/**
		 * Initialize the gsc2app.Views.NumberField view using any options given, and then renders
		 * it.  Note that this function will be called by the BackboneJS framework.  It is not
		 * intended to be called directly.  The options may be specified as a single argument to
		 * the view's constructor function.  See the constructor function for an example.
		 * @param {object} options - An object with the option values to control this view.
		 * @param {string} options.el_target - The HTML ID for the node/tag that will contain
		 * this field.
		 * @param {gsc2app.Models.NumberField} options.model - An instance of a
		 * gsc2app.Models.NumberField object.
		 * @param {string} options.base_id - Base HTML ID for the DIV and INPUT elements.
		 * @param {string} options.css_class_div - CSS class for the DIV display element.
		 * @param {string} options.css_class_input - CSS class for the INPUT editing element.
		 * @param {boolean} options.read_only - If true, this field view is read-only so the
		 * value cannot be modified by the user.  If false, the field may be edited/modified
		 * by the user.
		 * @param {boolean} options.enable_highlighting - If true, the view supportings highlighting the score relative to par.
		 * @member {function} gsc2app.Views.NumberField.initialize
		 * @see {@link gsc2app.Views.NumberField}
		 * @see {@link gsc2app.Views.NumberField.render}
		 */
		initialize: function(options) {
			this.el_target = '#' + options.el_target;	// Make the HTML element ID into a jQuery format.
			this.setElement($(this.el_target));			// Connect to the jQuery object and re-establish the cache.
			this.model = options.model;
			this.base_id = options.base_id;				// The base_id should just be an ID string and not have any jQuery features about it.
			// Ensure unique IDs with a little randomness.
			let r = gsc2app.Utilities.randomIntFromInterval(10000, 99999);
			this.div_id = this.base_id + '-div-' + r;
			this.base_css_class_div = options.css_class_div;
			this.enable_highlighting = options.enable_highlighting;
			this.show_zero = options.show_zero;
			this.read_only = options.read_only;

			if (!this.read_only) {
				// Initialize the settings for the INPUT mode when the field is not read-only.
				this.input_id = this.base_id + '-input-' + r;

				if (!gsc2app.Views.HoleDataViewElementIDMap.has(this.div_id)) {
					// Save the ID mapping both ways.
					gsc2app.Views.HoleDataViewElementIDMap.set(this.div_id, this.input_id);
					gsc2app.Views.HoleDataViewElementIDMap.set(this.input_id, this.div_id);
				}

				// Save the mapping from the HTML IDs to the actual model.
				gsc2app.Views.IDtoHoleDataViewObjectMap.set(this.div_id, this);
				gsc2app.Views.IDtoHoleDataViewObjectMap.set(this.input_id, this);

				this.base_css_class_input = options.css_class_input;
			}

			// Now render the display view for this number field.
			this.render();

			// And listen in for changes so that this view can be updated.
			this.model.on('change', this.render, this);
		},

		/**
		 * Return the model object associated with this view.
		 * @example
		 * let holeDataModel = numberFieldView.getModel();
		 * @member {function} gsc2app.Views.NumberField.getModel
		 * @returns {gsc2app.Models.NumberField}
		 * @see {@link gsc2app.Models.NumberField}
		 */
		getModel: function() {
			return this.model;
		},
		
		/**
		 * Return the value to display/edit in this view.
		 * @example
		 * let valueTypeToUse = numberFieldView.getValue();
		 * // Returns, for example, 3.
		 * @member {function} gsc2app.Views.NumberField.getValue
		 * @returns {number} Returns the numeric value to display in this view.
		 */
		getValue: function() {
			return this.model.getValue();
		},

		/**
		 * Enable the flag to have the field display a zero value, as opposed to leaving the
		 * field blank.
		 * @example
		 * numberFieldView.enableShowZero();
		 * @member {function} gsc2app.Views.NumberField.enableShowZero
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.disableShowZero}
		 * @see {@link gsc2app.Views.NumberField.shouldShowZero}
		 */
		enableShowZero: function() {
			this.show_zero = true;
			return this;
		},

		/**
		 * Disable the flag to have the field display a zero value, so that a zero value will
		 * be displayed as an empty field.
		 * @example
		 * numberFieldView.disableShowZero();
		 * @member {function} gsc2app.Views.NumberField.disableShowZero
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.enableShowZero}
		 * @see {@link gsc2app.Views.NumberField.shouldShowZero}
		 */
		disableShowZero: function() {
			this.show_zero = false;
			return this;
		},
		
		/**
		 * Return the status of the show-zero flag.
		 * @example
		 * let showZeroAs0 = numberFieldView.shouldShowZero();
		 * @member {function} gsc2app.Views.NumberField.shouldShowZero
		 * @returns {boolean} Returns true if a zero value should be shown as 0, or false if a
		 * blank field should be shown for a zero value.
		 * @see {@link gsc2app.Views.NumberField.enableShowZero}
		 * @see {@link gsc2app.Views.NumberField.disableShowZero}
		 */
		shouldShowZero: function() {
			return this.show_zero;
		},
		
		/**
		 * Set the read-only flag for this field view, which will make this field be read-only.
		 * @example
		 * numberFieldView.setReadOnly();
		 * @member {function} gsc2app.Views.NumberField.setReadOnly
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.clearReadOnly}
		 * @see {@link gsc2app.Views.NumberField.isReadOnly}
		 */
		setReadOnly: function() {
			this.read_only = true;
			return this;
		},

		/**
		 * Clear the read-only flag for this field view, which will make this field be editable.
		 * @example
		 * numberFieldView.clearReadOnly();
		 * @member {function} gsc2app.Views.NumberField.clearReadOnly
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.setReadOnly}
		 * @see {@link gsc2app.Views.NumberField.isReadOnly}
		 */
		clearReadOnly: function() {
			this.read_only = false;
			return this;
		},

		/**
		 * Return the state of the read-only flag for this field view.
		 * @example
		 * let isReadOnly = numberFieldView.isReadOnly();
		 * @member {function} gsc2app.Views.NumberField.isReadOnly
		 * @returns {boolean} Returns true if this field is read-only, false if it is editable.
		 * @see {@link gsc2app.Views.NumberField.setReadOnly}
		 * @see {@link gsc2app.Views.NumberField.clearReadOnly}
		 */
		isReadOnly: function() {
			return this.read_only;
		},

		/**
		 * Set the view mode to be edit mode.
		 * @example
		 * numberFieldView.setEditMode();
		 * // Sets edit mode.
		 * @member {function} gsc2app.Views.NumberField.setEditMode
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.clearEditMode}
		 * @see {@link gsc2app.Views.NumberField.isEditMode}
		 */
		setEditMode: function() {
			this.edit_mode = true;
			return this;
		},
		
		/**
		 * Set the view mode to be display (no-edit) mode.
		 * @example
		 * numberFieldView.clearEditMode();
		 * // Sets display mode.
		 * @member {function} gsc2app.Views.NumberField.clearEditMode
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.setEditMode}
		 * @see {@link gsc2app.Views.NumberField.isEditMode}
		 */
		clearEditMode: function() {
			this.edit_mode = false;
			return this;
		},

		/**
		 * Return true if this view is in edit mode, false if it is in display mode.
		 * @example
		 * if (numberFieldView.isEditMode()) {
		 *     // Do something appropriate since we're in edit mode.
		 * } else {
		 *     // Do something appropriate since we're in display mode.
		 * }
		 * // Sets edit mode.
		 * @member {function} gsc2app.Views.NumberField.isEditMode
		 * @returns {boolean} Returns true if this view is in edit mode, false if it is
		 * in display mode.
		 * @see {@link gsc2app.Views.NumberField.setEditMode}
		 * @see {@link gsc2app.Views.NumberField.clearEditMode}
		 */
		isEditMode: function() {
			return this.edit_mode;
		},
		
		/**
		 * Returns the HTML string to use to display the value of the model value using the
		 * DIV element.
		 * @example
		 * let displayValue = numberFieldView.formatDivValue();
		 * // Returns, for example, "4<sup>m2t</sup>".
		 * @member {function} gsc2app.Views.NumberField.formatDivValue
		 * @returns {string} Returns the HTML string to use to display the value of the model
		 * value using the DIV element.
		 * @see {@link gsc2app.Views.NumberField.formatInputValue}
		 */
		formatDivValue: function() {
			let v = this.getValue();
			if (v === 0 && !this.show_zero) {
				// Don't show anything in this case.
				return '';
			}
			if (this.model.areQualifiersAllowed()) {
				let q = this.model.getQualifiers();
				let formattedQualsForDisplay = gsc2app.Views.formatQualifiersForDisplay(q);
				if (formattedQualsForDisplay === '') {
					return v.toString();
				} else {
					return `${v}<sup>${formattedQualsForDisplay}</sup>`;
				}
			} else {
				// No qualifiers are allowed, only show the value.
				return v.toString();
			}
		},
		
		/**
		 * Returns the HTML string to use for editing the value of the model value using the
		 * INPUT element.
		 * @example
		 * let editValue = numberFieldView.formatInputValue();
		 * // Returns, for example, "4mtt".
		 * @member {function} gsc2app.Views.NumberField.formatInputValue
		 * @returns {string} Returns the HTML string to use for editing the value of the model
		 * value using the INPUT element.
		 * @see {@link gsc2app.Views.NumberField.formatDivValue}
		 */
		formatInputValue: function() {
			if (!this.edit_mode) {
				return '';
			}
			let v = this.getValue();
			if (v === 0 && !this.show_zero) {
				// Don't show anything in this case.
				return '';
			}
			if (this.model.areQualifiersAllowed()) {
				let q = this.model.getQualifiers();
				// Just concatenate the score and then the qualifiers.
				return `${v}${q}`;
			} else {
				// No qualifiers are allowed, only show the value.
				return v.toString();
			}
		},

		/**
		 * Render the gsc2app.Views.NumberField view.  Usually called by the
		 * gsc2app.Views.NumberField.initialize function.
		 * @member {function} gsc2app.Views.NumberField.render
		 * @returns {gsc2app.Views.NumberField} Returns this.
		 * @see {@link gsc2app.Views.NumberField.initialize}
		 */
		render: function() {
			// Prepare the display values.
			let divValue = this.formatDivValue();

			let cssHighlight = '';
			if (this.enable_highlighting && divValue !== '') {
				// Enable highlighting for this view.
				cssHighlight = 'holedata__highlight';
				let rankLevel = this.model.getScoreRankingLevel();
				let cssHighlightExtra = gsc2app.Views.getCssFromRankLevel(rankLevel);
				if (cssHighlightExtra !== '') {
					cssHighlight += ' ' + cssHighlightExtra;
				}
			}

			if (this.read_only) {
				// Render the HTML elements for the read-only view.
				this.$el.html(this.templateReadOnly({
					'divID': this.div_id,
					'baseCssClassDiv': this.base_css_class_div,
					'baseCssClassHighlight': cssHighlight,
					'divValue': divValue
				}));

			} else {
				let inputValue = this.formatInputValue();
				let hintText = '';
				if (this.model.isNumericOnly()) {
					hintText = 'Enter integer value';
				} else {
					if (this.model.areQualifiersAllowed()) {
						hintText = 'Enter qualified number';
					} else {
						hintText = 'Enter alphanumeric string';
					}
				}

				// Render the HTML elements for the read-write view.
				this.$el.html(this.templateReadWrite({
					'divID': this.div_id,
					'inputID': this.input_id,
					'baseCssClassDiv': this.base_css_class_div,
					'baseCssClassInput': this.base_css_class_input,
					'baseCssClassHighlight': cssHighlight,
					'divValue': divValue,
					'inputValue': inputValue,
					'inputHint': hintText
				}));

				// Set the appropriate event handlers for the DIV and INPUT elements.
				$('#' + this.div_id).click(gsc2app.Views.processEditableFieldDivClickHandler);
				$('#' + this.input_id).blur(gsc2app.Views.processEditableFieldInputBlurHandler);
				$('#' + this.input_id).keypress(
					{ 'numericOnly': this.model.isNumericOnly() },
					gsc2app.Views.processEditableFieldKeyDownHandler
				);
			}
			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.PlayerName view renders the display field for the name of a player.
	 * It allows the name to be entered/edited.  The constructor function should be called with
	 * a single JSON parameter ("options") that will be passed to the
	 * gsc2app.Views.PlayerName.initialize() function as the options.  See that function for
	 * information on what options are available.
	 * @example
	 * let options = {
	 *     htmlContainerID: "html-container-id",    // The HTML ID for the node/tag that will contain this field.
	 *     playerNumber: 2,                         // The 1-based number of the player.  1 = player #1, 2 = player #2, etc.
	 *     model: playerNameModel                   // An instance of a gsc2app.Models.Player object.
	 * };
	 * let playerNameView = new gsc2app.Views.PlayerName(options);
	 * @class {function} gsc2app.Views.PlayerName
	 * @see {@link gsc2app.Models.NumberField}
	 * @see {@link gsc2app.Views.PlayerName.initialize}
	 */
    gsc2app.Views.PlayerName = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.PlayerName", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {string} gsc2app.Views.PlayerName.el_target - The HTML parent element
		 * using an ID attribute that will be set dynamically.
		 */
		el_target: '',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {object} gsc2app.Views.PlayerName.el - This will be initialized to the
		 * jQuery object corresonding to the HTML ID set in gsc2app.Views.NumberField.el_target.
		 * @see {@link gsc2app.Views.PlayerName.el_target}
		 */
		el: {},				// Delay the instantiation of this cached jQuery element because it doesn't exist initially.

		/**
		 * @property {gsc2app.Models.Player} gsc2app.Views.PlayerName.model - An instance of
		 * a gsc2app.Models.Player object that will store the player name.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Player", 'tonodename':"gsc2app.Views.PlayerName", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {number} gsc2app.Views.PlayerName.playerNumber - The 1-based number for
		 * this player.  1 = player #1, 2 = player #2, etc.
		 */
		playerNumber: 0,

		/**
		 * @property {string} gsc2app.Views.PlayerName.htmlInputID - This will be set to the
		 * HTML input tag ID to use for this player name.
		 */
		htmlInputID: '',
		
		// Define the template view code that will be a container for a string field.
		// Here are the parameters that are required:
		//		htmlID		The HTML ID for the DIV element.
		//		cssClass	The CSS class(es) for the DIV element.
		/**
		 * @property {function} gsc2app.Views.PlayerName.template - The UnderscoreJS object
		 * with the HTML for the view.
		 */
		template: _.template('<div id="<%= htmlID %>" class="<%= cssClass %></div>'),

		/**
		 * Initialize the gsc2app.Views.PlayerName view using the options given, and then renders
		 * it.  Note that this function will be called by the BackboneJS framework.  It is not
		 * intended to be called directly.  The options may be specified as a single argument to
		 * the view's constructor function.  See the constructor function for an example.
		 * @param {number} options - An object with the option values to control this view.
		 * @param {string} options.htmlContainerID - The HTML ID for the node/tag that will
		 * contain this field.
		 * @param {number} options.playerNumber - The 1-based number of the player.  1 = player #1,
		 * 2 = player #2, etc.
		 * @param {gsc2app.Models.Player} options.model - An instance of a gsc2app.Models.Player
		 * object.
		 * @member {function} gsc2app.Views.PlayerName.initialize
		 * @see {@link gsc2app.Views.PlayerName}
		 * @see {@link gsc2app.Views.PlayerName.render}
		 */
		initialize: function(options) {
			this.playerNumber = options.playerNumber;
			this.htmlInputID = 'player-name-' + this.playerNumber;
			this.el_target = '#' + options.htmlContainerID;
			this.setElement($(this.el_target));	// Connect to the jQuery object and re-establish the cache.
			this.model = options.model;
			this.render();
		},

		/**
		 * Render the gsc2app.Views.PlayerName view.  Usually called by the
		 * gsc2app.Views.PlayerName.initialize function.
		 * @member {function} gsc2app.Views.PlayerName.render
		 * @returns {gsc2app.Views.PlayerName} Returns this.
		 * @see {@link gsc2app.Views.PlayerName.initialize}
		 */
		render: function() {
			this.$el.html(this.template({
				'htmlID': this.htmlInputID,
				'cssClass': 'scorecardheadingcolumn__playername--container'
			}));
			let playerNameView = new gsc2app.Views.StringField({
				'el_target': this.htmlInputID,
				'model': this.model.getPlayerNameFieldModel(),
				'base_id': `id-data-player-${ this.playerNumber }-name`,
				'css_class_div': 'scorecardheadingcolumn__playername--display',
				'css_class_input': 'scorecardheadingcolumn__playername--input',
				'hint': 'Enter player name',
				'placeholder': 'Player ' + this.playerNumber,
				'read_only': false
			});
			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.HoleNumberHeadingRow view renders the heading row of hole numbers, like "1",
	 * "2", "3a", etc., in the scorecard.  It allows the hole number to be editable.  The constructor
	 * function should be called with a single JSON object with an attribute "model" that is set to
	 * an initialized instance of a gsc2app.Models.Scorecard model.
	 * @example
	 * // Create a new scorecard first.
	 * let modelScorecard = new gsc2app.Models.Scorecard();
	 * let userspaceID = "b32307a1";
	 * // Assumes the collection of course models has been loaded already.
	 * let courseModel = coursesCollection.at(2);   // Select the 3rd course model.
	 * modelScorecard.createScorecard(userspaceID, courseModel);
	 * let holeNumberHeadingRowView = new gsc2app.Views.HoleNumberHeadingRow({model: modelScorecard});
	 * @class {function} gsc2app.Views.HoleNumberHeadingRow
	 * @see {@link gsc2app.Models.Scorecard}
	 */
    gsc2app.Views.HoleNumberHeadingRow = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.HoleNumberHeadingRow", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		/**
		 * @property {string} gsc2app.Views.HoleNumberHeadingRow.el_target - The HTML parent
		 * element using an ID attribute that will be set dynamically.
		 */
		el_target: '#hole-labels-row',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {object} gsc2app.Views.HoleNumberHeadingRow.el - This will be initialized
		 * to the jQuery object corresonding to the HTML ID set in gsc2app.Views.NumberField.el_target.
		 * @see {@link gsc2app.Views.HoleNumberHeadingRow.el_target}
		 */
		el: {},		// Delay the instantiation of this cached jQuery element because it doesn't exist initially.
		
		/**
		 * @property {gsc2app.Models.Scorecard} gsc2app.Views.PlayerRow.model - This will be
		 * set to the scorecard model object for the current scorecard.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Scorecard", 'tonodename':"gsc2app.Views.HoleNumberHeadingRow", 'datatype':"edge", 'edgetype':"normal"}

		// Template parameters:
		//		htmlID				The HTML ID for the table cell.
		//		holeNumber			The text to display in this cell.
		//		extraCSS			Any additional CSS styles to include here.
		/**
		 * @property {function} gsc2app.Views.HoleNumberHeadingRow.template - The UnderscoreJS
		 * object with the HTML for the view.
		 */
		template: _.template('<td id="<%= htmlID %>" class="scorecarddata scorecarddata__holenumbers <%= extraCSS %>"><%= holeNumber %></td>'),

		/**
		 * Initialize and render the gsc2app.Views.HoleNumberHeadingRow view.  Usually called by the
		 * BackboneJS framework.  It does not have any options that the caller can set.
		 * @member {function} gsc2app.Views.HoleNumberHeadingRow.initialize
		 * @returns {gsc2app.Views.HoleNumberHeadingRow} Returns this.
		 * @see {@link gsc2app.Views.HoleNumberHeadingRow.render}
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render the gsc2app.Views.HoleNumberHeadingRow view.  Usually called by the
		 * gsc2app.Views.HoleNumberHeadingRow.initialize function.
		 * @member {function} gsc2app.Views.HoleNumberHeadingRow.render
		 * @returns {gsc2app.Views.HoleNumberHeadingRow} Returns this.
		 * @see {@link gsc2app.Views.HoleNumberHeadingRow.initialize}
		 */
		render: function() {
			this.setElement($(this.el_target));			// Establish access to the desired HTML element in this.el.
			this.$el.html('');							// Start with an empty row.
			gsc2app.State.numScorecardColumns = 0;		// And reset the total number of columns here.

			// Note: this.model is a gsc2app.Models.Scorecard instance.
			let theHoleNumbers = this.model.getHoleNumbersCollection();
			// theHoleNumbers will be a gsc2app.Collections.StringFields object.

			// Column 1
			this.$el.append(this.template({
				'htmlID': 'hole-row-header', 
				'holeNumber': 'Hole #',
				'extraCSS': 'scorecarddata__heading'
			}));

			// Columns 2 through (# of holes) + 1.
			for (let n=0; n < theHoleNumbers.length; n++) {
				// First create the parent node for the field view.
				let element_id = `hole-${ n+1 }-heading-cell`;
				this.$el.append(this.template({
					'htmlID': element_id, 
					'holeNumber': '',
					'extraCSS': ''
				}));

				// Now create the string field view for this hole number.
				let thisHoleNumberModel = theHoleNumbers.at(n);		// This is a gsc2app.Models.StringField object.
				let options = {
					'el_target': element_id,
					'hint': '',		// No hint is needed.
					'model': thisHoleNumberModel,
					'base_id': `hole-${ n+1 }-heading-label`,
					'css_class_div': 'holedata holedata--display holedata__holenumber holedata__holenumber--display',
					'css_class_input': 'holedata holedata--input holedata__holenumber holedata__holenumber--input',
					'read_only': false
				};
				let stringFieldView = new gsc2app.Views.StringField(options);
			}

			// Column (# of holes) + 2
			this.$el.append(this.template({
				'htmlID': 'hole-row-total',
				'holeNumber': 'Total',
				'extraCSS': 'scorecarddata__holenumbers--total'
			}));
			gsc2app.State.numScorecardColumns = 2 + theHoleNumbers.length;
			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.HoleParHeadingRow view renders the row of hole par, like 3, 4, 5, etc.,
	 * in the scorecard.  It allows the hole par to be editable.  The constructor function
	 * should be called with a single JSON object with an attribute "model" that is set to
	 * an initialized instance of a gsc2app.Models.Scorecard model.
	 * @example
	 * // Create a new scorecard first.
	 * let modelScorecard = new gsc2app.Models.Scorecard();
	 * let userspaceID = "b32307a1";
	 * // Assumes the collection of course models has been loaded already.
	 * let courseModel = coursesCollection.at(2);   // Select the 3rd course model.
	 * modelScorecard.createScorecard(userspaceID, courseModel);
	 * let holeNumberHeadingRowView = new gsc2app.Views.HoleNumberHeadingRow({model: modelScorecard});
	 * let holeParHeadingRowView = new gsc2app.Views.HoleParHeadingRow({model: modelScorecard});
	 * @class {function} gsc2app.Views.HoleParHeadingRow
	 * @see {@link gsc2app.Models.Scorecard}
	 */
	gsc2app.Views.HoleParHeadingRow = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.HoleParHeadingRow", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		// This view needs to be generated with an instance of a gsc2app.Models.Scorecard model.
		// This view shows the hole pars, like 3, 4, 5.  It allows the hole par number to be editable.
		/**
		 * @property {string} gsc2app.Views.HoleParHeadingRow.el_target - The HTML parent
		 * element using an ID attribute that will be set dynamically.
		 */
		el_target: '#hole-pars-row',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {object} gsc2app.Views.HoleParHeadingRow.el - This will be initialized
		 * to the jQuery object corresonding to the HTML ID set in gsc2app.Views.NumberField.el_target.
		 * @see {@link gsc2app.Views.HoleParHeadingRow.el_target}
		 */
		el: '',		// Delay the instantiation of this element because it doesn't exist initially.
		
		/**
		 * @property {gsc2app.Models.Scorecard} gsc2app.Views.PlayerRow.model - This will be
		 * set to the scorecard model object for the current scorecard.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Scorecard", 'tonodename':"gsc2app.Views.HoleParHeadingRow", 'datatype':"edge", 'edgetype':"normal"}

		// Template parameters:
		//		htmlID			The HTML ID for the table cell.
		//		holePar			The hole par number to display in this cell.
		/**
		 * @property {function} gsc2app.Views.HoleParHeadingRow.template - The UnderscoreJS
		 * object with the HTML for the view.
		 */
		template: _.template('<td id="<%= htmlID %>" class="scorecarddata scorecarddata__holepars"><%= holePar %></td>'),

		/**
		 * Initialize and render the gsc2app.Views.HoleParHeadingRow view.  Usually called by the
		 * BackboneJS framework.  It does not have any options that the caller can set.
		 * @member {function} gsc2app.Views.HoleParHeadingRow.initialize
		 * @returns {gsc2app.Views.HoleParHeadingRow} Returns this.
		 * @see {@link gsc2app.Views.HoleParHeadingRow.render}
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render the gsc2app.Views.HoleParHeadingRow view.  Usually called by the
		 * gsc2app.Views.HoleParHeadingRow.initialize function.
		 * @member {function} gsc2app.Views.HoleParHeadingRow.render
		 * @returns {gsc2app.Views.HoleParHeadingRow} Returns this.
		 * @see {@link gsc2app.Views.HoleParHeadingRow.initialize}
		 */
		render: function() {
			this.setElement($(this.el_target));		// Establish access to the desired HTML element in this.el.
			this.$el.html('');						// Start with an empty row.

			// Note: this.model is a gsc2app.Models.Scorecard instance.
			let theHolePars = this.model.getHoleParsCollection();
			// theHolePars will be a gsc2app.Collections.NumberFields instance.
			
			// Column 1
			this.$el.append(this.template({
				'htmlID': 'hole-pars-header', 
				'holePar': 'Par'
			}));

			// Columns 2 through (# of holes) + 1.
			let parTotal = 0;
			for (let n=0; n < theHolePars.length; n++) {
				let element_id = `hole-${ n+1 }-par`;
				let parModel = theHolePars.at(n);
				let thisHolePar = parModel.getValue();
				parTotal += thisHolePar;
				
				// Create the node for this hole's data.
				this.$el.append(this.template({
					'htmlID': element_id, 
					'holePar': ''		// Leave empty because the gsc2app.Views.NumberField class will fill it in.
				}));
				let holeParData = new gsc2app.Views.NumberField({
					'el_target': element_id,
					'model': parModel,
					'base_id': element_id,
					'css_class_div': 'holedata holedata--display holedata__parvalue holedata__parvalue--display',
					'css_class_input': 'holedata holedata--input holedata__parvalue holedata__parvalue--input',
					'enable_highlighting': false,
					'show_zero': true,
					'read_only': false
				});		// This call should render the data into the hole par data area.
			}

			// Column (# of holes) + 2 -- the Total column.
			let theHolesParTotal = this.model.getHolesParTotal();		// theHolesParTotal will be a gsc2app.Models.NumberField object.
			theHolesParTotal.setValue(parTotal);
			let element_id = 'hole-total-par';
			let thisHolePar = theHolesParTotal.getValue();
			this.$el.append(this.template({
				'htmlID': element_id, 
				'holePar': 'Total'		// Leave empty because the gsc2app.Views.NumberField class will fill it in.
			}));
			let totalData = new gsc2app.Views.NumberField({
				'el_target': element_id,
				'model': theHolesParTotal,
				'base_id': element_id,
				'css_class_div': 'holedata holedata--display holedata__parvalue holedata__parvalue--total',
				'enable_highlighting': false,
				'show_zero': true,
				'read_only': true
			});		// This call should render the data into the hole data area.

			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.PlayerRow view renders the row for the n^{th} player, with fields
	 * for the player's name, a score for each hole, and a total score.  It allows the hole
	 * par to be editable.  The constructor function should be called with a single JSON
	 * object with an attribute "model" that is set to an initialized instance of a
	 * gsc2app.Models.Scorecard model.
	 * @example
	 * // Create a new scorecard first.
	 * let modelScorecard = new gsc2app.Models.Scorecard();
	 * let userspaceID = "b32307a1";
	 * // Assumes the collection of course models has been loaded already.
	 * let courseModel = coursesCollection.at(2);   // Select the 3rd course model.
	 * modelScorecard.createScorecard(userspaceID, courseModel);
	 * let holeNumberHeadingRowView = new gsc2app.Views.HoleNumberHeadingRow({model: modelScorecard});
	 * let holeParHeadingRowView = new gsc2app.Views.HoleParHeadingRow({model: modelScorecard});
	 * // Allocate two players.
	 * let newPlayerOptions = {
	 *     elementID: "player-rows-container",      // The HTML tag with this ID will contain the new player row.
	 *     playerNumber: 1,                         // This is player #1.
	 *     model: modelScorecard                    // The model for the current scorecard.
	 * };
	 * let player1 = new gsc2app.Views.PlayerRow(options);
	 * newPlayerOptions = {
	 *     elementID: "player-rows-container",      // The HTML tag with this ID will contain the new player row.
	 *     playerNumber: 2,                         // This is player #2.
	 *     model: modelScorecard                    // The model for the current scorecard.
	 * };
	 * let player2 = new gsc2app.Views.PlayerRow(options);
	 * @class {function} gsc2app.Views.HoleParHeadingRow
	 * @see {@link gsc2app.Models.Scorecard}
	 */
	gsc2app.Views.PlayerRow = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.PlayerRow", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		// This view needs to be generated with an instance of a gsc2app.Models.Scorecard model.
		// This view shows the n^{th} player's hole scores, and allows them to be editable.

		/**
		 * @property {string} gsc2app.Views.PlayerRow.el_target - The HTML parent element
		 * using an ID attribute that will be set dynamically.
		 */
		el_target: '',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {object} gsc2app.Views.PlayerRow.el - This will be initialized to the
		 * jQuery object corresonding to the HTML ID set in gsc2app.Views.PlayerRow.el_target.
		 * @see {@link gsc2app.Views.PlayerRow.el_target}
		 */
		el: {},		// Delay the instantiation of this cached jQuery element because it doesn't exist initially.

		/**
		 * @property {gsc2app.Models.Scorecard} gsc2app.Views.PlayerRow.model - This will be
		 * set to the scorecard model object for the current scorecard.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Scorecard", 'tonodename':"gsc2app.Views.PlayerRow", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {string} gsc2app.Views.PlayerRow.childID - This will be initialized to
		 * be the HTML ID for the player row container.  It should not contain the leading
		 * "#" character for the jQuery reference.
		 */
		childID: '',

		/**
		 * @property {number} gsc2app.Views.PlayerRow.playerNumber - This will be initialized
		 * to be the 1-based number for this player.  1 is the first player, 2 is the second
		 * player, etc.
		 */
		playerNumber: 0,

		/**
		 * @property {string} gsc2app.Views.PlayerRow.container_el - The jQuery selector for
		 * the HTML ID that will be master container for all player rows.
		 */
		container_el: '#player-rows-container',

		/**
		 * @property {string} gsc2app.Views.PlayerRow.playerNameViewCellHtmlID - This will be
		 * set to the HTML ID for the view that contains the player name.
		 */
		playerNameViewCellHtmlID: '',

		// Define the template view code.  This uses UnderscoreJS.

		// Template parameters:
		//		htmlID				The HTML ID for the table cell.
		/**
		 * @property {function} gsc2app.Views.PlayerRow.templateRow - The UnderscoreJS
		 * object with the HTML for the row that will contain the views for the player
		 * name, hole scores, and total score.
		 */
		templateRow: _.template('<tr id="<%= htmlID %>"></tr>'),

		// Template parameters:
		//		htmlID				The HTML ID for the table cell.
		/**
		 * @property {function} gsc2app.Views.PlayerRow.templatePlayerName - The UnderscoreJS
		 * object with the HTML that will contain the view for the player name.
		 */
		templatePlayerName: _.template('<td id="<%= htmlID %>" class="scorecarddata__heading scorecardheadingcolumn"></td>'),

		// Template parameters:
		//		htmlID				The HTML ID for the table cell.
		/**
		 * @property {function} gsc2app.Views.PlayerRow.templatePlayerHole - The UnderscoreJS
		 * object with the HTML that will contain the view for the score for one hole.
		 */
		templatePlayerHole: _.template('<td id="<%= htmlID %>" class="holedatacontainer"></td>'),

		// Template parameters:
		//		htmlID				The HTML ID for the table cell.
		/**
		 * @property {function} gsc2app.Views.PlayerRow.templatePlayerTotal - The UnderscoreJS
		 * object with the HTML that will contain the view for the total score for the player.
		 */
		templatePlayerTotal: _.template('<td id="<%= htmlID %>" class="holedatacontainer--total"></td>'),

		/**
		 * Initialize the gsc2app.Views.PlayerRow view using the options given, and then renders
		 * it.  Note that this function will be called by the BackboneJS framework.  It is not
		 * intended to be called directly.  The options may be specified as a single argument to
		 * the view's constructor function.  See the constructor function for an example.
		 * @param {number} options - An object with the option values to control this view.
		 * @param {string} options.elementID - The HTML ID for the node/tag that will contain
		 * this player row view.
		 * @param {number} options.playerNumber - The 1-based number of the player.  1 = player #1,
		 * 2 = player #2, etc.
		 * @param {gsc2app.Models.Scorecard} options.model - An instance of a gsc2app.Models.Scorecard
		 * object.
		 * @param {string} options.childID - Will be set to the HTML ID for the player row view.
		 * @param {string} options.playerNameViewCellHtmlID - Will be set to the HTML ID for the
		 * player name view.
		 * @member {function} gsc2app.Views.PlayerRow.initialize
		 * @see {@link gsc2app.Views.PlayerRow}
		 * @see {@link gsc2app.Views.PlayerRow.render}
		 */
		initialize: function(options) {
			// These are the options that the caller needs to specify.
			this.el_target = '#' + options.elementID;
			this.playerNumber = options.playerNumber;
			this.model = options.model;
			// Initialize the computed attribute values.
			this.childID = 'player-row-' + this.playerNumber;
			this.playerNameViewCellHtmlID = 'player-name-' + this.playerNumber + '-cell';
			this.render();
		},

		/**
		 * Render the gsc2app.Views.PlayerRow view.  Usually called by the
		 * gsc2app.Views.PlayerRow.initialize function.
		 * @member {function} gsc2app.Views.PlayerRow.render
		 * @returns {gsc2app.Views.PlayerRow} Returns this.
		 * @see {@link gsc2app.Views.PlayerRow.initialize}
		 */
		render: function() {
			// Start by appending an empty row for this player.
			this.setElement($(this.el_target));		// Connect to the jQuery object and re-establish the cache.
			this.$el.append(this.templateRow({
				'htmlID': this.childID
			}));

			// Then switch the reference tag for this view to be this row.
			this.setElement($('#' + this.childID));	// Connect to the jQuery object and re-establish the cache.

			// Then append the cell for the player name.
			this.$el.append(this.templatePlayerName({
				'htmlID': this.playerNameViewCellHtmlID
			}));
			let playerModel = this.model.getPlayerModel(this.playerNumber);
			/*
			let playerNameView = new gsc2app.Views.PlayerName({
				'htmlContainerID': this.playerNameViewCellHtmlID,
				'playerNumber': this.playerNumber,
				'model': playerModel
			});
			*/
			let playerNameView = new gsc2app.Views.StringField({
				'el_target': this.playerNameViewCellHtmlID,
				'model': playerModel.getPlayerNameFieldModel(),
				'base_id': `id-player${ this.playerNumber }-name`,
				'css_class_div': 'scorecardheadingcolumn__playername--display',
				'css_class_input': 'scorecardheadingcolumn__playername--input',
				'hint': 'Enter player name',
				'placeholder': 'Player ' + this.playerNumber,
	 			'read_only': false
			});

			// Now add the view for the individual hole scores.
			let playerHoleScores = playerModel.getHoleScores();		// This is a gsc2app.Collections.NumberFields object.

			for (let n=0; n < playerHoleScores.length; n++) {
				// Now append the cell for this hole.
				let playerHoleViewCellHtmlID = 'player-' + this.playerNumber + '-hole-' + (n+1);
				this.$el.append(this.templatePlayerHole({
					'htmlID': playerHoleViewCellHtmlID,
				}));

				// Now create the view for this particular hole in the cell.
				let thisHoleModel = playerHoleScores.at(n);
				let holeData = new gsc2app.Views.NumberField({
					'el_target': playerHoleViewCellHtmlID,
					'model': thisHoleModel,
					'base_id': playerHoleViewCellHtmlID,
					'css_class_div': 'holedata holedata--display holedata__scorevalue holedata__scorevalue--display',
					'css_class_input': 'holedata holedata--input holedata__scorevalue holedata__scorevalue--input',
					'enable_highlighting': true,
					'show_zero': false,
					'read_only': false
				});		// This call should render the data into the hole data area.
			}

			// Finally, append the total cell for this player.
			let playerTotalViewCellHtmlID = 'player-' + this.playerNumber + '-total';
			this.$el.append(this.templatePlayerTotal({
				'htmlID': playerTotalViewCellHtmlID
			}));
			let playerTotalScoreModel = playerModel.getTotalScore();		// This a gsc2app.Models.NumberField object.
			let holeData = new gsc2app.Views.NumberField({
				'el_target': playerTotalViewCellHtmlID,
				'model': playerTotalScoreModel,
				'base_id': playerTotalViewCellHtmlID,
				'css_class_div': 'holedata holedata--display holedata__scorevalue holedata__scorevalue--total',
				'enable_highlighting': false,
				'show_zero': true,
				'read_only': true
			});		// This call should render the data into the total score data area.

			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event handler for processing the button click to add a new player to the scorecard.
	 * @param {event} evt - The event data for when the add-player button is clicked.
	 */
	gsc2app.Views.processAddPlayerHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processAddPlayerHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		evt.stopPropagation();
		if (gsc2app.State.activeScorecard) {
			// Add a new player to the scorecard.
			gsc2app.State.activeScorecard.addNewPlayer();

			// Update the corresponding views.
			gsc2app.State.scorecardDataViewInstance.render();
			gsc2app.State.scorecardStatsViewInstance.render();
	
			if (gsc2app.State.activeScorecard.getNumPlayers() > 1) {
				// Finally, enable the remove-player button since we have more than one player.
				$('#scorecardform-removeplayerbutton').prop('disabled', false);
			} else {
				// There is only one player on the scorecard, so keep the remove-player
				// button disabled.
				$('#scorecardform-removeplayerbutton').prop('disabled', true);
			}
		}
	};

	/**
	 * Event handler for processing the button click to remove the last player that was
	 * added to the scorecard.
	 * @param {event} evt - The event data for when the remove-player button is clicked.
	 */
	gsc2app.Views.processRemovePlayerHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processRemovePlayerHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		evt.stopPropagation();
		if (gsc2app.State.activeScorecard) {
			let numPlayers = gsc2app.State.activeScorecard.getNumPlayers();
			if (numPlayers > 1) {
				let lastPlayerModel = gsc2app.State.activeScorecard.getPlayerModel(numPlayers);
				let lastPlayerName = lastPlayerModel.getPlayerName();
				if (lastPlayerName === '') {
					lastPlayerName = 'Player ' + numPlayers;
				}
				if (confirm(`Are you sure you want to remove player "${ lastPlayerName }"?`)) {
					// Remove the last player in the list of players on the scorecard.
					gsc2app.State.activeScorecard.removeLastPlayer();

					// Update the corresponding views.
					gsc2app.State.scorecardDataViewInstance.render();
					gsc2app.State.scorecardStatsViewInstance.render();

					if (gsc2app.State.activeScorecard.getNumPlayers() > 1) {
						// Enable the remove-player button since we have more than one player.
						$('#scorecardform-removeplayerbutton').prop('disabled', false);
					} else {
						// Disable the remove-player button since there is only one player let.
						$('#scorecardform-removeplayerbutton').prop('disabled', true);
					}
				}
			} else {
				// There is only one player on the scorecard, so keep the remove-player
				// button disabled.
				$('#scorecardform-removeplayerbutton').prop('disabled', true);
			}
		}
	};

	/**
	 * Function to show an HTML-formatted message in the save-status area of the scorecard.
	 * It is expected the message will be very short.
	 * @example
	 * gsc2app.Views.showSaveStatus('<span class="makebold">Saved!</span>');
	 * @param {string} htmlMessage - A string with optional HTML tags for the message to
	 * show in the save-status area of the scorecard.
	 */
	gsc2app.Views.showSaveStatus = function(htmlMessage) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.showSaveStatus", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		if (!htmlMessage) {
			htmlMessage = '';
		}
		$('#scorecardstatus_area').html(htmlMessage);
	};

	/**
	 * Function to clear the save-status area of the scorecard.
	 * @example
	 * gsc2app.Views.clearSaveStatus();
	 */
	gsc2app.Views.clearSaveStatus = function() {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.clearSaveStatus", 'nodetype':"function", 'group':"gsc2app.Views", 'datatype':"node"}
		$('#scorecardstatus_area').html('');
	};

	/**
	 * Event handler for processing the button click to save the scorecard.
	 * @param {event} evt - The event data for when the save-player button is clicked.
	 */
	gsc2app.Views.processSaveScorecardHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processSaveScorecardHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		evt.stopPropagation();
		if (gsc2app.State.activeScorecard) {
			let scorecardJSON = JSON.stringify(gsc2app.State.activeScorecard);
			gsc2app.ServerAPI.saveScorecard(scorecardJSON, gsc2app.State.activeScorecard.getScorecardID());
		}
	};

	/**
	 * Event handler for when the user ends updating the notes area on the scorecard.
	 * @param {event} evt - The event data for when the notes area is blurred.
	 */
	gsc2app.Views.processNotesBlurHandler = function(evt) {
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.processNotesBlurHandler", 'nodetype':"eventhandler", 'group':"gsc2app.Views", 'datatype':"node"}
		evt.stopPropagation();
		gsc2app.Views.clearSaveStatus();
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.ScorecardData view renders the scorecard for all players.  The
	 * constructor function should be called with a single JSON object with an attribute
	 * "model" that is set to an initialized instance of a gsc2app.Models.Scorecard model.
	 * @example
	 * // Create a new scorecard.
	 * let modelScorecard = new gsc2app.Models.Scorecard();
	 * let activeScorecard = new gsc2app.Views.ScorecardData({model: modelScorecard});
	 * @class {function} gsc2app.Views.ScorecardData
	 * @see {@link gsc2app.Models.Scorecard}
	 */
    gsc2app.Views.ScorecardData = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.ScorecardData", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		// This view shows who active scorecard for all players and their scores.
		/**
		 * @property {object} gsc2app.Views.ScorecardData.el - The jQuery object corresponding to
		 * the HTML parent ID for this view.
		 */
		el: $('#active-scorecarddata-container'),	// This is the default HTML parent element using an ID attribute.
		
		/**
		 * @property {gsc2app.Models.Scorecard} gsc2app.Views.ScorecardData.model - An instance
		 * of a gsc2app.Models.Scorecard object that stores the scorecard information.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Scorecard", 'tonodename':"gsc2app.Views.ScorecardData", 'datatype':"edge", 'edgetype':"normal"}

		// Template parameters:
		//		courseNotesColSpan		The number of table columns over which the notes area should
		//								span.  Typically equal to the number of holes on the course,
		//								plus one for the Total column.  Example: 19
		//		notesAreaRows			The number of rows in the notes area.  Typically set to 2.
		//		notesAreaCols			The number of character columns that the notes area should
		//								have.  For an 18-hole course, this is typically 72 columns.
		//		notes					The string with the notes to set.  This is usually an empty
		//								string for a new scorecard.
		//		scorecardIDColSpan		The number of table columns that the scorecard ID should span.
		//								Typically set to all columns, which is 20 for an 18-hole
		//								course.
		//		scorecardID				The scorecard ID string to display.
		/**
		 * @property {function} gsc2app.Views.ScorecardData.template - The UnderscoreJS
		 * object with the HTML that will contain the view for the entire scorecard for
		 * all players.
		 */
		template: _.template(
			'<form> \
			  <table id="active-scorecard-data" class="logicalpagecontainer logicalpagecontainer__scorecarddata"> \
				<thead> \
				  <tr id="hole-labels-row" class="scorecarddata scorecarddata__holenumbers"></tr> \
				  <tr id="hole-pars-row" class="scorecarddata scorecarddata__holepars"></tr> \
				</thead> \
				<tfoot> \
				  <tr id="coursecommands_rowcontainer" class="coursecommands"> \
					<td class="coursecommands__playerops"> \
					  <div> \
						<input id="scorecardform-addplayerbutton" type="button" value="&plus; Player" class="mybutton mybutton__playerops mybutton__playerops--add"> \
						<input id="scorecardform-removeplayerbutton" type="button" value="&minus; Player" class="mybutton mybutton__playerops mybutton__playerops--remove" disabled> \
					  </div> \
					</td> \
					<td colspan="<%= courseNotesColSpan - 1 %>"  class="coursecommands__saveops"> \
					   <input id="scorecardform-savebutton" type="button" value="Save" class="mybutton mybutton__save"> \
					</td> \
					<td id="scorecardstatus_container"  class="coursecommands__saveops--status"> \
					  <div id="scorecardstatus_area"></div> \
					</td> \
				  </tr> \
				  <tr id="coursenotes-rowcontainer"> \
					<td class="coursenotes coursenotes__label"> \
					  <label for="course-notes">Notes</label> \
					</td> \
					<td class="coursenotes coursenotes__inputarea" colspan="<%= courseNotesColSpan %>"> \
					  <textarea id="course-notes-input" class="coursenotes__inputarea--input" \
						rows="<%= notesAreaRows %>" cols="<%= notesAreaCols %>" \
						placeholder="Enter any memorable thoughts about the course or round." \
						title="Enter any memorable thoughts about the course or round."><%= notes %></textarea> \
					</td> \
				  </tr> \
				  <tr class="scorecardinfocontainer"> \
					<td class="scorecardinfocontainer__scorecardid" colspan="<%= scorecardIDColSpan %>" title="Scorecard ID"> \
					  <span class="scorecardinfocontainer__scorecardid--label">Scorecard ID:</span> \
					  <%= scorecardID %> \
					</td> \
				  </tr> \
				</tfoot> \
				<tbody id="player-rows-container"></tbody> \
			  </table> \
			</form>'
		),

		/**
		 * Initialize a newly created gsc2app.Views.ScorecardData view object.  Automatically
		 * called as part of the constructor operation.  Assumes the model object has been
		 * set already by the BackboneJS framework.
		 * @member {function} gsc2app.Views.ScorecardData.initialize
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render this gsc2app.Views.ScorecardData view object into the target HTML ID container
		 * tag.  Automatically called as part of the gsc2app.Views.ScorecardData.initialize()
		 * function.
		 * @member {function} gsc2app.Views.ScorecardData.render
		 * @returns {this} Returns this.
		 * @see {@link gsc2app.Views.ScorecardData.initialize}
		 */
		render: function() {
			// First create the skeleton.
			let numHoles = this.model.getNumHoles();
			this.$el.html(this.template({
				'courseNotesColSpan': numHoles + 1,		// The +1 is for the Total column.
				'scorecardIDColSpan': numHoles + 2,		// The +2 is for the Total column and the Heading column (first column).
				'scorecardID': this.model.getScorecardID(),
				'notesAreaRows': 2 + (numHoles < 18 ? 1 : 0) + (numHoles <= 9 ? 1 : 0),
				'notesAreaCols': numHoles * 4,			// Use a factor of 4 character columns per hole column.
				'notes': this.model.getNotes()
			}));

			// Now populate the rows.  The hole heading row is first.
			// Note that this.model will be a gsc2app.Models.Scorecard instance.
			gsc2app.State.holeNumberHeadingRowViewInstance = new gsc2app.Views.HoleNumberHeadingRow({model: this.model});
			
			// The hole pars row is second.
			gsc2app.State.holeParHeadingRowViewInstance = new gsc2app.Views.HoleParHeadingRow({model: this.model});

			// Now for the player rows.  The this.model is an instance of the
			// gsc2app.Models.Scorecard model.  The resulting playerCollection object will
			// be an instance of a gsc2app.Collections.Players object.
			let playerCollection = this.model.getPlayersCollection();

			let courseModel = this.model.getCourseModel();			// This is a gsc2app.Model.Course object.
			let courseParsArray = courseModel.getCourseHolePars();	// This is an array of integers corresponding to the hole pars.

			// Save the player row views in a state array.
			gsc2app.State.playerDataRowCollectionInstance = [];
			for (let n=0; n < playerCollection.length; n++) {
				let newPlayerOptions = {
					'elementID': 'player-rows-container',
					'playerNumber': n+1,
					'model': this.model
				};
				let thisPlayerRowView = new gsc2app.Views.PlayerRow(newPlayerOptions);
				gsc2app.State.playerDataRowCollectionInstance.push(thisPlayerRowView);
			}

			// Set the button handlers.
			$('#scorecardform-addplayerbutton').click(gsc2app.Views.processAddPlayerHandler);
			$('#scorecardform-removeplayerbutton').click(gsc2app.Views.processRemovePlayerHandler);
			$('#scorecardform-savebutton').click(gsc2app.Views.processSaveScorecardHandler);
			$('#course-notes-input').blur(gsc2app.Views.processNotesBlurHandler);

			return this;
		}
	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The gsc2app.Views.ScorecardStats view renders the scorecard statistics area for
	 * all players.  The constructor function should be called with a single JSON object
	 * with an attribute "model" that is set to an initialized instance of a
	 * gsc2app.Models.Scorecard model.
	 * @example
	 * // Create a new scorecard.
	 * let modelScorecard = new gsc2app.Models.Scorecard();
	 * let activeScorecard = new gsc2app.Views.ScorecardStats({model: modelScorecard});
	 * @class {function} gsc2app.Views.ScorecardStats
	 * @see {@link gsc2app.Models.Scorecard}
	 */
    gsc2app.Views.ScorecardStats = Backbone.View.extend({
		//@@graph{'graphid':"softarch1", 'nodename':"gsc2app.Views.ScorecardStats", 'nodetype':"class", 'group':"gsc2app.Views", 'datatype':"node"}
		// This view shows who active scorecard statistics for all players.
		/**
		 * @property {object} gsc2app.Views.ScorecardData.el - The jQuery object corresponding to
		 * the HTML parent ID for this view.
		 */
		el: '',		// This is the default HTML parent element using an ID attribute.

		/**
		 * @property {gsc2app.Models.Scorecard} gsc2app.Views.ScorecardData.model - An instance
		 * of a gsc2app.Models.Scorecard object that stores the scorecard information.
		 */
		model: {},
		//@@graph{'graphid':"softarch1", 'fromnodename':"gsc2app.Models.Scorecard", 'tonodename':"gsc2app.Views.ScorecardStats", 'datatype':"edge", 'edgetype':"normal"}

		/**
		 * @property {function} gsc2app.Views.ScorecardData.templateTable - The UnderscoreJS
		 * object with the HTML that will contain the view for the entire scorecard stats
		 * area for all players.
		 */
		templateTable: _.template(
			'<table id="active-scorecard-stats" class="logicalpagecontainer logicalpagecontainer__scorecardstats"> \
			  <thead> \
				<tr id="stats-title-row" class="scorecardstats scorecardstats__titlerow"> \
				  <td colspan="8">Statistic: &nbsp; Hole Counts</td> \
				</tr> \
				<tr id="stats-labels-row" class="scorecardstats scorecardstats__statnames"> \
				  <td class="scorecardstats scorecardstats__heading">Player Name</td> \
				  <td class="scorecardstats scorecardstats__statnames">Aces<br/>( 1 )</td> \
				  <td class="scorecardstats scorecardstats__statnames">Eagles&nbsp;&DownTeeArrow;<br/>( &le; &minus;2 )</td> \
				  <td class="scorecardstats scorecardstats__statnames">Birdies<br/>( &minus;1 )</td> \
				  <td class="scorecardstats scorecardstats__statnames">Pars<br/>( &plus;0 )</td> \
				  <td class="scorecardstats scorecardstats__statnames">Bogeys<br/>( &plus;1 )</td> \
				  <td class="scorecardstats scorecardstats__statnames">Bogey2s<br/>( &plus;2 )</td> \
				  <td class="scorecardstats scorecardstats__statnames">Bogey3s&nbsp;&UpTeeArrow;<br/>( &ge; &plus;3 )</td> \
				</tr> \
			  </thead> \
			  <tfoot></tfoot> \
			  <tbody id="stats-rows-container"></tbody> \
			</table>'
		),

		// Template parameters:
		//		htmlID_Row				The HTML ID for this row for the player's statistics.
		//		htmlID_PlayerName		The HTML ID for the player's name field.
		//		htmlID_ScoreAces		The HTML ID for the player's aces statistic field.
		//		htmlID_ScoreEagles		The HTML ID for the player's eagles (or better) statistic field.
		//		htmlID_ScoreBirdies		The HTML ID for the player's birdies statistic field.
		//		htmlID_ScorePars		The HTML ID for the player's pars statistic field.
		//		htmlID_ScoreBogeys		The HTML ID for the player's bogeys statistic field.
		//		htmlID_ScoreBogey2s		The HTML ID for the player's double bogeys statistic field.
		//		htmlID_ScoreBogey3s		The HTML ID for the player's triple bogeys (or worse) statistic field.
		//		data_PlayerName			The player name to display.
		/**
		 * @property {function} gsc2app.Views.PlayerRow.templatePlayerStatsRow - The
		 * UnderscoreJS object with the HTML that will contain the view with all of the
		 * statistics fields for the player.
		 */
		templatePlayerStatsRow: _.template(
			'<tr id="<%= htmlID_Row %>" class="scorecardstats scorecardstats__playerrow"> \
			  <td id="<%= htmlID_PlayerName %>" class="scorecardstats scorecardstats__heading scorecardstats__playername"> \
				<%= data_PlayerName %> \
			  </td> \
			  <td id="<%= htmlID_ScoreAces %>" class="scorecardstats scorecardstats__statvalues"></td> \
			  <td id="<%= htmlID_ScoreEagles %>" class="scorecardstats scorecardstats__statvalues"></td> \
			  <td id="<%= htmlID_ScoreBirdies %>" class="scorecardstats scorecardstats__statvalues"></td> \
			  <td id="<%= htmlID_ScorePars %>" class="scorecardstats scorecardstats__statvalues"></td> \
			  <td id="<%= htmlID_ScoreBogeys %>" class="scorecardstats scorecardstats__statvalues"></td> \
			  <td id="<%= htmlID_ScoreBogey2s %>" class="scorecardstats scorecardstats__statvalues"></td> \
			  <td id="<%= htmlID_ScoreBogey3s %>" class="scorecardstats scorecardstats__statvalues"></td> \
			</tr>'
		),

		/**
		 * Initialize a newly created gsc2app.Views.ScorecardStats view object.  Automatically
		 * called as part of the constructor operation.  Assumes the model object has been
		 * set already by the BackboneJS framework.
		 * @member {function} gsc2app.Views.ScorecardStats.initialize
		 */
		initialize: function() {
			this.render();
		},

		/**
		 * Render a statistic field.  Used by the gsc2app.Views.ScorecardStats.render() function.
		 * @param {gsc2app.Models.PlayerStats} playerStats - The gsc2app.Models.PlayerStats object
		 * from the gsc2app.Models.Player model object.  The gsc2app.Models.PlayerStats object
		 * contains all of the statistics for this player.
		 * @param {gsc2app.Models.ScoreRankingsEnum} statName - The gsc2app.Models.ScoreRankingsEnum
		 * identifier to identify which statistic this field is.
		 * @param {string} htmlContainerID - The HTML ID attribute for the element that will
		 * contain this field.
		 * @member {function} gsc2app.Views.ScorecardStats.renderStatField
		 * @returns {this} Returns this.
		 */
		renderStatField: function(playerStats, statName, htmlContainerID) {
			if (playerStats) {
				let statAces = playerStats.getStatFieldModel(statName);
				// statAces will be a gsc2app.Models.OneStat object.
				if (statAces) {
					let statAcesFieldModel = statAces.getStatFieldModel();
					// statAcesFieldModel will be a gsc2app.Models.NumberField object.
					let statValue = statAcesFieldModel.getValue();		// Numeric value here.
					let cssDisplay = 'scorecardstats scorecardstats__statvalues scorecardstats__statvalues--display';
					if (statValue > 0) {
						cssDisplay += ' ' + gsc2app.Views.getCssFromRankLevel(statName);
					}
					let statAcesView = new gsc2app.Views.NumberField({
						'el_target': htmlContainerID,
						'model': statAcesFieldModel,
						'base_id': htmlContainerID + '-value',
						'css_class_div': cssDisplay,
						'enable_highlighting': true,
						'show_zero': false,
						'read_only': true
					});
				}
			}
			return this;
		},

		/**
		 * Render this gsc2app.Views.ScorecardStats view object into the target HTML ID container
		 * tag.  Automatically called as part of the gsc2app.Views.ScorecardStats.initialize()
		 * function.
		 * @member {function} gsc2app.Views.ScorecardStats.render
		 * @returns {this} Returns this.
		 */
		render: function() {
			// First create the skeleton of the view.
			this.setElement($('#active-scorecardstats-container'));		// Connect to the jQuery object and re-establish the cache.
			this.$el.html(this.templateTable());

			// Now for the player statistics rows.  The this.model is an instance of the
			// gsc2app.Models.Scorecard model.  The resulting playerCollection object will
			// be an instance of a gsc2app.Collections.Players object, which contains
			// the statistics collection.
			let playerCollection = this.model.getPlayersCollection();
			for (let n=0; n < playerCollection.length; n++) {
				// First get access to the player for this row.
				let playerModel = playerCollection.at(n);						// A gsc2app.Models.Player object.
				let playerNameModel = playerModel.getPlayerNameFieldModel();	// A gsc2app.Models.StringField object.
				let playerNumber = playerModel.getPlayerNumber();
				let playerStats = playerModel.getPlayerStats();

				// Define the HTML IDs that we need here.
				let htmlID_Row = `stats-row-player-${ playerNumber }`;
				let baseStatsID = `stat-player-${ playerNumber }-`;
				let htmlID_PlayerName = baseStatsID + '1';
				let htmlID_ScoreAces = baseStatsID + '2';
				let htmlID_ScoreEagles = baseStatsID + '3';
				let htmlID_ScoreBirdies = baseStatsID + '4';
				let htmlID_ScorePars = baseStatsID + '5';
				let htmlID_ScoreBogeys = baseStatsID + '6';
				let htmlID_ScoreBogey2s = baseStatsID + '7';
				let htmlID_ScoreBogey3s = baseStatsID + '8';

				// Render the HTML elements for the component field views.
				this.setElement($('#stats-rows-container'));		// Connect to the jQuery object and re-establish the cache.
				this.$el.append(this.templatePlayerStatsRow({
					'htmlID_Row': htmlID_Row,
					'htmlID_PlayerName': htmlID_PlayerName,
					'htmlID_ScoreAces': htmlID_ScoreAces,
					'htmlID_ScoreEagles': htmlID_ScoreEagles,
					'htmlID_ScoreBirdies': htmlID_ScoreBirdies,
					'htmlID_ScorePars': htmlID_ScorePars,
					'htmlID_ScoreBogeys': htmlID_ScoreBogeys,
					'htmlID_ScoreBogey2s': htmlID_ScoreBogey2s,
					'htmlID_ScoreBogey3s': htmlID_ScoreBogey3s,
					'data_PlayerName': playerModel.getPlayerName()
				}));

				// Now render each field element in turn and populate it.
				// Start with the player name.
				let playerNameView = new gsc2app.Views.StringField({
					'el_target': htmlID_PlayerName,
					'model': playerNameModel,
					'base_id': 'id-stat-player-name',		// Base HTML ID for the element that will comprise this field view.
					'css_class_div': 'scorecardstats scorecardstats__playername scorecardstats__playername--display',
					'read_only': true,
					'placeholder': 'Player ' + playerNumber
				});

				// Now create the views for each statistics field.
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.HOLE_IN_ONE, htmlID_ScoreAces);
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.TWO_UNDER_OR_BETTER, htmlID_ScoreEagles);
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.ONE_UNDER, htmlID_ScoreBirdies);
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.EVEN, htmlID_ScorePars);
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.ONE_OVER, htmlID_ScoreBogeys);
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.TWO_OVER, htmlID_ScoreBogey2s);
				this.renderStatField(playerStats, gsc2app.Models.ScoreRankingsEnum.THREE_OVER_OR_WORSE, htmlID_ScoreBogey3s);
			}
			return this;
		}
	});

})();
