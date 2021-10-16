<?php
/*======================================================================================

                ===== Golf Scorecard 2 Server API (GSC2API) =====

The GSC2API is a REST API which implements the server-side functions for the Golf Scorecard
version 2.  The general form for the REST API is:
        https://gsc2server.com/api/<object-name>/<object-id>

The web server must be configured to transform the REST URL into a traditional URL of the
form:
        https://gsc2server.com/api/gsc2api.php?type=<object-name>&id=<object-id>

The possible <object-name> values are as follows.  The corresponding HTTP verbs are shown
as well:

    courses         For saving (PUT) and retrieving (GET) golf course lists associated
                    with a user.  The <object-id> should be a userspace ID.  Example URL:
                            https://gsc2server.com/api/courses/15ee1cfb

    scorecard       For saving (PUT) and retrieving (GET) individual scorecards.  The
                    <object-id> should be a scorecard ID string.  Example URL:
                            https://gsc2server.com/api/scorecard/15ee1cfb_20201221_224516348_445649

    scorecards      For retrieving (GET) the list of available scorecards for a user.
                    The <object-id> should be a userspace ID.  Example URL:
                            https://gsc2server.com/api/scorecards/15ee1cfb

The key arguments are available in the following PHP variables:

    $_SERVER['REQUEST_METHOD']      Contains the HTTP verb GET or PUT.
    $_REQUEST['type']               Contains the <object-name>.
    $_REQUEST['id']                 Contains the <object-id>.

GSC2API Version 0.1.0 1/1/2021
Copyright (c) 2020-2021 Jim & Joel Kottas.  All rights reserved.

======================================================================================*/

// Prepare the JSON response output that will be returned to the caller.
header("Content-Type: application/json");

// The $response variable will be used to generate the final JSON output that is
// returned in the response.
$response = array(
    'status' => 'Unknown',      // Will be one of: 'Unknown', 'Success', 'Error'
    'message' => '',            // If 'status' => 'Error', this is the error message.  Otherwise, it can be an informative message.
    'data' => '',               // If 'status' => 'Success', this is the data that was requested.
    'id' => ''                  // The object ID for this the operation requested.
);

// Default to an HTTP "400 Bad Request" status code .
$last_code = http_response_code(400);

//
// Now define utility and support functions to assist with the work here.
//

// The setResponseOutputs() function saves the specified output fields in the
// $response array.
function setResponseOutputs(
    $httpStatusCode/*integer*/,
    $statusResult/*boolean*/,
    $message/*string*/,
    $responseData/*string*/,
    $id = ''/*string*/)
{
    global $response;
    $last_code = http_response_code($httpStatusCode);
    $last_id = $response['id'];
    $response = array(
        'status' => ($statusResult ? 'Success' : 'Error'),
        'message' => $message,
        'data' => $responseData,
        'id' => ($id !== '' ? $id : $last_id)
    );
}

// The isValidID() function returns true if $id is valid, otherwise false if it
// has suspicious characters.
function isValidID($id) {
    if (!$id || preg_match('/[^a-zA-Z0-9_]/', $id) === 1) {
        // The ID is null, empty, or it contains an invalid character.
        return false;
    }
    // These checks probably aren't necessary, but they shouldn't hurt, and they
    // help check that the data ends up in the correct directory.
    if (strstr($id, ".") !== false || strstr($id, "/") !== false) {
        // The IDs should never have a "." or a "/" character in them.
        return false;
    }
    // This ID is valid enough.
    return true;
}

// The saveDiagnosticOutput() function writes the contents of the given variable
// to the diagnostic output file, appending the results to the file.
function saveDiagnosticOutput($varname/*string*/, $var, $context='') {
    $file = null;
    $diagnostic_dir = './tmp';
    try {
        if (file_exists($diagnostic_dir) && is_dir($diagnostic_dir)) {
            $file = fopen("$diagnostic_dir/php_diagnostic_output.txt", "a");
            fwrite($file, "\n");
            if ($context !== '') {
                fwrite($file, "Context: $context\n");
            }
            fwrite($file, "Variable '$varname':\n");
            $var_string_export = var_export($var, true);
            fwrite($file, $var_string_export);
            fwrite($file, "\n");
        }
    }
    catch (Exception $e) {
        // For now, ignore errors when writing diagnostic output.
    }
    finally {
        if (!is_null($file)) {
            fclose($file);
        }
    }
}

