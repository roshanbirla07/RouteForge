#include "graph.h"

#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using std::ofstream;
using std::ostream;
using std::ostringstream;
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

string resultToJson(const string& algorithm, int source, int destination, const PathResult& result) {
    ostringstream out;
    out << "{\n";
    out << "  \"algorithm\": \"" << algorithm << "\",\n";
    out << "  \"source\": " << source << ",\n";
    out << "  \"destination\": " << destination << ",\n";
    out << "  \"distance\": ";

    if (result.reachable()) {
        out << result.distance;
    } else {
        out << "null";
    }

    out << ",\n";
    out << "  \"path\": " << pathToJson(result.nodes) << ",\n";
    out << "  \"reachable\": " << (result.reachable() ? "true" : "false") << "\n";
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

void writeResultFile(
    const string& output_path,
    const string& algorithm,
    int source,
    int destination,
    const PathResult& result) {
    ofstream output(output_path);
    output << resultToJson(algorithm, source, destination, result);
}
