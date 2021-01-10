#!/usr/bin/env python3
# SimpleMinimizer.py -- Python 3 script to remove comments, leading
# and trailing whitespace on lines, and blank lines from source
# code files.
# Copyright (c) 2021 James Kottas.  All rights reserved.

import argparse
import glob
import re
import sys


# Module docstring
"""
SimpleMinimizer.py -- Python 3 script to remove comments, leading
and trailing whitespace on lines, and blank lines from source
code files.

Comments can be in the following forms, where '...' represents the
comment content:

    clike   Comments used in C, C++, C#, PHP, JavaScript, CSS:
                /* ... */
                /*
                 * ...
                 */
                // ...

    hlike   Comments used in HTML, XML files:
                <!-- ... -->
                <!--
                    ...
                -->

    ilike   Comments used in .ini files:
                ; ...

    plike   Comments used in Python, Bash:
                # ...
                " ""       (artificial space added to prevent premature docstring end)
                    ...
                " ""       (artificial space added to prevent premature docstring end)
            For Python files, though, this comment form requires
            --pythonmode to be set to preserve blank lines and
            leading whitespace.

There are also special comments, which can be removed for release
mode or activated for release mode.

DEV comments indicate lines that should be removed if requested.
DEV comments look like this for C-like files:
        /*DEV*/ ...
and like this for HTML-like files:
        <!--DEV--> ...

Similar, REL comments indicate lines that should be activated when
DEV comments are being removed.  REL comments look like this for
C-like files: 
        /*REL ... */
and like this for HTML-like files:
        <!--REL ... -->
The comment portion is removed and the content in "..." is left in
the output.

Known bugs:
    1. When in Python mode with --plike, a '#' symbol within a quoted
       string is still treated as a comment symbol, even though it
       really isn't. Workaround: Use chr(35) instead of '#' in the
       Python code.
       
    2. Similarly, with --clike, if '/*' or '//' is in a string, it
       will be treated as a comment delimiter.  Workaround: Simply
       concatenate the two characters, like "/" + "*".
     
"""


# ==================================================================================================
# Constants
# ==================================================================================================

VERSION: str = '1.0.0'          # This is the script version for reference.

# Define bit-flags for each type of comment delimiters.
CLIKE: int = 0x01               # C, C++, C#, CSS, JavaScript PHP
HLIKE: int = 0x02               # HTML, XML
ILIKE: int = 0x04               # .ini configuration file
PLIKE: int = 0x08               # Python, Bash

# Define a special flag to be used in conjunction with a *LIKE flag for removing DEV (developer)
# comments and activating REL (release) comments.
UNDEV: int = 0x80

# Set the default comment type to process.
DEFAULT_LIKE_COMMENTS: int = CLIKE