// The getScorecard() function returns to the caller the JSON for the scorecard
// corresponding to the given ID string in $id.
function getScorecard($scorecard_id/*string*/) {
    if ($scorecard_id === '') {
        throw new Exception('Empty ID field specified');
    }
    $filename = "../data/scorecards/$scorecard_id.json";
    /*DEV*/saveDiagnosticOutput('$filename', $filename, 'Scorecard input filename');
    if (file_exists($filename)) {
        $scorecard_data = file_get_contents($filename);
        setResponseOutputs(200, true, "Found scorecard with ID '$scorecard_id'", $scorecard_data, $scorecard_id);
    } else {
        setResponseOutputs(404, false, "Scorecard with ID '$scorecard_id' not found", '', $scorecard_id);
    }
}

// The saveScorecard() function saves the scorecard, represented by the JSON data
// in string form in $jsonData, with the given ID in $id.
function saveScorecard($id/*string*/, $jsonData/*string*/) {
    // First parse the input JSON string and determine if the embedded scorecard
    // ID matches what was specified.
    $scorecardData = json_decode($jsonData, true);
    if (!array_key_exists('scorecard_id', $scorecardData)) {
        throw new Exception('Request input data is missing ID field');
    }
    $scorecard_id = $scorecardData['scorecard_id'];
    if ($scorecard_id === '') {
        throw new Exception('Request input data has empty ID field');
    }
    if ($id !== $scorecard_id) {
        throw new Exception('Request input data ID field does not match specified ID');
    }

    // Here, the ID values match, so save the data.
    $scorecardDataPretty = json_encode($scorecardData, JSON_PRETTY_PRINT);
    $file = null;
    $filename = "../data/scorecards/$id.json";
    /*DEV*/saveDiagnosticOutput('$filename', $filename, 'Scorecard output filename');
    $file_already_exists = file_exists($filename);
    try {
        $file = fopen($filename, 'w');
        fwrite($file, "$scorecardDataPretty\n");
    }
    catch (Exception $e) {
        throw new Exception('Could not save scorecard data: ' . $e->getMessage());
    }
    finally {
        if (!is_null($file)) {
            fclose($file);
        }
    }
    setResponseOutputs(200, true,
        ($file_already_exists ? 'Updated' : 'Saved') . " scorecard with ID '$id'", '',
        $scorecard_id);
}


// The getCourseList() function returns to the caller the JSON for the list
// of courses defined for this user, as specified by the user ID.
function getCourseList($user_id/*string*/) {
    if ($user_id === '') {
        throw new Exception('Empty ID field specified');
    }
    $filename = "../data/courses/course_list_$user_id.json";
    /*DEV*/saveDiagnosticOutput('$filename', $filename, 'Course List input filename');
    if (file_exists($filename)) {
        $course_list_data = file_get_contents($filename);
        setResponseOutputs(200, true, "Found course list for userspace ID '$user_id'", $course_list_data, $user_id);
    } else {
        setResponseOutputs(404, false, "Course list for userspace ID '$user_id' not found", '', $user_id);
    }
}

// The saveCourseList() function saves the list of courses for the user, as
// represented by the JSON data in string form in $jsonData, for the user
// with the given user ID in $user_id.
function saveCourseList($user_id/*string*/, $jsonData/*string*/) {
    $courseListData = json_decode($jsonData, true);
    $courseListDataPretty = json_encode($courseListData, JSON_PRETTY_PRINT);
    $file = null;
    $filename = "../data/courses/course_list_$user_id.json";
    /*DEV*/saveDiagnosticOutput('$filename', $filename, 'Course list output filename');
    $file_already_exists = file_exists($filename);
    try {
        $file = fopen($filename, 'w');
        fwrite($file, "$courseListDataPretty\n");
    }
    catch (Exception $e) {
        throw new Exception('Could not save course list data: ' . $e->getMessage());
    }
    finally {
        if (!is_null($file)) {
            fclose($file);
        }
    }
    setResponseOutputs(200, true,
        ($file_already_exists ? 'Updated' : 'Saved') . " course list for userspace ID '$id'", '',
        $user_id);
}


//
// The main API logic is here.
//

