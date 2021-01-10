#!/usr/bin/env python3
# GraphMaker.py -- Python 3 script to scan files for @@graph tags and process
# the related JSON objects to generate GraphViz input files.
# Copyright (c) 2020-2021 James Kottas.  All rights reserved.

import argparse
import glob
import json
import os
import re
import sys


# Module docstring
"""
GraphMaker.py -- Python 3 script to scan files for @@graph tags and process
the corresponding JSON objects to generate GraphViz input files for creating
the requested graphs.

The general structure of a @@graph tag is as follows:

    /*
        // Defining a graph:
        @@graph {
            'command': "definition",
            'graphtype': "code|workflow",
            'graphid': "<id-string>",
            'title': "<string>",
            'description': "<string>",
            'filenamesuffix': "<filename-string>"
        }

        // Populating the data for a graph:
        @@graph {
            ['command': "data",]
            'graphid': "<id-string>",
            'datatype': "node|edge",
        // Required attributes if type == "node":
            ['group': "<group-name>"],
            'nodename': "<node-name>",
            'nodetype': "class|function|member|property|variable|constant|event|eventhandler|state",
        // Required attributes if type == "edge":
            'fromnodename': "<node-name>",
            'tonodename': "<node-name>",
            ['edgetype': "normal|transition",]
            ['label': "<string>"]
        }
    */

where:

    'command' is one of:
            data            For specifying the node and edge data for a graph;
            definition      For defining a graph.  Must be done before any nodes
                            or edges are added to it (via its 'graphid' attribute);

    'graphtype' is one of:
            code            For creating a class/function structure graph.
            workflow        For creating a workflow graph.

    'graphid' is an alphanumeric string consisting of one or more of the following
            character typs:  uppercase letters (A-Z), lowercase letters (a-z),
            numbers (0-9), and the special characters ".", "_", and "-".  The
            'graphid' attribute is the link between a graph definition line and a
            graph data line.

    'title' is a string that contains the title for the graph.

    'description' is a string that describes the graph to a greater level of detail
            than the 'title' attribute.

    'filenamesuffix' is a string suffix that is appended onto the main output path
            to help the full filename be unique.  Must only contain characters
            that are valid filename characters.  Note that the output generation
            function will append an additional suffix and file extension that
            corresponds to the graph file format.

    'datatype' is one of:
            node            For defining a node in the graph.
            edge            For defining a transition or relationship from one
                            node to another node.

If the 'datatype' is "node", then the following attributes are required:

    'group' is an optional attribute, which if specified, it has a <group-name>
            value that is the name of the container for this node.

    'nodename' has a <node-name> value, which is the name for this node.

    'nodetype' is one of:
            class           For when the <node-name> represents a class.
            member          For when the <node-name> represents a member of a
                            class.
            property        For when the <node-name> represents a property of
                            a class.
            function        For when the <node-name> represents a function that
                            is not part of any class.
            variable        For when the <node-name> represents a variable that
                            is not part of any class.
            constant        For when the <node-name> represents a constant.
            event           For when the <node-name> represents an event.
            eventhandler    For when the <node-name> represents an event handler
                            function.
            state           For when the <node-name> represents a logical state.

If the 'datatype' is "edge", then the following attributes are required:

    'fromnodename' has a <node-name> value, which should be defined by a
            'datatype':"node" line, and should represent the starting node for
            the directed edge.

    'tonodename' has a <node-name> value, which should be defined by a
            'datatype':"node" line, and should represent the ending node for the
            directed edge.

    'edgetype' is an optional attribute, which if specified, should be one of:
            normal          For general relationships between nodes.  This is
                            the default value.
            transition      For transitions between the 'fromnodename' state to
                            the 'tonodename' state.

    'label' is an optional attribute, which if specified, it has a string value
            that will be used to label the edge arrow.

Notes:
    1. The quotation marks are required for the key names, but they may be single
       or double quotation marks.
    2. There can be only one @@graph tag per line.
    3. The @@graph tag may have a leading "*" character in front of it for multi-
       line comments where each line begins with a "*".
    4. The whitespace after the @@graph tag is optional, as is the whitespace
       around the JSON curly brace identifiers.
    5. The comment delimiters can be one of the following set, as appropriate
       for the language files being processed:

            Single-line comment formats:
                    /* @@graph {...} */
                    // @@graph {...}
                    # @@graph {...}

            Multi-line comment formats:
                    /*
                     * @@graph {...}
                     */

                    /* @@graph {
                            ...
                       }
                    */

                    // @@graph {
                    //      ...
                    // }

                    # @@graph {
                    #       ...
                    # }

Examples:

    Code Graph Example:

        // @@graph { 'command':"definition", 'graphtype':"code", 'graphid':"code1", 'description':"Sample code graph",
        //      'filenamesuffix':"_code_sample1" }
        // @@graph { 'graphid':"code1", 'datatype':"node", 'group':"gsc2app.Utilities", 'nodename':"gsc2app.Utilities.generateUUID", 'nodetype':"function" }
        // @@graph { 'graphid':"code1", 'datatype':"node", 'group':"gsc2app.Models",
        //      'nodename':"gsc2app.Models.StringField", 'nodetype':"class" }
        // @@graph
        //      { 'graphid':"code1", 'datatype':"node", 'group':"gsc2app.Collections", 'nodename':"gsc2app.Collections.StringFields", 'nodetype':"class" }
        // @@graph
        //      {
        //          'graphid': "code1",
        //          'datatype': "edge",
        //          'fromnodename': "gsc2app.Models.StringField",
        //          'tonodename': "gsc2app.Collections.StringFields",
        //          'edgetype': "normal"
        //      }

    Workflow Graph Example:

        /* @@graph { 'command':"definition", 'graphtype':"workflow", 'graphid':"workflow1",
                'description':"Sample workflow graph", 'filenamesuffix':"_workflow_sample1" }
        */
        /* @@graph { 'graphid':"workflow1", 'datatype':"node", 'nodename':"Enter Userspace", 'nodetype':"state" } * /
        /* @@graph {
                'graphid':"workflow1",
                'datatype':"node",
                'nodename':"Select Course",
                'nodetype':"state"
            }
        */
        /* @@graph */
        /*  { */
        /*      'graphid': "workflow1", 'datatype': "edge", 'fromnodename': "Enter Userspace", */
        /*      'tonodename': "Select Course", 'edgetype': "transition", */
        /*      'label': "Load Userspace Courses from Server" */
        /*  } */
"""