# Define the list of acceptable comment delimiters, in terms of pairs of
# starting and terminating delimiters.
COMMENT_DELIMITERS: list = [
    # Each entry here is a dictionary with the following fields:
    #   like                    One of the *LIKE integer constants.
    #   multiline               Set to true if the comment can be go across lines.
    #   match_start_pattern     Regex pattern for the start of the comment.
    #   match_end_pattern       Regex pattern for the end of the comment.  If empty,
    #                           there is no end comment delimiter.
    #   replace_pattern         Regex pattern to remove the comment when it is all
    #                           on a single line.
    #   replace_string          The string to use to replace the replace_pattern with.
    #   replace_start_pattern   Regex pattern to remove the start of the comment when
    #                           it goes across multiple lines.  Only needed if the
    #                           multiline key is True.
    #   replace_end_pattern     Regex pattern to remove the end of the comment when
    #                           it goes across multiple lines.  Only needed if the
    #                           multiline key is True.
    #
    # The UNDEV forms are first since they can make lines disappear (and appear).
    {
        # Remove DEV comment lines like /*DEV*/ ...
        'like': CLIKE | UNDEV,
        'multiline': False,
        'match_start_pattern': r'[/][*]DEV[*][/]',
        'match_end_pattern': r'',
        'replace_pattern': r'\s*[/][*]DEV[*][/].*$',
        'replace_string': ''
    },
    {
        # Remove DEV comment lines like <!--DEV--> ...
        'like': HLIKE | UNDEV,
        'multiline': False,
        'match_start_pattern': r'<!--DEV-->',
        'match_end_pattern': r'',
        'replace_pattern': r'\s*<!--DEV-->.*$',
        'replace_string': ''
    },
    {
        # Activate REL comment lines like /*REL ... */
        'like': CLIKE | UNDEV,
        'multiline': False,
        'match_start_pattern': r'[/][*]REL\s+(.*?)\s*[*][/]',       # Non-greedy form
        'match_end_pattern': r'',
        'replace_pattern': r'\s*[/][*]REL\s+(.*?)\s*[*][/]',        # Non-greedy form
        'replace_string': r'\1'
    },
    {
        # Activate REL comment lines like <!--REL ... -->
        'like': HLIKE | UNDEV,
        'multiline': False,
        'match_start_pattern': r'<!--REL\s+(.*?)\s*-->',        # Non-greedy form
        'match_end_pattern': r'',
        'replace_pattern': r'\s*<!--REL\s+(.*?)\s*-->',         # Non-greedy form
        'replace_string': r'\1'
    },
    {
        # C, C++, C#, CSS, JavaScript, PHP:  /* ... */
        'like': CLIKE,
        'multiline': True,
        'match_start_pattern': r'[/][*]',
        'match_end_pattern': r'[*][/]',
        'replace_pattern': r'\s*[/][*].*?[*][/]\s*',        # Non-greedy form
        'replace_string': '',
        'replace_start_pattern': r'\s*[/][*].*$',
        'replace_end_pattern': r'^.*?[*][/]\s*'             # Non-greedy form
    },
    {
        # C, C++, C#, JavaScript, PHP:  // ...
        'like': CLIKE,
        'multiline': False,
        'match_start_pattern': r'[/]{2}',
        'match_end_pattern': r'',
        'replace_pattern': r'\s*[/]{2}.*$',
        'replace_string': ''
    },
    {
        # Python, Bash:  # ...
        'like': PLIKE,
        'multiline': False,
        'match_start_pattern': r'[#]',
        'match_end_pattern': r'',
        'replace_pattern': r'\s*[#].*$',
        'replace_string': ''
    },
    {
        # Python:  """\n ...\n """\n
        'like': PLIKE,
        'multiline': True,
        'match_start_pattern': r'^\s*["]{3}',
        'match_end_pattern': r'^\s*["]{3}',
        'replace_pattern': r'^\s*["]{3}.*$',
        'replace_string': '',
        'replace_start_pattern': r'^\s*["]{3}.*$',
        'replace_end_pattern': r'^\s*["]{3}.*$'
    },
    {
        # HTML, XML:  <!-- ... -->
        'like': HLIKE,
        'multiline': True,
        'match_start_pattern': r'<!--',
        'match_end_pattern': r'-->',
        'replace_pattern': r'<!--.*?-->',
        'replace_string': '',
        'replace_start_pattern': r'\s*<!--.*$',
        'replace_end_pattern': r'^.*?-->'
    },
    {
        # .ini configuration files:  ; ...
        'like': ILIKE,
        'multiline': False,
        'match_start_pattern': r';',
        'match_end_pattern': r'',
        'replace_pattern': r'\s*;.*$',
        'replace_string': ''
    }
]


# ==================================================================================================
# Global Variables
# ==================================================================================================

verbose_mode: bool = False      # If True, print out detailed information during the lookup process.
debug_mode: bool = False        # If True, print out detailed debugging information.

# Input line processing variables
multiline_comment_active: bool = False      # If True, a multi-line comment with a @@graph tag is active.
multiline_comment_form_index: int = -1      # Set to the index of comment parameters within COMMENT_DELIMITERS.

# Warning/error counters
num_warnings: int = 0
num_errors: int = 0


# ==================================================================================================
# Common Utility Functions
# ==================================================================================================

