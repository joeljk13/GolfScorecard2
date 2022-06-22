#!/usr/bin/env python3
# Dequotifier.py -- Python 3 script to remove double quotes and single quotes
# from standard input or one or  more input files.  This is needed by Windows
# scripts that cannot handle quotes in a command line because Windows does not
# handle quotation marks in a sane manner.
# Copyright (c) 2022 James Kottas.  All rights reserved.

import argparse
import glob
import sys


# Module docstring
"""
Dequotifier.py -- Python 3 script to remove double quotes and single quotes
# from standard input or one or  more input files.  This is needed by Windows
# scripts that cannot handle quotes in a command line because Windows does not
# handle quotation marks in a sane manner.
"""

# ==================================================================================================
# Constants
# ==================================================================================================

VERSION: str = '1.0.0'          # This is the script version for reference.

# Define the list of acceptable comment delimiters, in terms of pairs of
# starting and terminating delimiters.


# ==================================================================================================
# Common Utility Functions
# ==================================================================================================

def write_error_msg(msg: str) -> None:
    """
    Writes out an error message.
    :param msg: The error message to print out.
    :return: No return value.
    """
    sys.stderr.write(f'ERROR: {msg}\n')


# ==================================================================================================
# Main Processing Functions
# ==================================================================================================

def process_line(inputline: str,
                 sourcefilename: str,
                 linenum: int,
                 strip_double_quotes: bool,
                 strip_single_quotes: bool,
                 strip_whitespace: bool) -> str:
    """
    Processes the given input line, which came from the specified source file.
    :param inputline: The input line from the source file to process.
    :param sourcefilename: The name of the source file from which the input
        line came.  Available for diagnostic purposes.
    :param linenum: The 1-based line number which corresponds to the input line.
        Available for diagnostic purposes.
    :param strip_double_quotes: If True, strip out double quotation marks.
    :param strip_single_quotes: If True, strip out single quotation marks.
    :param strip_whitespace: If True, strip out leading and trailing whitespace.
    :return: The processed line.
    """
    outputline: str = inputline
    if strip_whitespace:
        # Get rid of leading and trailing whitespace.
        outputline = outputline.strip()
    if strip_double_quotes:
        outputline = outputline.replace('"', '')
    if strip_single_quotes:
        outputline = outputline.replace("'", "")
    return outputline


def main() -> bool:
    """
    Main program entry point.  Returns True.
    """
    global VERSION

    # Start out by parsing the command line options and arguments.
    parser = argparse.ArgumentParser(prog='python %s' % sys.argv[0],
                                     usage='%(prog)s [options] [input-filename(s)]',
                                     description='Remove quotation marks from standard input or the specified files.')

    # Define the options.
    parser.add_argument('-a', '--allquotes',
                        dest='opt_all_quotes',
                        default=False,
                        action='store_true',
                        help='Remove both single double quotation marks.  This is the default.')

    parser.add_argument('-1', '--singlequotesonly',
                        dest='opt_single_quotes_only',
                        default=False,
                        action='store_true',
                        help='Remove only single quotation marks.  Leave double quotation marks alone.')

    parser.add_argument('-2', '--doublequotesonly',
                        dest='opt_double_quotes_only',
                        default=False,
                        action='store_true',
                        help='Remove only double quotation marks.  Leave single quotation marks alone.')

    parser.add_argument('-w', '--stripwhitespace',
                        dest='opt_strip_whitespace',
                        default=False,
                        action='store_true',
                        help='Strip off leading and trailing whitespace from each line.')

    parser.add_argument('-V', '--version',
                        action='version',
                        version='%(prog)s version ' + VERSION,
                        help='Print out the version of the script.')

    # Define the arguments.
    parser.add_argument('input_files',
                        nargs='*',
                        action='store',
                        help='Input files to process.')

    # Now parse out the arguments.
    args = parser.parse_args()

    # Process the options.
    strip_double_quotes: bool = False
    strip_single_quotes: bool = False
    strip_whitespace: bool = False

    if args.opt_double_quotes_only:
        strip_double_quotes = True
        strip_single_quotes = False
    if args.opt_single_quotes_only:
        strip_single_quotes = False
        strip_single_quotes = True
    if args.opt_all_quotes:
        strip_double_quotes = True
        strip_single_quotes = True
    if args.opt_strip_whitespace:
        strip_whitespace = True

    # Process the input source files or standard input.
    num_files_processed: int = 0
    if len(args.input_files) > 0:
        # One or more source files were specified on the command line.
        # Process them one at a time.
        for srcfilepat in args.input_files:
            try:
                srcfiles: list = glob.glob(srcfilepat)
                if len(srcfiles) <= 0:
                    write_error_msg(f'No matching files found for argument "{srcfilepat}"')
                else:
                    for srcfile in srcfiles:
                        linenum: int = 0
                        with open(srcfile, 'r') as thefile:
                            while True:
                                inputline: str = thefile.readline()
                                if not inputline:
                                    break
                                linenum += 1
                                update_line: str = process_line(inputline, srcfile, linenum, strip_double_quotes,
                                                                strip_single_quotes, strip_whitespace)
                                if strip_whitespace:
                                    print(update_line)
                                else:
                                    sys.stdout.write(update_line)
                            num_files_processed += 1
            except Exception as err:
                write_error_msg(str(err))
    else:
        # No source files were specified on the command line, so read from standard input.
        num_files_processed = -1    # Negative value indicates stdin.
        linenum: int = 0
        for inputline in sys.stdin:
            linenum += 1
            update_line: str = process_line(inputline, '<stdin>', linenum, strip_double_quotes,
                                            strip_single_quotes, strip_whitespace)
            if strip_whitespace:
                print(update_line)
            else:
                sys.stdout.write(update_line)
    return True


if __name__ == "__main__":
    main()
