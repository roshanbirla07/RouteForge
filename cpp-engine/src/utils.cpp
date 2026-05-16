#include "graph.h"
#include "execution.h"

#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

using std::ofstream;
using std::ostream;
using std::ostringstream;
using std::runtime_error;
using std::string;
using std::vector;

vector<int> reconstructPath(const vector<int>& parent, int source, int destination) {
    vector<int> path;

    if (source == destination) {
        path.push_back(source);
        return path;
    }

    if (parent[destination] == -1) {
        return path;
    }

    for (int node = destination; node != -1; node = parent[node]) {
        path.push_back(node);
    }

    std::reverse(path.begin(), path.end());
    return path;
}

string pathToJson(const vector<int>& path) {
    ostringstream out;
    out << "[";

    for (int i = 0; i < static_cast<int>(path.size()); ++i) {
        if (i > 0) {
            out << ", ";
        }
        out << path[i];
    }

    out << "]";
    return out.str();
}

string eventFieldsToJson(const vector<EventField>& fields) {
    ostringstream out;
    out << "{";

    for (int i = 0; i < static_cast<int>(fields.size()); ++i) {
        if (i > 0) {
            out << ", ";
        }

        out << "\"" << fields[i].key << "\": ";
        if (fields[i].is_string) {
            out << "\"" << fields[i].value << "\"";
        } else {
            out << fields[i].value;
        }
    }

    out << "}";
    return out.str();
}

string eventsToJson(const vector<AlgorithmEvent>& events) {
    ostringstream out;
    out << "[";

    for (int i = 0; i < static_cast<int>(events.size()); ++i) {
        if (i > 0) {
            out << ", ";
        }

        out << "{";
        out << "\"type\": \"" << events[i].type << "\"";

        if (!events[i].fields.empty()) {
            out << ", \"payload\": " << eventFieldsToJson(events[i].fields);
        }

        out << "}";
    }

    out << "]";
    return out.str();
}

string framesToJson(const vector<TimelineFrame>& frames) {
    ostringstream out;
    out << "[";

    for (int i = 0; i < static_cast<int>(frames.size()); ++i) {
        if (i > 0) {
            out << ", ";
        }

        out << "{";
        out << "\"visited\": " << pathToJson(frames[i].visited) << ", ";
        out << "\"active\": " << pathToJson(frames[i].active) << ", ";
        out << "\"queue\": " << pathToJson(frames[i].queue);
        out << "}";
    }

    out << "]";
    return out.str();
}

string resultToJson(const ExecutionResult& result) {
    ostringstream out;
    out << "{\n";
    out << "  \"algorithm\": \"" << result.algorithm << "\",\n";
    out << "  \"source\": " << result.source << ",\n";
    out << "  \"destination\": " << result.destination << ",\n";
    out << "  \"distance\": ";

    if (result.path_result.reachable()) {
        out << result.path_result.distance;
    } else {
        out << "null";
    }

    out << ",\n";
    out << "  \"path\": " << pathToJson(result.path_result.nodes) << ",\n";
    out << "  \"reachable\": " << (result.path_result.reachable() ? "true" : "false") << ",\n";
    out << "  \"nodesVisited\": " << pathToJson(result.nodes_visited) << ",\n";
    out << "  \"timeline\": {\n";
    out << "    \"events\": " << eventsToJson(result.timeline.events) << ",\n";
    out << "    \"frames\": " << framesToJson(result.timeline.frames) << "\n";
    out << "  }\n";
    out << "}\n";
    return out.str();
}

void printResult(ostream& out, const string& algorithm, const PathResult& result) {
    out << "Algorithm: " << algorithm << '\n';

    if (!result.reachable()) {
        out << "No path found\n";
        return;
    }

    out << "Distance: " << result.distance << '\n';
    out << "Path: ";

    for (int i = 0; i < static_cast<int>(result.nodes.size()); ++i) {
        if (i > 0) {
            out << " -> ";
        }
        out << result.nodes[i];
    }

    out << '\n';
}

void writeResultFile(const string& output_path, const ExecutionResult& result) {
    ofstream output(output_path);
    if (!output) {
        throw runtime_error("Failed to open output file: " + output_path);
    }

    output << resultToJson(result);
    output.flush();

    if (!output) {
        throw runtime_error("Failed to write output file: " + output_path);
    }
}