def plural(n: int, def_one: str = '', def_many: str = 's') -> str:
    """
    Returns the plural form of a noun based on the number n.  By default, this
    function assumes a simple "s" can be used to make a noun plural.  If the
    plural word needs to change completely, the two options may be given in
    the optional arguments.  Example:
        plural(15, 'criterion', 'criteria')
    Returns 'criteria'.
    :param n: The number on which to determine if a plural form is needed or not.
    :param def_one: The string to return if the number is one.
    :param def_many: The string to return if the number is not one.
    :return: Returns the string to use for the plural form.
    """
    if n == 1:
        return def_one
    else:
        return def_many


def write_verbose_msg(msg: str) -> None:
    """
    Writes out the given message to stderr if in verbose mode.
    :param msg: The message to print out.
    :return: No return value.
    """
    global verbose_mode
    if verbose_mode:
        sys.stderr.write(msg + '\n')


def write_debug_msg(msg: str) -> None:
    """
    Writes out the given message to stderr if in debug mode.
    :param msg: The message to print out.
    :return: No return value.
    """
    global debug_mode
    if debug_mode:
        sys.stderr.write('DEBUG: ' + msg + '\n')


def write_warning_msg(msg: str) -> None:
    """
    Writes out a warning message to stderr.
    :param msg: The warning message to print out.
    :return: No return value.
    """
    global num_warnings
    sys.stderr.write('WARNING: ' + msg + '\n')
    num_warnings += 1


def write_error_msg(msg: str) -> None:
    """
    Writes out an error message to stderr.
    :param msg: The error message to print out.
    :return: No return value.
    """
    global num_errors
    sys.stderr.write('ERROR: ' + msg + '\n')
    num_errors += 1


# ==================================================================================================
# Main Processing Functions
# ==================================================================================================