# ==================================================================================================
# Constants
# ==================================================================================================

VERSION: str = '1.0.4'          # This is the script version for reference.
GRAPHTAG: str = '@@graph'       # The tag to look for in the source files.

# Define the list of acceptable comment delimiters, in terms of pairs of
# starting and terminating delimiters.
COMMENT_DELIMITERS: list = [
    # First entry is the starting comment delimiter, second entry is the
    # terminating comment delimiter.  If the terminating comment delimiter
    # is empty, then the starting comment delimiter is for a single-line
    # comment.
    ['/*', '*/'],   # C, CSS, JavaScript
    ['//', ''],     # C, C++, JavaScript
    ['#', '']       # Python, Bash
]

# The available @@graph tag command attribute values:
COMMAND_DATA: str = 'data'
COMMAND_DEFINITION: str = 'definition'
COMMAND_DEFAULT: str = COMMAND_DATA

# The available "graphtype" attribute values:
GRAPHTYPE_CODE: str = 'code'
GRAPHTYPE_WORKFLOW: str = 'workflow'

# The available "datatype" attribute values:
DATATYPE_NODE: str = 'node'
DATATYPE_EDGE: str = 'edge'

# Default 'edgetype' attribute value:
EDGETYPE_DEFAULT: str = 'normal'

# Default output path with leading filename.
OUTPUT_PATH_DEFAULT: str = os.path.join(os.getcwd(), 'output')

# Output filename suffixes and extensions for the different graph file output formats.
OUTPUT_FILE_SUFFIX_GRAPHVIZ: str = '_graphviz.txt'      # Only one defined so far.


# ==================================================================================================
# Global Variables
# ==================================================================================================

verbose_mode: bool = False      # If True, print out detailed information during the lookup process.
debug_mode: bool = False        # If True, print out detailed debugging information.

# Input line processing variables
multiline_comment_active: bool = False          # If True, a multi-line comment with a @@graph tag is active.
multiline_comment_terminator: str = ''          # Set to the end delimiter for multi-line comment.
graphtag_object_json: str = ''                  # The JSON object string for the @@graph tag.

# If True, the current @@graph tag object extends across multiple lines, and we're not done reading it in.
still_reading_graphtag_object: bool = False

# Counters
num_errors: int = 0             # Number of errors that were detected.
num_warnings: int = 0           # Number of warnings that were detected.
num_graphtags: int = 0          # Number of @@graph tags that were found and processed.

# Graph collections
graphs: dict = {}               # Indexed by graphid.


# ==================================================================================================
# Configuration Settings for GraphViz
# ==================================================================================================

# Default node and edge settings.
DEFAULT_NODE_SETTINGS: str = 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"'
DEFAULT_EDGE_SETTINGS: str = 'color=black,pencolor=black'

# GraphViz attribute decoration strings for each "nodetype".
GraphVizNodeTypes: dict = {
    'class': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'function': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'member': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'property': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'variable': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'constant': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'event': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'eventhandler': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"',
    'state': 'shape=box,pencolor=blue,fillcolor=white,color=blue,fontsize=12,fontcolor=black,style=solid,newrank=false,rankdir="TB"'
}

