MAKEFLAGS += --silent

# NodeJS modules that need to be installed.
#	JSDoc:			npm install -g jsdoc
#	JSHint:			npm install -g jshint
#	TypeScript:		npm install -g typescript
#	Uglify-JS:		npm install -g uglify-js
#	UglifyCSS:		npm install -g uglifycss

# Set the paths to key commands and utilities.
ifeq ($(findstring Windows,$(OS)),Windows)
# Windows settings
# Use the default SHELL setting
BUILDENV := Windows
BASENAME := C:/Local/cygwin64/bin/basename.exe
CAT := C:/Local/cygwin64/bin/cat.exe
CP := C:/Local/cygwin64/bin/cp.exe
CUT := C:/Local/cygwin64/bin/cut.exe
DIRNAME := C:/Local/cygwin64/bin/dirname.exe
DOT := dot
ECHO := echo
FIND := C:/Local/cygwin64/bin/find.exe
GAWK := C:/Local/cygwin64/bin/gawk.exe
GREP := C:/Local/cygwin64/bin/grep.exe
JSDOC := jsdoc
JSHINT := jshint
MKDIR := C:/Local/cygwin64/bin/mkdir.exe
OPENSSL := C:/Local/cygwin64/bin/openssl.exe
PYTHON := python
RM := C:/Local/cygwin64/bin/rm.exe
SED := C:/Local/cygwin64/bin/sed.exe
TEE := C:/Local/cygwin64/bin/tee.exe
UGLIFYCSS := uglifycss
UGLIFYJS := uglifyjs
else
# Linux settings
SHELL := /bin/bash
BUILDENV := Linux
BASENAME := basename
CAT := cat
CP := cp
CUT := cut
DIRNAME := dirname
DOT := dot
ECHO := echo
FIND := find
GAWK := gawk
GREP := grep
JSDOC := jsdoc
JSHINT := jshint
MKDIR := mkdir
OPENSSL := openssl
PYTHON := python3
RM := rm
SED := sed
TEE := tee
UGLIFYCSS := uglifycss
UGLIFYJS := uglifyjs
endif