def process_line(likeflags: int, inputline: str, sourcefilename: str, linenum: int, pythonmode: bool) -> None:
    """
    Processes the given input line, which came from the specified source file
    for comments, and removes them and extra whitespace.  Writes the line to
    stdout after comments and whitespace have been removed.  If the line is
    empty, the line is discarded.
    :param likeflags: An OR'ed combination of *LIKE identifiers to select
        what types of comments to process.
    :param inputline: The input line from the source file to process.
    :param sourcefilename: The name of the source file from which the input
        line came.  Used for diagnostic messages.
    :param linenum: The 1-based line number which corresponds to the input line.
        Used for diagnostic messages.
    :param pythonmode: If true, preserve blank lines and leading whitespace
        as is needed for Python files.
    :return: Does not return anything.
    """
    global verbose_mode, debug_mode, num_errors, num_warnings
    global multiline_comment_active, multiline_comment_form_index
    global COMMENT_DELIMITERS

    # Start by saving the indentation whitespace if we're in Python mode.
    indent: str = ''
    if pythonmode:
        match: re.Match = re.search(r'(^\s*)', inputline)
        if match is not None:
            indent = match.group(0)

    # First, get rid of leading and trailing whitespace.
    write_debug_msg(f'{sourcefilename}, line #{linenum}: Processing input line "{inputline}"')
    bare_inputline: str = inputline.strip()
    if bare_inputline == '':
        # This an empty line so just ignore it, unless we're in Python mode,
        # in which case, we want to preserve the line.
        if pythonmode:
            write_debug_msg('Line is empty, preserving it in Python mode')
            print()
        else:
            write_debug_msg('Line is empty, ignoring it')
        return

    if multiline_comment_active:
        # We are within a multiline comment, so look for the end comment pattern.
        write_debug_msg('Multiline flag is true, so a multiline comment is active')
        comment_params: dict = COMMENT_DELIMITERS[multiline_comment_form_index]
        # Get the termination parameters.
        multiline_flag: bool = comment_params['multiline']      # Should be True
        if not multiline_flag:
            write_error_msg(f'Configuration error with comment parameter set #{multiline_comment_form_index}: ' +
                            'It is not flagged as a multiline comment, assuming it is true.  ' +
                            f'Source file = {sourcefilename}, line number {linenum}')

        match_end_pattern: str = comment_params['match_end_pattern']
        write_debug_msg(f'Comment termination pattern = "{match_end_pattern}"')
        match: re.Match = re.search(match_end_pattern, bare_inputline)
        if match is None:
            # No comment termination pattern found, so ignore this line.
            write_debug_msg('No comment termination pattern found, ignoring this line')
            return

        # Yes, we found the comment termination pattern.
        write_debug_msg('Comment termination pattern found')
        multiline_comment_active = False
        multiline_comment_form_index = -1
        replace_end_pattern: str = comment_params['replace_end_pattern']
        replace_string: str = comment_params['replace_string']
        write_debug_msg(f'Replacement end pattern = "{replace_end_pattern}"')
        write_debug_msg(f'Replacement string = "{replace_string}"')
        output_line: str = re.sub(replace_end_pattern, replace_string, bare_inputline).strip()
        if output_line == '':
            # The resulting line is empty, so ignore it.
            write_debug_msg('Line is empty, ignoring it')
            return
        # This line has some content remaining, so process it like it was
        # the original line.
        bare_inputline = output_line
        write_debug_msg(f'Line still has content in it, processing it as if it was a new input line: "{bare_inputline}')

    # At this point, we are not within a multiline comment, so see if
    # this line is a comment line.
    for n in range(0, len(COMMENT_DELIMITERS)):
        write_debug_msg(f'Trying comment delimiter pattern set #{n+1}')
        comment_params: dict = COMMENT_DELIMITERS[n]
        like_flag: int = comment_params['like']
        if (like_flag & likeflags) == 0:
            # This comment delimiter set isn't active now, so skip it.
            write_debug_msg('This comment delimiter pattern set is not active')
            continue
        if (like_flag & UNDEV) != 0:
            # This is an UNDEV pattern.  Only process it if we were
            # requested to do so.
            write_debug_msg('This comment delimiter pattern set is an UNDEV pattern')
            if (likeflags & UNDEV) == 0:
                # Nope, we were not requested to process UNDEV comments.
                write_debug_msg('UNDEV patterns are not active, so ignoring this comment delimiter set')
                continue
        # Okay, we have a match.  We should process this comment type.
        write_debug_msg('Comment delimiter set is active, using it')

        # Required settings.
        multiline_flag: bool = comment_params['multiline']
        match_start_pattern: str = comment_params['match_start_pattern']
        write_debug_msg(f'Comment starting pattern = "{match_start_pattern}"')
        match: re.Match = re.search(match_start_pattern, bare_inputline)
        if match is None:
            # No comment start pattern was found, so try the next
            # comment parameter set.
            write_debug_msg('Comment starting pattern not found, moving on to the next set (if any)')
            continue

        # A comment start pattern was matched, so see if there is a
        # comment termination pattern.
        write_debug_msg('Comment starting pattern was found')
        match_end_pattern: str = comment_params['match_end_pattern']
        write_debug_msg(f'Comment termination pattern = "{match_end_pattern}"')
        if match_end_pattern == '':
            # There is no comment termination pattern defined, so this
            # is not a multiline comment situation.  Replace the
            # comment and see what we have left.
            write_debug_msg('No comment termination pattern is defined')
            replace_pattern: str = comment_params['replace_pattern']
            replace_string: str = comment_params['replace_string']
            write_debug_msg(f'Replacement pattern = "{replace_pattern}"')
            write_debug_msg(f'Replacement string = "{replace_string}"')
            write_debug_msg('Replacing the comment pattern')
            output_line: str = re.sub(replace_pattern, replace_string, bare_inputline).strip()
            if output_line == '':
                write_debug_msg('Resulting line is empty, ignoring it')
            else:
                # The processed line is not empty, so process it again
                # in case there are trailing comments.
                write_debug_msg(f'Resulting line is not empty, processing it as a new input line: "{output_line}')
                process_line(likeflags, indent + output_line, sourcefilename, linenum, pythonmode)
            # Then we're done with this input line.
            return
        else:
            # There is a comment termination pattern.  See if it is the
            # same pattern as the comment starting pattern.  If so, this
            # must be the start of a multiline comment.
            if match_start_pattern == match_end_pattern:
                write_debug_msg(
                    'Comment starting and terminations are the same, this is the start of a multiline comment.')
                if multiline_flag:
                    multiline_comment_active = True
                    multiline_comment_form_index = n
                    # Ignore the line since this is a starting comment line.
                    return
                else:
                    # This is a configuration problem.
                    write_error_msg(f'Configuration error with comment parameter set #{n}: ' +
                                    'The comment starting and termination patterns are the same, which means that ' +
                                    'this should be the start of a multiline comment, but this comment parameter ' +
                                    'set is not marked as applying to multiline comments.  ' +
                                    f'Source file = {sourcefilename}, line number {linenum}')
                    return

            # Otherwise, see if the comment termination pattern is present.
            write_debug_msg('A comment termination pattern is defined')
            match: re.Match = re.search(match_end_pattern, bare_inputline)
            if match is None:
                # This line does not match the comment termination pattern.
                write_debug_msg('No comment termination pattern found')
                if multiline_flag:
                    # This is a multiline comment, and this is the first
                    # line of it.  Start ignore these lines.
                    write_debug_msg('This comment starting delimiter is starting multiline comment')
                    replace_start_pattern: str = comment_params['replace_start_pattern']
                    replace_string: str = comment_params['replace_string']
                    write_debug_msg(f'Replacement starting pattern = "{replace_start_pattern}"')
                    write_debug_msg(f'Replacement string = "{replace_string}"')
                    output_line: str = re.sub(replace_start_pattern, replace_string, bare_inputline).strip()
                    if output_line == '':
                        write_debug_msg('Resulting line is empty, ignoring it')
                    else:
                        write_debug_msg(
                            f'Resulting line is not empty, processing it as a new input line: "{output_line}')
                        process_line(likeflags, indent + output_line, sourcefilename, linenum, pythonmode)
                    multiline_comment_active = True
                    multiline_comment_form_index = n
                else:
                    # This is a configuration problem.
                    write_error_msg(f'Configuration error with comment parameter set #{n}: ' +
                                    'There is no comment termination pattern but this is not flagged as ' +
                                    f'a multiline comment.  Source file = {sourcefilename}, line number {linenum}')
                return

            else:
                # Yes, the comment termination pattern was detected on
                # the same line as a comment start pattern, so use the
                # replacement pattern to update this line for a single-line
                # comment.
                write_debug_msg('Comment termination pattern found')
                replace_pattern: str = comment_params['replace_pattern']
                replace_string: str = comment_params['replace_string']
                write_debug_msg(f'Replacement pattern = "{replace_pattern}"')
                write_debug_msg(f'Replacement string = "{replace_string}"')
                output_line: str = re.sub(replace_pattern, replace_string, bare_inputline).strip()
                if output_line == '':
                    write_debug_msg('Resulting line is empty, ignoring it')
                else:
                    # The processed line is not empty, so process it
                    # recursively for any more comments.
                    write_debug_msg(f'Resulting line is not empty, processing it as a new input line: {output_line}')
                    process_line(likeflags, indent + output_line, sourcefilename, linenum, pythonmode)
                # Then we're done with this input line.
                return

    # If the loop ends and we get here, all comments were processed.
    # If there is anything left of the line, print it out.
    if bare_inputline != '':
        write_debug_msg(f'Processed line has content, so printing it out: "{bare_inputline}"')
        print(indent + bare_inputline)