# GraphViz attribute decoration strings for each "edgetype".
GraphVizEdgeTypes: dict = {
    'normal': '',
    'transition': ''
}


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
    Writes out the given message if in verbose mode.
    :param msg: The message to print out.
    :return: No return value.
    """
    global verbose_mode
    if verbose_mode:
        print(msg)


def write_debug_msg(msg: str) -> None:
    """
    Writes out the given message if in debug mode.
    :param msg: The message to print out.
    :return: No return value.
    """
    global debug_mode
    if debug_mode:
        print('DEBUG: ' + msg)


def write_warning_msg(msg: str) -> None:
    """
    Writes out a warning message.
    :param msg: The warning message to print out.
    :return: No return value.
    """
    global num_warnings
    print('WARNING: ' + msg)
    num_warnings += 1


def write_error_msg(msg: str) -> None:
    """
    Writes out an error message.
    :param msg: The error message to print out.
    :return: No return value.
    """
    global num_errors
    print('ERROR: ' + msg)
    num_errors += 1


def get_json_value(json_object, keyvalue: str, defvalue: str = '') -> str:
    """
    Retrieves the specified key value from the parsed JSON object.  If the key
    value does not exist, the default value is returned.
    :param json_object: The JSON object as parsed into a Python variable.
    :param keyvalue: The key name for the attribute to retrieve from the JSON
        object.
    :param defvalue: The default value to return if the key value is not present.
    :return: Returns the string value associated with the key value if it is
        present in the JSON object, otherwise the default value.
    """
    if json_object is None:
        return defvalue
    if keyvalue == '':
        return defvalue
    if keyvalue not in json_object:
        return defvalue
    v: str = json_object[keyvalue]
    return v


# ==================================================================================================
# Classes
# ==================================================================================================

class Node:
    """
    The Node class contains the information needed to generate a node within a graph.
    """
    def __init__(self, nodeid: str, nodename: str, nodetype: str, group: str = ''):
        """
        Initializes a new instance of the Node class.
        :param nodeid: ID string for this node which can be used to identify the
            node in the graph input file.
        :param nodename: The name for this node.
        :param nodetype: The type for this node.  Must be one of the keys in the
            GraphVizNodeTypes dictionary.
        :param group: Optional group name for the node, which will become a cluster
            for nodes with the same group name.
        :return: Does not return anything.
        """
        write_debug_msg('Creating new Node object with ' +
                        f'nodeid:"{nodeid}", nodename:"{nodename}", ' +
                        f'nodetype:"{nodetype}", group:"{group}"')
        self.node_id = nodeid
        self.node_name = nodename
        self.node_type = nodetype
        self.group = group

    def get_node_id(self) -> str:
        """
        :return: Returns the node ID for this node.
        """
        return self.node_id

    def get_node_name(self) -> str:
        """
        :return: Returns the name for this node.
        """
        return self.node_name

    def get_node_type(self) -> str:
        """
        :return: Returns the node type for this node.
        """
        return self.node_type

    def get_node_group(self) -> str:
        """
        :return: Returns the group containing this node.
        """
        return self.group


class Edge:
    """
    The Edge class contains the information needed to generate an edge from one node
    to another node within a graph.
    """
    def __init__(self, fromnodename: str, tonodename: str, label: str = '', edgetype: str = EDGETYPE_DEFAULT):
        """
        Initializes a new instance of the Node class.
        :param fromnodename: The name for the starting node for this edge.
        :param tonodename: The name for the ending node for this edge.
        :param label: Optional text to display on the edge.
        :param edgetype: Optional type for this edge.  Must be one of the keys in
            the GraphVizEdgeTypes dictionary.
        :return: Does not return anything.
        """
        write_debug_msg('Creating new Edge object with ' +
                        f'fromnodename:"{fromnodename}", tonodename:"{tonodename}", ' +
                        f'label:"{label}", edgetype:"{edgetype}"')
        self.from_node_name = fromnodename
        self.to_node_name = tonodename
        self.label = label
        self.edge_type = edgetype
        # Leave the node IDs empty so they can be determined later, in case they
        # haven't been defined yet.
        self.from_node_id = ''
        self.to_node_id = ''

    def get_from_node_name(self) -> str:
        """
        :return: Returns the name of the "from" node.
        """
        return self.from_node_name

    def get_to_node_name(self) -> str:
        """
        :return: Returns the name of the "to" node.
        """
        return self.to_node_name

    def get_from_node_id(self) -> str:
        """
        :return: Returns the node ID for the "from" node.
        """
        return self.from_node_id

    def get_to_node_id(self) -> str:
        """
        :return: Returns the node ID for the "to" node.
        """
        return self.to_node_id

    def set_from_node_id(self, new_id: str) -> None:
        """
        Sets the node ID for the "from" node.
        :return: Does not return anything.
        """
        self.from_node_id = new_id

    def set_to_node_id(self, new_id: str) -> None:
        """
        Sets the node ID for the "to" node.
        :return: Does not return anything.
        """
        self.to_node_id = new_id

    def get_edge_label(self) -> str:
        """
        :return: Returns the label to use for this edge.
        """
        return self.label

    def get_edge_type(self) -> str:
        """
        :return: Returns the edge type for this edge.
        """
        return self.edge_type


class Graph:
    """
    The Graph class contains the information needed to generate a graph file with the commands
    needed to render the graph.
    """
    def __init__(self, graphtype: str, graphid: str, title: str, description: str, filenamesuffix: str):
        """
        Initializes a new instance of the Graph class.
        :param graphtype: The type for this graph.  Must be either GRAPHTYPE_CODE or
            GRAPHTYPE_WORKFLOW.
        :param graphid: The ID string for this graph, which will be referenced by other @@graph
            data instances.  Must not be an empty string.
        :param title: The title for this graph.
        :param description: The description for this graph.  Must not be an empty string.
        :param filenamesuffix: The suffix to use for the output filename when graph output is
            generated.  Must not be an empty string.
        :return: Does not return anything.
        """
        write_debug_msg('Creating new Graph object with ' +
                        f'graphtype:"{graphtype}", graphid:"{graphid}", title:"{title}"' +
                        f'description:"{description}", filenamesuffix:"{filenamesuffix}"')
        self.graph_type = graphtype
        self.graph_id = graphid
        self.title = title
        self.description = description
        self.filename_suffix = filenamesuffix
        self.groups = []
        self.group_nodes = {}       # Each value is a list of indices into the self.nodes list.
        self.nodes = []
        self.edges = []
        self.node_name_to_id_map = {}

    def get_num_nodes(self) -> int:
        """
        Returns the number of nodes defined.
        :return: Returns the number of nodes defined.
        """
        return len(self.nodes)

    def get_num_edges(self) -> int:
        """
        Returns the number of edges defined.
        :return: Returns the number of edges defined.
        """
        return len(self.edges)

    def add_node(self, nodeid: str, nodename: str, nodetype: str, group: str = '') -> None:
        """
        Adds a new node to the graph with the given node name and node type.
        :param nodeid: The node ID to assign to this node.  It will be used to
            identify this node in the generated graph input file.
        :param nodename: The name of the new node.
        :param nodetype: The type of the node.  Must be one of the keys in the
            GraphVizNodeTypes dictionary.
        :param group: Optional group which will be a cluster of nodes.
        :return: Does not return anything.
        """
        new_node: Node = Node(nodeid, nodename, nodetype, group)
        node_index: int = len(self.nodes)
        self.nodes.append(new_node)

        # Map the node name to the node ID so that the ID can be found
        # efficiently given the node name.  Edges need this ability.
        # However, if the node ID is an empty string, don't update it
        # yet because the node may not have been defined yet.
        if nodeid != '':
            self.node_name_to_id_map[nodename] = nodeid

        # Update the list of groups, if this node is associated with group.
        if group != '':
            if group not in self.groups:
                self.groups.append(group)
            if group in self.group_nodes:
                # Add the index of the current node in self.nodes[] to the group node list.
                self.group_nodes[group].append(node_index)
            else:
                # First node for this group, so initialize the index array with it.
                self.group_nodes[group] = [node_index]

    def add_edge(self, fromnodename: str, tonodename: str, label: str = '', edgetype: str = EDGETYPE_DEFAULT) -> None:
        """
        Adds a new node to the graph with the given node name and node type.
        :param fromnodename: The name of the node from which the edge starts.
        :param tonodename: The name of the node to which the edge ends.
        :param label: Optional text label to show on the edge.
        :param edgetype: Optional type of the edge.  Must be one of the keys in
            the GraphVizEdgeTypes dictionary.
        :return: Does not return anything.
        """
        new_edge: Edge = Edge(fromnodename, tonodename, label, edgetype)
        self.edges.append(new_edge)

    def resolve_edge_node_ids(self) -> None:
        """
        Determines the node IDs for any of the edge nodes (from/to) that haven't
        been assigned yet.
        :return: Does not return anything.
        """
        for index in range(0, len(self.edges)):
            # First check the "from" node of the edge.
            if self.edges[index].get_from_node_id() == '':
                node_name: str = self.edges[index].get_from_node_name()
                if node_name in self.node_name_to_id_map:
                    self.edges[index].set_from_node_id(self.node_name_to_id_map[node_name])
                else:
                    write_error_msg(f'Edge "fromnodename" name never defined as a node: "{node_name}"')

            # Then check the "to" node of the edge.
            if self.edges[index].get_to_node_id() == '':
                node_name: str = self.edges[index].get_to_node_name()
                if node_name in self.node_name_to_id_map:
                    self.edges[index].set_to_node_id(self.node_name_to_id_map[node_name])
                else:
                    write_error_msg(f'Edge "tonodename" name never defined as a node: "{node_name}"')

    def generate_graph_output_graphviz(self, output_path: str) -> None:
        """
        Generates the output graph data file for this graph.
        :param output_path: The path and leading filename for all output files.  For
            example, if the output_path is r'.\\output\\graphs', the output file will
            append the graph-specified filename suffix along with '_graphviz.txt'
            as the final suffix and extension.
        :return: Does not return anything.
        """
        global OUTPUT_FILE_SUFFIX_GRAPHVIZ, DEFAULT_NODE_SETTINGS, DEFAULT_EDGE_SETTINGS
        full_output_path: str = output_path + self.filename_suffix + OUTPUT_FILE_SUFFIX_GRAPHVIZ
        try:
            write_debug_msg(f'Generating output graph file {full_output_path}')
            indent: str = '    '
            indent2: str = indent + indent
            with open(full_output_path, 'w') as outfile:
                outfile.write(f'// Graph file "{full_output_path}"\n')
                outfile.write('digraph {\n')
                if len(self.groups) > 0:
                    # There are groups, so create the clusters first, one cluster per group.
                    # Each cluster will contain the nodes that correspond to the cluster's group.
                    for index in range(0, len(self.groups)):
                        group_name: str = self.groups[index]
                        outfile.write('\n')
                        outfile.write(f'{indent}subgraph cluster_{(index + 1):02} {{\n')
                        outfile.write(f'{indent2}// This is group "{group_name}"\n')

                        # First write out the properties of the cluster.
                        outfile.write(f'{indent2}color = lightgrey;\n')
                        outfile.write(f'{indent2}label = "{group_name}";\n')
                        outfile.write(f'{indent2}color = black;\n')
                        outfile.write(f'{indent2}fontcolor = black;\n')
                        # Default node settings
                        outfile.write(f'{indent2}node [{DEFAULT_NODE_SETTINGS}];\n')

                        # Then write out the nodes.
                        for node_index in self.group_nodes[group_name]:
                            node: Node = self.nodes[node_index]
                            node_id: str = node.get_node_id()
                            if node_id != '':
                                node_name: str = node.get_node_name()
                                node_type: str = node.get_node_type()
                                node_attributes: str = ''
                                if node_type in GraphVizNodeTypes:
                                    node_attributes = GraphVizNodeTypes[node_type]
                                    if node_attributes != '':
                                        node_attributes += ','
                                outfile.write(f'{indent2}{node_id} [{node_attributes}label="{node_type}:\\n{node_name}"];\n')

                        # Finally, write out the internal edges.
                        # Note:  The directed internal edges between the nodes in each
                        # cluster are set to be invisible.  There is no connection
                        # between the in-cluster nodes (unless explicitly overwritten),
                        # but if these edges are not explicitly included, the GraphViz
                        # dot program lays out all nodes horizontally instead of
                        # vertically.
                        outfile.write(f'{indent2}edge [style="invis"];\n')
                        last_node_id: str = ''
                        counter: int = 0
                        for node_index in self.group_nodes[group_name]:
                            node: Node = self.nodes[node_index]
                            node_id: str = node.get_node_id()
                            if node_id != '':
                                counter += 1
                                if counter == 1:
                                    # This is the first node, so just save it in
                                    # preparation for the next node.
                                    last_node_id = node_id
                                else:
                                    # Write out the edge, which goes from the last
                                    # node ID to the current node ID.
                                    outfile.write(f'{indent2}{last_node_id} -> {node_id};\n')
                                    last_node_id = node_id

                        outfile.write(f'{indent}}}\n')
                else:
                    # There are no groups, so create the nodes first.
                    outfile.write(f'{indent}node [{DEFAULT_NODE_SETTINGS}];\n')
                    for node in self.nodes:
                        node_id: str = node.get_node_id()
                        if node_id != '':
                            node_name: str = node.get_node_name()
                            node_type: str = node.get_node_type()
                            node_attributes: str = ''
                            if node_type in GraphVizNodeTypes:
                                node_attributes = GraphVizNodeTypes[node_type]
                                if node_attributes != '':
                                    node_attributes += ','
                            outfile.write(f'{indent}{node_id} [{node_attributes}label="{node_type}:\\n{node_name}"];\n')

                # Now write out the edges.
                outfile.write('\n')
                outfile.write(f'{indent}edge [{DEFAULT_EDGE_SETTINGS}];\n')
                for edge in self.edges:
                    from_node_id: str = edge.get_from_node_id()
                    to_node_id: str = edge.get_to_node_id()
                    if from_node_id != '' and to_node_id != '':
                        edge_label: str = edge.get_edge_label()
                        edge_type: str = edge.get_edge_type()
                        edge_attributes: str = ''
                        if edge_type in GraphVizEdgeTypes:
                            edge_attributes = GraphVizEdgeTypes[edge_type]
                            if edge_attributes != '':
                                edge_attributes += ','
                        outfile.write(f'{indent}{from_node_id} -> {to_node_id} [{edge_attributes}label="{edge_label}"];\n')

                outfile.write('\n')
                outfile.write(f'{indent}// Graph title\n')
                outfile.write(f'{indent}labelloc = "t";\n')
                outfile.write(f'{indent}label = "{self.title}";\n')
                outfile.write('}\n')
            write_verbose_msg(f'Output graph file {full_output_path} generated successfully')
        except Exception as err:
            write_error_msg(f'Error generating GraphViz output file "{full_output_path}": {err}')


# ==================================================================================================
# Main Processing Functions
# ==================================================================================================

def process_graphs(output_path: str) -> None:
    """
    Once all of the @@graph tags have been read in and processed, this function
    performs the post-tag-processing functions, which involve the following steps:
    (a) Make sure all nodes have ID values for the edges, and (b) generating the
    output files, which are graph input files.
    :param output_path: The path and leading filename for all output files.  For
        example, if the output_path is r'.\\output\\graphs', the output files will
        append appropriate filename suffixes and extensions to this path to form
        the full output filenames (with path).
    :return: Does not return anything.
    """
    # First update the node IDs on the edges.
    for gkey in graphs.keys():
        write_debug_msg(f'Resolving node IDs for the edges in the graph with ID "{gkey}"')
        graphs[gkey].resolve_edge_node_ids()

    # Now generate the output files.
    for gkey in graphs.keys():
        write_debug_msg(f'Generating output graph files for the graph with ID "{gkey}"')
        # If more graph generators than GraphViz are supported, the selection of the
        # appropriate graph generator output function can be done here.
        graphs[gkey].generate_graph_output_graphviz(output_path)


def process_json(inputjson: str, sourcefilename: str, linenum: int) -> None:
    """
    Processes the given input string as a JSON object, which came from the
    specified source file.
    :param inputjson: The JSON object line from the source file to process.
    :param sourcefilename: The name of the source file from which the input JSON
        object came.  Used for diagnostic messages.
    :param linenum: The 1-based line number which corresponds to the input JSON
        object line.  Used for diagnostic messages.
    :return: Does not return anything.
    """
    global verbose_mode, debug_mode, num_errors, num_warnings, num_graphtags, graphs
    global GRAPHTAG, COMMAND_DATA, COMMAND_DEFAULT, COMMAND_DEFINITION
    global GRAPHTYPE_CODE, GRAPHTYPE_WORKFLOW, DATATYPE_NODE, DATATYPE_EDGE, EDGETYPE_DEFAULT
    global GraphVizNodeTypes, GraphVizEdgeTypes

    write_debug_msg(f'{GRAPHTAG} tag JSON string found in file "{sourcefilename}", line #{linenum}: {inputjson}')
    num_graphtags += 1
    try:
        # The Python JSON library does not like single-quotes, so convert single
        # quotation marks into double quotation marks.
        jchars: list = list(inputjson)
        double_quotes_active: bool = False
        for index in range(0, len(jchars)):
            if jchars[index] == '"':
                # Toggle the state of the double-quotes, because we don't want to
                # change and single quotes if they are enclosed within double-quotes.
                double_quotes_active = not double_quotes_active
                continue
            if jchars[index] == "'":
                if not double_quotes_active:
                    # We're not within double-quotes, so change this single-quote
                    # into a double-quote.
                    jchars[index] = '"'
        inputjson2: str = "".join(jchars)
        write_debug_msg(f'Sanitized JSON string before conversion:  {inputjson2}')

        # Convert the JSON string into a JSON object, python-style.
        json_decoder = json.JSONDecoder()
        json_object = json_decoder.decode(inputjson2)

        # Now validate that the JSON is okay.
        command: str = get_json_value(json_object, 'command')
        if command == '':
            command = COMMAND_DEFAULT
        if command != COMMAND_DATA and command != COMMAND_DEFINITION:
            raise Exception(f'Unknown {GRAPHTAG} command: "{command}"')

        if command == COMMAND_DEFINITION:
            # The definition command defines a graph.  It must have certain
            # attributes specified.
            graphtype: str = get_json_value(json_object, 'graphtype')
            if graphtype == '':
                raise Exception('Required attribute "graphtype" not found')
            if graphtype != GRAPHTYPE_CODE and graphtype != GRAPHTYPE_WORKFLOW:
                raise Exception(f'Unknown "graphtype" attribute "{graphtype}" specified, ' +
                                f'expecting "{GRAPHTYPE_CODE}" or "{GRAPHTYPE_WORKFLOW}"')

            graphid: str = get_json_value(json_object, 'graphid')
            if graphid == '':
                raise Exception('Required attribute "graphid" not found or is empty')

            title: str = get_json_value(json_object, 'title')
            if title == '':
                raise Exception('Required attribute "title" not found or is empty')

            description: str = get_json_value(json_object, 'description')
            if description == '':
                raise Exception('Required attribute "description" not found or is empty')

            filenamesuffix: str = get_json_value(json_object, 'filenamesuffix')
            if filenamesuffix == '':
                raise Exception('Required attribute "filenamesuffix" not found or is empty')

            new_graph = Graph(graphtype, graphid, title, description, filenamesuffix)
            graphs[graphid] = new_graph

        elif command == COMMAND_DATA:
            # The data command provides the nodes and edges for a graph.  Certain attributes
            # are required and others are optional.

            graphid: str = get_json_value(json_object, 'graphid')
            if graphid == '':
                raise Exception('Required attribute "graphid" not found or is empty')
            if graphid not in graphs:
                raise Exception(f'Attribute "graphid" has an unrecognized or undefined ID value "{graphid}"')

            datatype: str = get_json_value(json_object, 'datatype')
            if datatype == '':
                raise Exception('Required attribute "datatype" not found or is empty')
            if datatype != DATATYPE_NODE and datatype != DATATYPE_EDGE:
                raise Exception(f'Unknown "datatype" attribute "{datatype}" specified, ' +
                                f'expecting "{DATATYPE_NODE}" or "{DATATYPE_EDGE}"')
            if datatype == DATATYPE_NODE:
                # Start with the required attributes for a new node.

                nodename: str = get_json_value(json_object, 'nodename')
                if nodename == '':
                    raise Exception('Required attribute "nodename" not found or is empty')

                nodetype: str = get_json_value(json_object, 'nodetype')
                if nodetype == '':
                    raise Exception('Required attribute "nodetype" not found or is empty')
                if nodetype not in GraphVizNodeTypes:
                    possible_values: str = '|'.join(GraphVizNodeTypes.keys())
                    raise Exception(f'Unknown "nodetype" attribute "{nodetype}" specified, ' +
                                    f'expecting one of "{possible_values}"')

                # Optional attributes.
                group: str = get_json_value(json_object, 'group')

                # Determine the node ID to assign to this new node.
                num: int = graphs[graphid].get_num_nodes() + 1
                # The node ID is the letter "n" followed by an increasing number
                # that is tied to the current number of nodes defined.
                nodeid: str = f'n{num:02}'

                # Update this graph with the new node.
                graphs[graphid].add_node(nodeid, nodename, nodetype, group)

            elif datatype == DATATYPE_EDGE:
                # Start with the required attributes for a new edge.

                fromnodename: str = get_json_value(json_object, 'fromnodename')
                if fromnodename == '':
                    raise Exception('Required attribute "fromnodename" not found or is empty')

                tonodename: str = get_json_value(json_object, 'tonodename')
                if tonodename == '':
                    raise Exception('Required attribute "tonodename" not found or is empty')

                edgetype: str = get_json_value(json_object, 'edgetype')
                if edgetype == '':
                    edgetype = EDGETYPE_DEFAULT
                elif edgetype not in GraphVizEdgeTypes:
                    possible_values: str = '|'.join(GraphVizEdgeTypes.keys())
                    raise Exception(f'Unknown "edgetype" attribute "{edgetype}" specified, ' +
                                    f'expecting one of "{possible_values}"')

                # Optional attributes.
                label: str = get_json_value(json_object, 'label')

                # Update this graph with the new node.
                graphs[graphid].add_edge(fromnodename, tonodename, label, edgetype)

            else:
                raise Exception(f'Internal error with "datatype" attribute "{datatype}"')

    except Exception as err:
        msg: str = f'Error decoding {GRAPHTAG} JSON object from file "{sourcefilename}", line #{linenum}: {err}' +\
                   f'\nOriginal JSON string =  {inputjson}'
        write_error_msg(msg)


def process_line(inputline: str, sourcefilename: str, linenum: int) -> None:
    """
    Processes the given input line, which came from the specified source file.
    :param inputline: The input line from the source file to process.
    :param sourcefilename: The name of the source file from which the input
        line came.  Used for diagnostic messages.
    :param linenum: The 1-based line number which corresponds to the input line.
        Used for diagnostic messages.
    :return: Does not return anything.
    """
    global verbose_mode, debug_mode, num_errors, num_warnings
    global multiline_comment_active, multiline_comment_terminator, still_reading_graphtag_object
    global graphtag_object_json, COMMENT_DELIMITERS, GRAPHTAG

    # First, get rid of leading and trailing whitespace.
    bare_inputline: str = inputline.strip()
    if bare_inputline == '':
        # This an empty string so just ignore it.
        return

    # Then check to see if this line is a comment line.
    is_comment_line: bool = False
    for delim_pair in COMMENT_DELIMITERS:
        start_delim: str = delim_pair[0]
        pos: int = bare_inputline.find(start_delim)
        if pos == 0:
            # This is the start of a comment line.  Remove the starting comment
            # delimiter and check for the @@graph tag.
            bare_inputline = bare_inputline.replace(start_delim, '', 1).strip()
            is_comment_line = True
            multiline_comment_terminator = delim_pair[1]
            break

    is_graphtag_line: bool = False
    if is_comment_line:
        # This is a comment line, so it may contain a @@graph tag.
        pos: int = bare_inputline.find(GRAPHTAG)
        if pos == 0:
            # This is the start of a @@graph tag.
            is_graphtag_line = True
            bare_inputline = bare_inputline.replace(GRAPHTAG, '', 1).strip()
        if multiline_comment_terminator == '':
            # This is a single-line comment, but the @@graph tag could
            # be a continuation from the previous line.
            if is_graphtag_line:
                graphtag_object_json = bare_inputline
            elif still_reading_graphtag_object:
                graphtag_object_json += bare_inputline
            else:
                # Ignore this line since it is just a comment line.
                return
        else:
            # This could be a multi-line comment.  See if the comment is
            # terminated here.
            pos = bare_inputline.find(multiline_comment_terminator)
            if pos >= 0:
                # Yes, the multi-line comment is terminated here.
                bare_inputline = bare_inputline.replace(multiline_comment_terminator, '').strip()
                if is_graphtag_line:
                    graphtag_object_json = bare_inputline
                elif still_reading_graphtag_object:
                    graphtag_object_json += bare_inputline
            else:
                # No, the multi-line comment is not terminated here, so if
                # a @@graph tag is active, append this line to it.
                multiline_comment_active = True
                if still_reading_graphtag_object:
                    graphtag_object_json += bare_inputline
                else:
                    if is_graphtag_line:
                        # This is the start of a @@graph tag.
                        graphtag_object_json = bare_inputline
                    else:
                        # No, a @@graph tag is not active, so ignore this line.
                        return
    else:
        # This is not the start of a comment line, but it might be part of a
        # previously-opened comment line.
        if multiline_comment_active:
            # A multi-line comment is active, so see if this line terminates it.
            pos: int = bare_inputline.find(multiline_comment_terminator)
            if pos >= 0:
                # Yes, the multi-line comment is terminated here.
                multiline_comment_active = False
                bare_inputline = bare_inputline.replace(multiline_comment_terminator, '').strip()
                if still_reading_graphtag_object:
                    # Append the current line onto the JSON string accumulator.
                    graphtag_object_json += bare_inputline
                else:
                    # We are not reading in a @@graph tag JSON string, so ignore it.
                    return
            else:
                # No, the multi-line comment is not terminated here, so if
                # a @@graph tag is active, append this line to it.
                if still_reading_graphtag_object:
                    graphtag_object_json += bare_inputline
                else:
                    # No, a @@graph tag is not active.  See if this line has a
                    # @@graph tag.  Allow the @@graph tag to have a "*" character
                    # before it for typical mult-line comments in the form:
                    #       /*
                    #        * @@graph {...}
                    #        */
                    graphtag_regex: str = r'^\s*[*]?\s*' + GRAPHTAG
                    m: re.Match = re.search(graphtag_regex, bare_inputline)
                    if m is not None:
                        # This is the start of a @@graph tag.
                        is_graphtag_line = True
                        bare_inputline = re.sub(graphtag_regex, '', bare_inputline, 1).strip()
                        graphtag_object_json = bare_inputline
                    else:
                        # No @@graph tag line here, so ignore this line.
                        return
        else:
            # This line is not part of any comment, so ignore it.
            return

    if graphtag_object_json == '':
        if is_graphtag_line:
            # This line only has the @@graph tag on it, so continue reading
            # in the JSON object string.
            still_reading_graphtag_object = True
    else:
        # If we get there, there is at least a partial JSON string in
        # graphtag_object_json. See if it has the close brace.
        match: re.Match = re.search(r'}[^"]*$', graphtag_object_json)
        if match is None:
            # The JSON object is not closed yet, so keep reading.
            still_reading_graphtag_object = True
            return
        else:
            # Yes, the JSON object in the string is closed.
            graphtag_object_json = re.sub(r'}[^"]*$', '}', graphtag_object_json).strip()
            still_reading_graphtag_object = False
            process_json(graphtag_object_json, sourcefilename, linenum)
            graphtag_object_json = ''   # Clear the JSON string accumulator.


def main() -> bool:
    """
    Main program entry point.  Returns True.
    """
    global verbose_mode, debug_mode, num_errors, num_warnings, VERSION, GRAPHTAG

    # Start out by parsing the command line options and arguments.
    parser = argparse.ArgumentParser(prog='python %s' % sys.argv[0],
                                     usage='%(prog)s [options] [source-filename(s)]',
                                     description='Process source files for ' + GRAPHTAG +
                                                 ' tags and generate GraphViz input files.')

    # Define the options.
    parser.add_argument('-d', '--debug',
                        dest='opt_debug',
                        default=False,
                        action='store_true',
                        help='Print out debugging information during processing.  Implies verbose mode.')

    parser.add_argument('-o', '--outputpath',
                        dest='opt_output_path',
                        default=OUTPUT_PATH_DEFAULT,
                        action='store',
                        help='Set the path with leading filename for the output graph data file(s).')

    parser.add_argument('-v', '--verbose',
                        dest='opt_verbose',
                        default=False,
                        action='store_true',
                        help='Print out verbose information during the processing.')

    parser.add_argument('-V', '--version',
                        action='version',
                        version='%(prog)s version ' + VERSION,
                        help='Print out the version of the script.')

    # Define the arguments.
    parser.add_argument('source_files',
                        nargs='*',
                        action='store',
                        help='Source files with ' + GRAPHTAG + ' tags to process.')

    # Now parse out the arguments.
    args = parser.parse_args()

    # Process the options.
    debug_mode = args.opt_debug
    verbose_mode = args.opt_verbose or debug_mode

    if verbose_mode:
        write_verbose_msg(f'This is {sys.argv[0]} version {VERSION}')
        write_verbose_msg(f'Script to process {GRAPHTAG} tags in source files and generate GraphViz input files.')

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
                                process_line(inputline, srcfile, linenum)
                            num_files_processed += 1
            except Exception as err:
                write_error_msg(str(err))
    else:
        # No source files were specified on the command line, so read from standard input.
        num_files_processed = -1    # Negative value indicates stdin.
        linenum: int = 0
        for inputline in sys.stdin:
            linenum += 1
            process_line(inputline, '<stdin>', linenum)

    # Now do the final processing now that all of the graphing data has been read in.
    process_graphs(args.opt_output_path)

    if verbose_mode:
        write_verbose_msg('Summary of processing results:')
        write_verbose_msg(f'    {num_errors} error message{plural(num_errors)}')
        write_verbose_msg(f'    {num_warnings} warning message{plural(num_warnings)}')
        write_verbose_msg(f'    {num_graphtags} {GRAPHTAG} tag{plural(num_graphtags)} processed')
        if num_files_processed < 0:
            write_verbose_msg('    <stdin> processed')
        else:
            write_verbose_msg(f'    {num_files_processed} file{plural(num_files_processed)} processed')
    return True


if __name__ == "__main__":
    main()