# Define key variables.  Start with the input source files, identifying them with relative paths.
# CURRENT_DIR := $(shell pwd)
CURRENT_DIR := .
SRC_DIR_ROOT := $(CURRENT_DIR)/src
SRC_DIR_JS := $(SRC_DIR_ROOT)/js
SRC_FILES_JS := $(sort $(wildcard $(SRC_DIR_JS)/*.js))
SRC_DIR_LIB := $(SRC_DIR_ROOT)/lib
SRC_DIR_LIB_JS := $(SRC_DIR_LIB)/js
SRC_DIR_DATA := $(SRC_DIR_ROOT)/data
SRC_DIR_DATA_COURSES := $(SRC_DIR_DATA)/courses
SRC_DIR_CSS := $(SRC_DIR_ROOT)/css
SRC_DIR_API := $(SRC_DIR_ROOT)/api

# Define special build script locations
BUILD_DIR_ROOT := $(CURRENT_DIR)/build
BUILD_DIR_SCRIPTS := $(BUILD_DIR_ROOT)/scripts

# Define the top-level output directory.
# ##JK## HERE I AM - This will be changed to "out" when everything is working okay.
OUTPUT_DIR_ROOT := $(CURRENT_DIR)/out.make

# Define the output diagnostic directories, which are all under $(OUTPUT_DIR_ROOT)/diag.
OUTPUT_DIR_DIAG := $(OUTPUT_DIR_ROOT)/diag
OUTPUT_DIR_DIAG_JS := $(OUTPUT_DIR_DIAG)/js
OUTPUT_DIR_DIAG_JSLINT := $(OUTPUT_DIR_DIAG)/jslint
OUTPUT_DIR_DIAG_DOC := $(OUTPUT_DIR_DIAG)/doc
OUTPUT_DIR_DIAG_GRAPHS := $(OUTPUT_DIR_DIAG_DOC)/graphs
OUTPUT_DIR_DIAG_LIB := $(OUTPUT_DIR_DIAG)/lib

# Define the output distribution directories, which are all under $(OUTPUT_DIR_ROOT)/dist.
OUTPUT_DIR_DIST := $(OUTPUT_DIR_ROOT)/dist
OUTPUT_DIR_DIST_JS := $(OUTPUT_DIR_DIST)/js
OUTPUT_DIR_DIST_API := $(OUTPUT_DIR_DIST)/api
OUTPUT_DIR_DIST_CSS := $(OUTPUT_DIR_DIST)/css
OUTPUT_DIR_DIST_DATA := $(OUTPUT_DIR_DIST)/data
OUTPUT_DIR_DIST_DATA_COURSES := $(OUTPUT_DIR_DIST_DATA)/courses
OUTPUT_DIR_DIST_DATA_SCORECARDS := $(OUTPUT_DIR_DIST_DATA)/scorecards
OUTPUT_DIR_DIST_LIB := $(OUTPUT_DIR_DIST)/lib
OUTPUT_DIR_DIST_LIB_JS := $(OUTPUT_DIR_DIST_LIB)/js

# Define the output documentation directories, which are all under $(OUTPUT_DIR_ROOT)/doc.
OUTPUT_DIR_DOC := $(OUTPUT_DIR_DIST)/doc
OUTPUT_DIR_DOC_JS := $(OUTPUT_DIR_DOC)/js
OUTPUT_DIR_DOC_GRAPHS := $(OUTPUT_DIR_DOC_JS)/graphs

# Miscellaneous constants.
# 	SRI = Subresource Integrity
SRI_HASH_ALGORITHM := sha384


# Define a function for copying web site files to the output distribution directory.
# 		$(1) = The target filename with no path.
define copy_website_file
	$(ECHO) Copying $(1)
	$(CP) $(SRC_DIR_ROOT)/$(1) $(OUTPUT_DIR_DIST)/$(1)
endef


# This is the default target, and it builds everything.
all: intro \
		01_js_diags \
		02_js_minimizer \
		03_js_combiner \
		04_js_hasher \
		05_html_transformer \
		06_js_lib \
		07_courses \
		08_css \
		09_api \
		10_doc
	$(ECHO) ===== All done

intro:
	$(ECHO) Build environment set to $(BUILDENV)


# =================================================================================================
# 	1. Pattern rule for JavaScript file diagnostics
# =================================================================================================
#
# Determine the diagnostic JavaScript lint filenames by replacing the .js extension with the
# .jshint-output.txt extension, and change the input path to be the output diagnostic path.
DIAG_JSLINT_FILES_TMP := $(subst .js,.jshint-output.txt,$(SRC_FILES_JS))
DIAG_JSLINT_FILES := $(subst $(SRC_DIR_JS),$(OUTPUT_DIR_DIAG_JSLINT),$(DIAG_JSLINT_FILES_TMP))

# Define the rule for generating the diagnostic output JSHint files from the JavaScript input
# files.
$(OUTPUT_DIR_DIAG_JSLINT)/%.jshint-output.txt: $(SRC_DIR_JS)/%.js
	if [[ ! -d $(OUTPUT_DIR_DIAG_JSLINT) ]]
	then
	    $(ECHO) Creating diagnostic output directory $(OUTPUT_DIR_DIAG_JSLINT)
		$(MKDIR) -p $(OUTPUT_DIR_DIAG_JSLINT)
	fi
	$(ECHO) Checking $<
	# Transform the absolute path in the input file to be a relative path because the
	# jshint command cannot access the Cygwin /cygdirve/c directory on Windows.
	$(JSHINT) $(subst $(CURRENT_DIR)/,./,$<) > $@
	if [[ -f $@ ]]
	then
		$(ECHO) SUCCESS: Generated diagnostics output file $@
		if [[ -s $@ ]]
	    then
			$(ECHO) "WARNING: JSHint found problem(s):"
			$(CAT) $@
		fi
	else
		$(ECHO) ERROR: Could not generate diagnostics output file $@
	fi


# =================================================================================================
# 	2. Pattern rule for minimizing JavaScript files
# =================================================================================================
#
# Determine the minimized JavaScript output files by replacing the input source path with the
# desired output path for the minimized JavaScript output files.  The output directory is
# considered a diagnostic directory because the final output file is a combination of the
# minimized files.
MINIMIZED_JS_FILES_TMP := $(subst .js,.min.js,$(SRC_FILES_JS))
MINIMIZED_JS_FILES := $(subst $(SRC_DIR_JS),$(OUTPUT_DIR_DIAG_JS),$(MINIMIZED_JS_FILES_TMP))

# Define the rule for generating the minimized JavaScript output files from the JavaScript input files.
# Removes lines that being with "/*DEV*/" as they are for development only.
$(OUTPUT_DIR_DIAG_JS)/%.min.js: $(SRC_DIR_JS)/%.js
	if [[ ! -d $(OUTPUT_DIR_DIAG_JS) ]]
	then
	    $(ECHO) Creating intermediate JavaScript output directory $(OUTPUT_DIR_DIAG_JS)
		$(MKDIR) -p $(OUTPUT_DIR_DIAG_JS)
	fi
	$(ECHO) Minimizing $<
	$(GREP) -v -e "^\s*/[*]DEV[*]/" $< | $(UGLIFYJS) > $@
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated minimized JavaScript output file $@
	else
		$(ECHO) ERROR: Could not generate minimized JavaScript output file $@
	fi


# =================================================================================================
# 	3. Rule for creating combined minimized JavaScript file
# =================================================================================================
#
# Concatenate all of the minimized JavaScript files into a single JavaScript output file.
$(OUTPUT_DIR_DIST_JS)/gsc2app.js: $(MINIMIZED_JS_FILES)
	if [[ ! -d $(OUTPUT_DIR_DIST_JS) ]]
	then
	    $(ECHO) Creating minimized JavaScript output directory $(OUTPUT_DIR_DIST_JS)
		$(MKDIR) -p $(OUTPUT_DIR_DIST_JS)
	fi
	$(ECHO) Combining the minimized JavaScript files into $@
	$(CAT) $(MINIMIZED_JS_FILES) > $(OUTPUT_DIR_DIST_JS)/gsc2app.js
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated combined minimized JavaScript output file $@
	else
		$(ECHO) ERROR: Could not generate combined minimized JavaScript output file $@
	fi


# =================================================================================================
# 	4. Rule for creating the subresource integrity (SRI) hash for the combined minimized
# 	   JavaScript file
# =================================================================================================
#
# Use OpenSSL to compute the SHA-384 hash of the combined minimized JavaScript output file.
$(OUTPUT_DIR_DIAG_JS)/sri_hashes_sed.txt: $(OUTPUT_DIR_DIST_JS)/gsc2app.js
	$(ECHO) Creating $(SRI_HASH_ALGORITHM) hash from $< as a sed script in $@ for SRI
	$(OPENSSL) dgst -$(SRI_HASH_ALGORITHM) -binary $< | \
		$(OPENSSL) base64 -A | \
		$(PYTHON) -c "import sys; print('$(SRI_HASH_ALGORITHM)'+'-'+sys.stdin.readline().strip()+'\t'+r'$<')" | \
		$(TEE) $(OUTPUT_DIR_DIAG_JS)/sri_hashes.txt | \
		$(GAWK) '{print $$1}' | \
		$(PYTHON) -c "import sys; print('s/SRIHASH_GSC2APP_JS/'+sys.stdin.readline().strip()+'/g')" > $@
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated SRI hash sed file $@
	else
		$(ECHO) ERROR: Could not generate SRI hash sed file $@
	fi


# =================================================================================================
# 	5. Transform the development HTML source file into its production form
# =================================================================================================
#
# Use a custom python file to minimize the HTML code and insert the SRI hash.
$(OUTPUT_DIR_DIST)/main.html: \
		$(SRC_DIR_ROOT)/main.html \
		$(OUTPUT_DIR_DIAG_JS)/sri_hashes_sed.txt \
		$(BUILD_DIR_SCRIPTS)/SimpleMinimizer.py
	if [[ ! -d $(OUTPUT_DIR_DIST) ]]
	then
	    $(ECHO) Creating output directory $(OUTPUT_DIR_DIST)
		$(MKDIR) -p $(OUTPUT_DIR_DIST)
	fi
	$(ECHO) Transforming $<
	if [[ -s $(BUILD_DIR_SCRIPTS)/SimpleMinimizer.py ]]
	then
		$(CAT) $(SRC_DIR_ROOT)/main.html | \
			$(SED) -f $(OUTPUT_DIR_DIAG_JS)/sri_hashes_sed.txt | \
			$(PYTHON) $(BUILD_DIR_SCRIPTS)/SimpleMinimizer.py --hlike --undev > $@
	else
		$(CAT) $(SRC_DIR_ROOT)/main.html | $(SED) -f $(OUTPUT_DIR_DIAG_JS)/sri_hashes_sed.txt > $@
	fi
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated HTML file $@
	else
		$(ECHO) ERROR: Could not generate HTML file $@
	fi

# Simple rules to copy files to the output directory for this step.
$(OUTPUT_DIR_DIST)/.htaccess: $(SRC_DIR_ROOT)/.htaccess
	$(call copy_website_file,.htaccess)

$(OUTPUT_DIR_DIST)/favicon.ico: $(SRC_DIR_ROOT)/favicon.ico
	$(call copy_website_file,favicon.ico)

$(OUTPUT_DIR_DIST)/robots.txt: $(SRC_DIR_ROOT)/robots.txt
	$(call copy_website_file,robots.txt)


# =================================================================================================
# 	6. Pattern rule for release JavaScript library files
# =================================================================================================
#
# Determine the JavaScript library files that need to be copied over to the output distribution
# area.
SRC_LIB_JS_FILES_TMP := $(shell $(GREP) -e "!-- *REL.*src=.lib/js/" $(SRC_DIR_ROOT)/main.html | $(SED) "s/^.*src *= *.lib/lib/" | $(SED) "s/. .*$$//")
SRC_LIB_JS_FILES := $(subst lib/,$(SRC_DIR_ROOT)/lib/,$(SRC_LIB_JS_FILES_TMP))
# Then determine the output location for the files.
DIST_LIB_JS_FILES := $(subst lib/,$(OUTPUT_DIR_DIST_LIB)/,$(SRC_LIB_JS_FILES_TMP))

# Define the rule for copying a JavaScript library file to the output distribution area.
# Note that the actual target directory has different subdirectories for the different
# JavaScript library files, so that is why dirname is used multiple times below.
$(OUTPUT_DIR_DIST_LIB_JS)/%.js: $(SRC_DIR_LIB_JS)/%.js
	if [[ ! -d `$(DIRNAME) $@` ]]
	then
	    $(ECHO) Creating JavaScript library output directory `$(DIRNAME) $@`
		$(MKDIR) -p `$(DIRNAME) $@`
	fi
	$(ECHO) Copying $<
	$(CP) $< $@


# =================================================================================================
# 	7. Pattern rule for static course information
# =================================================================================================
#
# Determine the static courses that have been defined, and thus need to be copied over to the
# output distribution area.
SRC_COURSE_FILES := $(sort $(wildcard $(SRC_DIR_DATA_COURSES)/course_list_*.json))
# Then determine the output location for the files.
DIST_COURSE_FILES := $(subst $(SRC_DIR_DATA_COURSES),$(OUTPUT_DIR_DIST_DATA_COURSES),$(SRC_COURSE_FILES))

# Define a rule for copying static course information files to the output distribution area.
$(OUTPUT_DIR_DIST_DATA_COURSES)/%.json: $(SRC_DIR_DATA_COURSES)/%.json
	if [[ ! -d $(OUTPUT_DIR_DIST_DATA_COURSES) ]]
	then
	    $(ECHO) Creating course information directory $(OUTPUT_DIR_DIST_DATA_COURSES)
		$(MKDIR) -p $(OUTPUT_DIR_DIST_DATA_COURSES)
	fi
	$(ECHO) Copying $<
	$(CP) $< $@


# =================================================================================================
# 	8. Pattern rule for minimizing CSS files
# =================================================================================================
#
# Determine the source CSS files that need to be minimized and copied to the distribution output
# directory for CSS files.
SRC_CSS_FILES := $(sort $(wildcard $(SRC_DIR_CSS)/*.css))
# Then determine the output location for the files.
DIST_CSS_FILES := $(subst $(SRC_DIR_CSS),$(OUTPUT_DIR_DIST_CSS),$(SRC_CSS_FILES))

# Define the rule for minimizing a CSS file and writing it to the output distribution area.
$(OUTPUT_DIR_DIST_CSS)/%.css: $(SRC_DIR_CSS)/%.css
	if [[ ! -d $(OUTPUT_DIR_DIST_CSS) ]]
	then
	    $(ECHO) Creating CSS directory $(OUTPUT_DIR_DIST_CSS)
		$(MKDIR) -p $(OUTPUT_DIR_DIST_CSS)
	fi
	$(ECHO) Minimizing $<
	$(UGLIFYCSS) $< > $@
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated minimized CSS file $@
	else
		$(ECHO) ERROR: Could not generate minimized CSS file $@
	fi


# =================================================================================================
# 	9. Pattern rule for the server-side API files
# =================================================================================================
#
# Determine the source API files that need to be minimized and copied to the distribution output
# directory for API files.
SRC_API_FILES := $(sort $(wildcard $(SRC_DIR_API)/gsc2*.php))
# Then determine the output location for the files.
DIST_API_FILES := $(subst $(SRC_DIR_API),$(OUTPUT_DIR_DIST_API),$(SRC_API_FILES))

# Define the rule for minimizing a PHP file and writing it to the output distribution area.
$(OUTPUT_DIR_DIST_API)/%.php: $(SRC_DIR_API)/%.php
	if [[ ! -d $(OUTPUT_DIR_DIST_API) ]]
	then
	    $(ECHO) Creating API directory $(OUTPUT_DIR_DIST_API)
		$(MKDIR) -p $(OUTPUT_DIR_DIST_API)
	fi
	$(ECHO) Minimizing $<
	if [[ -s $(BUILD_DIR_SCRIPTS)/SimpleMinimizer.py ]]
	then
		$(PYTHON) $(BUILD_DIR_SCRIPTS)/SimpleMinimizer.py --clike --undev $< > $@
		if [[ -s $@ ]]
		then
			$(ECHO) SUCCESS: Generated minimized API file $@
		else
			$(ECHO) ERROR: Could not generate minimized API file $@
		fi
	else
		$(CP) $< $@
		if [[ -s $@ ]]
		then
			$(ECHO) SUCCESS: Copied API file $@
		else
			$(ECHO) ERROR: Could not copy API file $@
		fi
	fi


# =================================================================================================
# 	10. (a) Rules for creating graph source files for the program documentation
# =================================================================================================
#
# Dynamically determine the name of the GraphViz source file.
DIAG_GRAPH_FILE_TMP := $(shell $(GREP) filenamesuffix $(SRC_FILES_JS) | $(CUT) -f3 -d: | $(PYTHON) $(BUILD_DIR_SCRIPTS)/Dequotifier.py -a -w)
DIAG_GRAPH_FILENAME_BASE := gsc2app$(strip $(DIAG_GRAPH_FILE_TMP))
DIAG_GRAPH_FILENAME_ONLY := $(DIAG_GRAPH_FILENAME_BASE)_graphviz.txt
DIAG_GRAPH_FILE := $(OUTPUT_DIR_DIAG_GRAPHS)/$(DIAG_GRAPH_FILENAME_ONLY)

# Rule to create the GraphViz graph source file from the JavaScript files.
$(DIAG_GRAPH_FILE): $(SRC_FILES_JS)
	if [[ ! -d $(OUTPUT_DIR_DIAG_GRAPHS) ]]
	then
	    $(ECHO) Creating GraphViz source directory $(OUTPUT_DIR_DIAG_GRAPHS)
		$(MKDIR) -p $(OUTPUT_DIR_DIAG_GRAPHS)
	fi
	if [[ -s $(BUILD_DIR_SCRIPTS)/GraphMaker.py ]]
	then
		$(ECHO) Generating GraphViz source file $@
		$(PYTHON) $(BUILD_DIR_SCRIPTS)/GraphMaker.py --verbose --outputpath $(OUTPUT_DIR_DIAG_GRAPHS)/gsc2app $(SRC_FILES_JS)
		if [[ -s $@ ]]
		then
			$(ECHO) SUCCESS: Generated GraphViz source file $@
		else
			$(ECHO) ERROR: Could not generate GraphViz source file $@
		fi
	else
		$(ECHO) WARNING: No $(BUILD_DIR_SCRIPTS)/GraphMaker.py script to generate the GraphViz source file $@
	fi


# =================================================================================================
# 	10. (b) Rules for creating graph output files for the program documentation
# =================================================================================================
#
# Dynamically determine the name of the output GraphViz graph files.
OUTPUT_DOC_GRAPH_PNG := $(OUTPUT_DIR_DOC_GRAPHS)/$(DIAG_GRAPH_FILENAME_BASE).png
OUTPUT_DOC_GRAPH_PDF := $(OUTPUT_DIR_DOC_GRAPHS)/$(DIAG_GRAPH_FILENAME_BASE).pdf

# General the PNG form of the GraphViz documentation graph.
$(OUTPUT_DOC_GRAPH_PNG): $(DIAG_GRAPH_FILE)
	if [[ ! -d $(OUTPUT_DIR_DOC_GRAPHS) ]]
	then
	    $(ECHO) Creating GraphViz output directory $(OUTPUT_DIR_DOC_GRAPHS)
		$(MKDIR) -p $(OUTPUT_DIR_DOC_GRAPHS)
	fi
	$(ECHO) Generating GraphViz PNG output file $@
	$(DOT) -Tpng $< > $@
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated GraphViz PNG output file $@
	else
		$(ECHO) ERROR: Could not generate GraphViz PNG output file $@
	fi

# General the PDF form of the GraphViz documentation graph.
$(OUTPUT_DOC_GRAPH_PDF): $(DIAG_GRAPH_FILE)
	if [[ ! -d $(OUTPUT_DIR_DOC_GRAPHS) ]]
	then
	    $(ECHO) Creating GraphViz output directory $(OUTPUT_DIR_DOC_GRAPHS)
		$(MKDIR) -p $(OUTPUT_DIR_DOC_GRAPHS)
	fi
	$(ECHO) Generating GraphViz PDF output file $@
	$(DOT) -Tpdf $< > $@
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated GraphViz PDF output file $@
	else
		$(ECHO) ERROR: Could not generate GraphViz PDF output file $@
	fi


# =================================================================================================
# 	10. (c) Rules for creating JSDoc program documentation files
# =================================================================================================
#
# Choose one output file to trigger the generation of the output files.
OUTPUT_DOC_JSDOC_MAIN_FILE := $(OUTPUT_DIR_DOC_JS)/global.html

$(OUTPUT_DOC_JSDOC_MAIN_FILE): $(SRC_FILES_JS)
	if [[ ! -d $(OUTPUT_DIR_DOC_JS) ]]
	then
	    $(ECHO) Creating JSDoc output directory $(OUTPUT_DIR_DOC_JS)
		$(MKDIR) -p $(OUTPUT_DIR_DOC_JS)
	fi
	$(ECHO) Running JSDoc on the source JavaScript files
	$(JSDOC) -d $(OUTPUT_DIR_DOC_JS) $(SRC_FILES_JS)
	if [[ -s $@ ]]
	then
		$(ECHO) SUCCESS: Generated JSDoc output files
	else
		$(ECHO) ERROR: Could not generate JSDoc output files
	fi



# Main processing steps.

01_js_diags: $(DIAG_JSLINT_FILES)
	$(ECHO) ===== JavaScript diagnostics done

02_js_minimizer: $(MINIMIZED_JS_FILES)
	$(ECHO) ===== JavaScript files minimization done

03_js_combiner: $(OUTPUT_DIR_DIST_JS)/gsc2app.js
	$(ECHO) ===== Single combination JavaScript file done

04_js_hasher: $(OUTPUT_DIR_DIAG_JS)/sri_hashes_sed.txt
	$(ECHO) ===== SRI hash sed file done

05_html_transformer: \
		$(OUTPUT_DIR_DIST)/main.html \
		$(OUTPUT_DIR_DIST)/.htaccess \
		$(OUTPUT_DIR_DIST)/favicon.ico \
		$(OUTPUT_DIR_DIST)/robots.txt
	$(ECHO) ===== HTML transformation done

06_js_lib: $(DIST_LIB_JS_FILES)
	$(ECHO) ===== JavaScript library files done

07_courses: $(DIST_COURSE_FILES)
	if [[ ! -d $(OUTPUT_DIR_DIST_DATA_SCORECARDS) ]]
	then
	    $(ECHO) Creating scorecard output directory $(OUTPUT_DIR_DIST_DATA_SCORECARDS)
		$(MKDIR) -p $(OUTPUT_DIR_DIST_DATA_SCORECARDS)
	fi
	$(ECHO) ===== Course files done

08_css: $(DIST_CSS_FILES)
	$(ECHO) ===== CSS files done

09_api: $(DIST_API_FILES)
	$(ECHO) ===== API files done

10_doc: $(DIAG_GRAPH_FILE) $(OUTPUT_DOC_GRAPH_PNG) $(OUTPUT_DOC_GRAPH_PDF) $(OUTPUT_DOC_JSDOC_MAIN_FILE)
	$(ECHO) ===== Documentation files done


clean:
	$(RM) -r -f -d "$(OUTPUT_DIR_ROOT)"
	$(ECHO) ===== All clean

showvars:
	$(ECHO) BUILDENV = '$(BUILDENV)'
	$(ECHO) BASENAME = '$(BASENAME)'
	$(ECHO) CAT = '$(CAT)'
	$(ECHO) CP = '$(CP)'
	$(ECHO) CUT =  '$(CUT)'
	$(ECHO) DIRNAME = '$(DIRNAME)'
	$(ECHO) DOT =  '$(DOT)'
	$(ECHO) ECHO = '$(ECHO)'
	$(ECHO) FIND = '$(FIND)'
	$(ECHO) GAWK = '$(GAWK)'
	$(ECHO) GREP = '$(GREP)'
	$(ECHO) JSDOC = '$(JSDOC)'
	$(ECHO) JSHINT = '$(JSHINT)'
	$(ECHO) MKDIR = '$(MKDIR)'
	$(ECHO) OPENSSL = '$(OPENSSL)'
	$(ECHO) PYTHON = '$(PYTHON)'
	$(ECHO) RM = '$(RM)'
	$(ECHO) SED = '$(SED)'
	$(ECHO) TEE = '$(TEE)'
	$(ECHO) UGLIFYCSS = '$(UGLIFYCSS)'
	$(ECHO) UGLIFYJS = '$(UGLIFYJS)'
	$(ECHO) CURRENT_DIR = '$(CURRENT_DIR)'
	$(ECHO) SRC_DIR_ROOT = '$(SRC_DIR_ROOT)'
	$(ECHO) SRC_DIR_JS = '$(SRC_DIR_JS)'
	$(ECHO) SRC_FILES_JS = '$(SRC_FILES_JS)'
	$(ECHO) SRC_DIR_LIB = '$(SRC_DIR_LIB)'
	$(ECHO) SRC_DIR_LIB_JS = '$(SRC_DIR_LIB_JS)'
	$(ECHO) SRC_DIR_DATA = '$(SRC_DIR_DATA)'
	$(ECHO) SRC_DIR_DATA_COURSES = '$(SRC_DIR_DATA_COURSES)'
	$(ECHO) SRC_DIR_CSS = '$(SRC_DIR_CSS)'
	$(ECHO) SRC_DIR_API = '$(SRC_DIR_API)'
	$(ECHO) BUILD_DIR_ROOT = '$(BUILD_DIR_ROOT)'
	$(ECHO) BUILD_DIR_SCRIPTS = '$(BUILD_DIR_SCRIPTS)'
	$(ECHO) OUTPUT_DIR_ROOT = '$(OUTPUT_DIR_ROOT)'
	$(ECHO) OUTPUT_DIR_DIAG = '$(OUTPUT_DIR_DIAG)'
	$(ECHO) OUTPUT_DIR_DIAG_JS = '$(OUTPUT_DIR_DIAG_JS)'
	$(ECHO) OUTPUT_DIR_DIAG_JSLINT = '$(OUTPUT_DIR_DIAG_JSLINT)'
	$(ECHO) OUTPUT_DIR_DIAG_DOC = '$(OUTPUT_DIR_DIAG_DOC)'
	$(ECHO) OUTPUT_DIR_DIAG_GRAPHS = '$(OUTPUT_DIR_DIAG_GRAPHS)'
	$(ECHO) OUTPUT_DIR_DIAG_LIB = '$(OUTPUT_DIR_DIAG_LIB)'
	$(ECHO) OUTPUT_DIR_DIST = '$(OUTPUT_DIR_DIST)'
	$(ECHO) OUTPUT_DIR_DIST_JS = '$(OUTPUT_DIR_DIST_JS)'
	$(ECHO) OUTPUT_DIR_DIST_API = '$(OUTPUT_DIR_DIST_API)'
	$(ECHO) OUTPUT_DIR_DIST_CSS = '$(OUTPUT_DIR_DIST_CSS)'
	$(ECHO) OUTPUT_DIR_DIST_DATA = '$(OUTPUT_DIR_DIST_DATA)'
	$(ECHO) OUTPUT_DIR_DIST_DATA_COURSES = '$(OUTPUT_DIR_DIST_DATA_COURSES)'
	$(ECHO) OUTPUT_DIR_DIST_DATA_SCORECARDS = '$(OUTPUT_DIR_DIST_DATA_SCORECARDS)'
	$(ECHO) OUTPUT_DIR_DIST_LIB = '$(OUTPUT_DIR_DIST_LIB)'
	$(ECHO) OUTPUT_DIR_DIST_LIB_JS = '$(OUTPUT_DIR_DIST_LIB_JS)'
	$(ECHO) OUTPUT_DIR_DOC = '$(OUTPUT_DIR_DOC)'
	$(ECHO) OUTPUT_DIR_DOC_JS = '$(OUTPUT_DIR_DOC_JS)'
	$(ECHO) OUTPUT_DIR_DOC_GRAPHS = '$(OUTPUT_DIR_DOC_GRAPHS)'
	$(ECHO) SRI_HASH_ALGORITHM = '$(SRI_HASH_ALGORITHM)'
	$(ECHO) DIAG_JSLINT_FILES = '$(DIAG_JSLINT_FILES)'
	$(ECHO) MINIMIZED_JS_FILES = '$(MINIMIZED_JS_FILES)'
	$(ECHO) SRC_LIB_JS_FILES = '$(SRC_LIB_JS_FILES)'
	$(ECHO) DIST_LIB_JS_FILES = '$(DIST_LIB_JS_FILES)'
	$(ECHO) SRC_COURSE_FILES = '$(SRC_COURSE_FILES)'
	$(ECHO) DIST_COURSE_FILES = '$(DIST_COURSE_FILES)'
	$(ECHO) SRC_CSS_FILES = '$(SRC_CSS_FILES)'
	$(ECHO) DIST_CSS_FILES = '$(DIST_CSS_FILES)'
	$(ECHO) SRC_API_FILES = '$(SRC_API_FILES)'
	$(ECHO) DIST_API_FILES = '$(DIST_API_FILES)'
	$(ECHO) DIAG_GRAPH_FILENAME_BASE = '$(DIAG_GRAPH_FILENAME_BASE)'
	$(ECHO) DIAG_GRAPH_FILENAME_ONLY = '$(DIAG_GRAPH_FILENAME_ONLY)'
	$(ECHO) DIAG_GRAPH_FILE = '$(DIAG_GRAPH_FILE)'
	$(ECHO) OUTPUT_DOC_GRAPH_PNG = '$(OUTPUT_DOC_GRAPH_PNG)'
	$(ECHO) OUTPUT_DOC_GRAPH_PDF = '$(OUTPUT_DOC_GRAPH_PDF)'

test:
	echo Test done
	
analyze: 09_api
	$(ECHO) Analyzing the pre-build PHP source code files
	$(CURRENT_DIR)/vendor/bin/phpstan analyse --level 9 $(SRC_DIR_API)
	$(ECHO) Analyzing the post-build PHP source code files
	$(CURRENT_DIR)/vendor/bin/phpstan analyse --level 9 $(OUTPUT_DIR_DIST_API)
	$(ECHO) ===== PHP source code analysis done

.PHONY: all clean showvars intro test analyze \
		01_js_diags \
		02_js_minimizer \
		03_js_combiner \
		04_js_hasher \
		05_html_transformer \
		06_js_lib \
		07_courses \
		08_css \
		09_api \
		10_doc
.NOTPARALLEL:
.EXPORT_ALL_VARIABLES:
.ONESHELL:
.SUFFIXES:
.SUFFIXES: .js .jshint-output.txt .min.js .json .css .html .php