def main() -> bool:
    """
    Main program entry point.  Returns True.
    """
    global VERSION, CLIKE, HLIKE, ILIKE, PLIKE, UNDEV, DEFAULT_LIKE_COMMENTS
    global verbose_mode, debug_mode

    # Initialize the bit-flag accumulator.
    likeflags: int = 0

    # Start out by parsing the command line options and arguments.
    parser = argparse.ArgumentParser(prog='python %s' % sys.argv[0],
                                     usage='%(prog)s [options] [source-filename(s)]',
                                     description='Process source files to remove comments, blank lines, and ' +
                                                 'extra line space.')

    # Define the options.
    parser.add_argument('-d', '--debug',
                        dest='opt_debug',
                        default=False,
                        action='store_true',
                        help='Print out debugging information during processing.  Implies verbose mode.')

    parser.add_argument('-v', '--verbose',
                        dest='opt_verbose',
                        default=False,
                        action='store_true',
                        help='Print out verbose information during the processing.')

    parser.add_argument('-V', '--version',
                        action='version',
                        version='%(prog)s version ' + VERSION,
                        help='Print out the version of the script.')

    parser.add_argument('-C', '--clike',
                        dest='opt_clike',
                        default=False,
                        action='store_true',
                        help='Remove C/C++/CSS/JavaScript-like comments.  This is the default.')

    parser.add_argument('-P', '--plike',
                        dest='opt_plike',
                        default=False,
                        action='store_true',
                        help='Remove Python/Bash-like comments.')

    parser.add_argument('-H', '--hlike',
                        dest='opt_hlike',
                        default=False,
                        action='store_true',
                        help='Remove HTML-like comments.')

    parser.add_argument('-I', '--ilike',
                        dest='opt_ilike',
                        default=False,
                        action='store_true',
                        help='Remove .ini configuration file comments.')

    parser.add_argument('-U', '--undev',
                        dest='opt_undev',
                        default=False,
                        action='store_true',
                        help='Remove lines that being with a DEV comment and activates lines within REL comments.')
    # Example lines:
    #       /*DEV*/ ...
    #       <!--DEV--> ...
    #       /*REL ... */
    #       <!--REL ... -->

    parser.add_argument('-Y', '--pythonmode',
                        dest='opt_pythonmode',
                        default=False,
                        action='store_true',
                        help='Preserve blank lines and leading whitespace for Python files.')

    # Define the arguments.
    parser.add_argument('source_files',
                        nargs='*',
                        action='store',
                        help='Source files to process.  All output is written to stdout.')

    # Now parse out the arguments.
    args = parser.parse_args()

    # Process the options.
    debug_mode = args.opt_debug
    verbose_mode = args.opt_verbose or debug_mode

    pythonmode = False
    if args.opt_clike:
        likeflags |= CLIKE
        if args.opt_undev:
            likeflags |= UNDEV
    if args.opt_hlike:
        likeflags |= HLIKE
        if args.opt_undev:
            likeflags |= UNDEV
    if args.opt_ilike:
        likeflags |= ILIKE
    if args.opt_plike:
        likeflags |= PLIKE
        if args.opt_pythonmode:
            pythonmode = True
    if likeflags == 0:
        # Need a default value.
        likeflags = DEFAULT_LIKE_COMMENTS

    if verbose_mode:
        write_verbose_msg(f'This is {sys.argv[0]} version {VERSION}')
        write_verbose_msg(f'Script to remove comments and extra line whitespace from source files.  Writes to stdout.')

    num_files_processed: int = 0
    if len(args.source_files) > 0:
        # One or more source files were specified on the command line.
        # Process them one at a time.
        for srcfilepat in args.source_files:
            write_debug_msg(f'Processing source file argument "{srcfilepat}"')
            try:
                srcfiles: list = glob.glob(srcfilepat)
                if len(srcfiles) <= 0:
                    write_error_msg(f'No matching files found for argument "{srcfilepat}"')
                else:
                    for srcfile in srcfiles:
                        write_debug_msg(f'Processing matching source file "{srcfile}"')
                        linenum: int = 0
                        with open(srcfile, 'r') as thefile:
                            while True:
                                inputline: str = thefile.readline()
                                if not inputline:
                                    break
                                linenum += 1
                                process_line(likeflags, inputline, srcfile, linenum, pythonmode)
                            num_files_processed += 1
            except Exception as err:
                write_error_msg(str(err))
    else:
        # No source files were specified on the command line, so read from standard input.
        num_files_processed = -1    # Negative value indicates stdin.
        linenum: int = 0
        for inputline in sys.stdin:
            linenum += 1
            process_line(likeflags, inputline, '<stdin>', linenum, pythonmode)

    if verbose_mode:
        write_verbose_msg('Summary of processing results:')
        write_verbose_msg(f'    {num_errors} error message{plural(num_errors)}')
        write_verbose_msg(f'    {num_warnings} warning message{plural(num_warnings)}')
        if num_files_processed < 0:
            write_verbose_msg('    <stdin> processed')
        else:
            write_verbose_msg(f'    {num_files_processed} file{plural(num_files_processed)} processed')
    return True


if __name__ == "__main__":
    main()
