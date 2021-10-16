/**
 * @file Overview documentation for the GolfScorecard2 (gsc2app) web application.
 * This file does not contain any executable JavaScript code.  It is purely
 * for overview/overall documentation of the other files.  It does not
 * need to be included on the actual HTML web page for the golf scorecard
 * application.
 * <br><br>
 * An overview of the JavaScript software architecture for gsc2app is available 
 * <a href="graphs/gsc2app_softarch1.png" alt="Software Architecture Overview">here</a>.
 *
 * @author Jim Kottas
 * @copyright Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.
 * @license MIT
 */

// Conventions:
//      JavaScript lines that begin with /*DEV*/ are for development only and are
//      removed when the production files are built.  There may beleading whitespace
//      before the /*DEV*/.

/*======================================================================================
 * Important Notes:
 *
 * BackboneJS does not support nested backbone models.  There are a few
 * Backbone.DeepModel library extensions which supposedly support nested backbone
 * models, but they didn't work with the gsc2app models.
 * 
 * The backbone.localstorage library works but it saves individual objects based on
 * their cid attribute, and that is not the best way to handle the saving of the
 * golf scorecard data.
 * 
 * The GraphMaker tag @@graph is used within the JavaScript source code to allow for
 * various GraphViz graphs to be generated programmatically.  See the documentation for
 * the @@graph tag in the GraphVizMaker.py script file.
 *======================================================================================*/

// Define the GraphMaker graphs that will be documented in the code.
/*
    @@graph {
        "command": "definition",
        "graphtype": "code",
        "graphid": "softarch1",
        "title": "GSC2App Software Architecture",
        "description": "This graph shows the main functions and classes and how they related.",
        "filenamesuffix": "_softarch1"
    }
*/


/*======================================================================================
 *
 *                          ====== GSC2APP Server API =====
 *
 * The web server for gsc2app is expected to support a RESTful interface, and be
 * configured accordingly.  It must support the following HTTP verbs:  GET, PUT, POST.
 * In addition, the web server must have a URL rewrite rule created that maps the
 * following general URL:
 *      https://gsc2server.com/api/<object-name>/<object-id>
 * 
 * into:
 *      https://gsc2server.com/api/gsc2api.php?type=<object-name>&id=<object-id>
 * 
 * Note that for development, the URLs are:
 *      https://gsc2server.com/api/<object-name>/<object-id>
 * and
 *      https://gsc2server.com/api/gsc2api.php?type=<object-name>&id=<object-id>
 * 
 * For example, if the web server is hosted locally on port 8443, the URL:
 *      https://localhost:8443/api/scorecard/15ee1cfb_20201221_224516348_445649
 * 
 * must be mapped to:
 *      https://localhost:8443/api/gsc2api.php?type=scorecard&id=15ee1cfb_20201221_224516348_445649
 * 
 * The HTTP verb will indicate what action is being requested.  For example, an
 * HTTP GET request using the example scorecard URL will retrieve the data for the
 * scorecard with a scorecard ID equal to "15ee1cfb_20201221_224516348_445649" in a
 * JSON format.
 * 
 * On the other hand, if the HTTP verb is PUT, the request will expect to receive
 * scorecard data in a JSON format that it will save under the specified scorecard
 * ID.
 * 
 *  
 *                      ===== Windows IIS Configuration Notes =====
 * 
 * After PHP is installed and configured for FastCGI, the HTTP PUT verb needs to be
 * enabled under Handler Mappings.  Edit the handler PHP_via_FastCGI, click on the
 * "Request Restrictions..." button, and on the Verbs tab, make sure PUT is allowed.
 * If not, add it to the list of allowed verbs (if all verbs are not allowed).
 * 
 * The remaining configuration notes for IIS assume the development configuration.
 * 
 * Create a virtual directory called DevGolfScorecard2 and have it point to
 * "C:\Home\Jim\GitProjects\GolfScorecard2\src".  This means the development form of
 * the Golf Scorecard 2 will be available at https://localhost/DevGolfScorecard2/main.html.
 * Make sure to enable TLS/SSL, even on localhost.
 * 
 * For production testing, create another virtual directory called GolfScorecard2 and have
 * it point to "C:\Home\Jim\GitProjects\GolfScorecard2\out\dist".  This means the production
 * form of the Golf Scorecard 2 will be available at https://localhost/GolfScorecard2/main.html.
 * Make sure to enable TLS/SSL again, even on localhost.
 * 
 * Enable daily logging for both virtual directories in the Logging module.  Enable all
 * fields except for Cookie and Referrer.
 * 
 * Configure the IIS URL Rewrite module for both virtual directories to allow for RESTful
 * URLs to be used for the server-side API calls used for development.  To do this, create
 * a new URL Rewrite Inbound Rule with the following settings:
 *      Name:                           GSC2API Rewriter
 *      Match URL
 *          Requested URL:              Matches the Pattern
 *          Using:                      Regular Expressions
 *          Pattern:                    ^api/([^/]+)/([^/]+)/?$
 *          Ignore case:                checked
 *          Test pattern with:          api/scorecard/15ee1cfb_20201221_224516348_445649
 *      Conditions
 *          Logical Grouping:           Match All
 *              #1
 *                  Input:              {REQUEST_FILENAME}
 *                  Type:               Is Not a File
 *                  Pattern:            N/A
 *              #2
 *                  Input:              {REQUEST_FILENAME}
 *                  Type:               Is Not a Directory
 *                  Pattern:            N/A
 *          Track capture groups
 *          across conditions:          unchecked
 *      Server Variables
 *          (none)
 *      Action
 *          Action Type:                Rewrite
 *          Action Properties
 *              Rewrite URL:            api/gsc2api.php?type={R:1}&id={R:2}
 *              Append query string:    checked
 *              Log rewritten URL:      checked
 *          Stop processing of
 *          subsequent rules:           checked
 * 
 * 
 *                      ===== Apache .htaccess Configuration Notes =====
 * 
 * The Apache web server can be configured for the RESTful URL calls by adding the
 * following lines to the .htaccess file in the root directory of the web site:
 * 
 *      RewriteEngine On
 *      RewriteRule ^api/([^/]+)/([^/]+)/?$ api/gsc2api.php?type=$1&id=$2 [NC,L]
 *      # If the request is a file, folder or symlink that exists, serve it up.
 *      RewriteCond %{REQUEST_FILENAME} -f [OR]
 *      RewriteCond %{REQUEST_FILENAME} -d
 *      RewriteRule ^ - [L]
 * 
 ======================================================================================*/

/*
 * Tools needed to build this web application:
 *
 *      NodeJS
 *      The following NodeJS apps:
 *          JSDoc
 *          JSHint
 *          UglifyCSS
 *          UglifyJS
 * 
 *      GraphViz
 * 
 *      Python 3.8 or later
 * 
 *      Standard Linux commands:
 *          grep
 *          sed
 */