try {
    // Check the request method, and if it is PUT, fetch the request input data.
    $action = $_SERVER['REQUEST_METHOD'];
    $requestData = '';
    if ($action === 'PUT') {
        // Read in the entire request input data as a string.
        $requestInputData = file_get_contents('php:/' . '/input');	// Workaround for SimpleMinimzer.py
        if ($requestInputData === '') {
            throw new Exception('Request input data is empty');
        }
        /*DEV*/saveDiagnosticOutput('$requestInputData', $requestInputData, 'Raw request input data');

        // Now decode the URL-encoded % entities in it.
        $requestInputDataDecoded = urldecode($requestInputData);
        /*DEV*/saveDiagnosticOutput('$requestInputDataDecoded', $requestInputDataDecoded, 'Request input data after URL decoding');

        // The data should begin with "json_data=".
        if (preg_match('/^\s*json_data\s*=/', $requestInputDataDecoded) !== 1) {
            // Nope, it doesn't, so it isn't valid data.
            throw new Exception('Request input data is not in a known format');
        }
        // Remove the "json_data=" at the beginning and this should leave us with
        // a JSON string.  The individual functions will validate it as needed.
        $requestData = preg_replace('/^\s*json_data\s*=\s*/', '', $requestInputDataDecoded);
        /*DEV*/saveDiagnosticOutput('$requestData', $requestData, 'Final request input data to be processed by the GSC2API');
    }

    // Determine the type of object for this request.
    if (!array_key_exists('type', $_REQUEST)) {
        throw new Exception('No object type specified');
    }
    $objectname = $_REQUEST['type'];
    if ($objectname === '') {
        throw new Exception('Object type is empty');
    }

    // Now check for the ID for the object type.
    if (!array_key_exists('id', $_REQUEST)) {
        throw new Exception('No object ID specified');
    }
    $objectid = $_REQUEST['id'];
    if ($objectid === '') {
        throw new Exception('Object ID is empty');
    }
    if (!isValidID($objectid)) {
        throw new Exception('Object ID is invalid');
    }
    // Save the object ID in the response object.
    $response['id'] = $objectid;

    // Now process the action request for the given object type.
    if ($objectname === 'scorecard') {
        // We are getting or saving a scorecard.
        if ($action === 'PUT') {
            saveScorecard($objectid, $requestData);
        } elseif ($action === 'GET') {
            getScorecard($objectid);
        } else {
            throw new Exception("Unknown HTTP verb '$action' for object type '$objectname'");
        }
    }
    elseif ($objectname === 'scorecards') {
        // We are getting a list of scorecards for the user.
        //JK// HERE I AM
        setResponseOutputs(501, false, 'Not implemented', '', $objectid);
    }
    elseif ($objectname === 'courses') {
        // We are getting or saving a list of courses for the user.
        if ($action === 'PUT') {
            saveCourseList($objectid, $requestData);
        } elseif ($action === 'GET') {
            getCourseList($objectid);
        } else {
            throw new Exception("Unknown HTTP verb '$action' for object type '$objectname'");
        }
    }
    else {
        throw new Exception("Unrecognized object type '$objectname'");
    }
}
catch (Exception $e) {
    setResponseOutputs(400, false, $e->getMessage(), '');
}
finally {
    // Generate the final output response.
    echo json_encode($response);
}


/* Reference: Official HTTP Status Codes (https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
    100 Continue
    101 Switching Protocols
    102 Processing
    103 Early Hints
    200 OK
    201 Created
    202 Accepted
    203 Non-Authoritative Information
    204 No Content
    205 Reset Content
    206 Partial Content
    207 Multi-Status
    208 Already Reported
    226 IM Used
    300 Multiple Choices
    301 Moved Permanently
    302 Found (Previously "Moved temporarily", superceded by 303 and 307)
    303 See Other
    304 Not Modified
    305 Use Proxy
    306 Switch Proxy
    307 Temporary Redirect
    308 Permanent Redirect
    400 Bad Request
    401 Unauthorized
    402 Payment Required
    403 Forbidden
    404 Not Found
    405 Method Not Allowed
    406 Not Acceptable
    407 Proxy Authentication Required
    408 Request Timeout
    409 Conflict
    410 Gone
    411 Length Required
    412 Precondition Failed
    413 Payload Too Large
    414 URI Too Long
    415 Unsupported Media Type
    416 Range Not Satisfiable
    417 Expectation Failed
    418 I'm a teapot
    421 Misdirected Request
    422 Unprocessable Entity
    423 Locked
    424 Failed Dependency
    425 Too Early
    426 Upgrade Required
    428 Precondition Required
    429 Too Many Requests
    431 Request Header Fields Too Large
    451 Unavailable For Legal Reasons
    500 Internal Server Error
    501 Not Implemented
    502 Bad Gateway
    503 Service Unavailable
    504 Gateway Timeout
    505 HTTP Version Not Supported
    506 Variant Also Negotiates
    507 Insufficient Storage
    508 Loop Detected
    510 Not Extended
    511 Network Authentication Required
*/
?>