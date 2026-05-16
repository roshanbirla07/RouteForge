#include "astar.h"
#include "dijkstra.h"
#include "execution.h"
#include "graph.h"
#include "plugins.h"

#include <fstream>
#include <iostream>
#include <memory>
#include <regex>
#include <sstream>
#include <stdexcept>
#include <string>

using std::ifstream;
using std::make_unique;
using std::ostream;
using std::ostringstream;
using std::regex;
using std::regex_search;
using std::runtime_error;
using std::smatch;
using std::sregex_iterator;
using std::string;

void printResult(ostream& out, const string& algorithm, const PathResult& result);
void writeResultFile(const string& output_path, const ExecutionResult& result);

string readFile(const string& path) {
    ifstream input(path);
    if (!input) {
        throw runtime_error("Failed to open input file: " + path);
    }

    ostringstream buffer;
    buffer << input.rdbuf();
    return buffer.str();
}

int extractInt(const string& text, const string& key) {
    const regex pattern("\"" + key + "\"\\s*:\\s*(-?\\d+)");
    smatch match;

    if (!regex_search(text, match, pattern)) {
        throw runtime_error("Missing integer field: " + key);
    }

    return std::stoi(match[1].str());
}

bool extractBool(const string& text, const string& key, bool fallback) {
    const regex pattern("\"" + key + "\"\\s*:\\s*(true|false)");
    smatch match;

    if (!regex_search(text, match, pattern)) {
        return fallback;
    }

    return match[1].str() == "true";
}

string extractString(const string& text, const string& key, const string& fallback) {
    const regex pattern("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"");
    smatch match;

    if (!regex_search(text, match, pattern)) {
        return fallback;
    }

    return match[1].str();
}

Graph buildGraph(const string& text, int vertices, bool undirected) {
    Graph graph(vertices);
    const regex edge_pattern(R"(\[\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\])");

    for (sregex_iterator it(text.begin(), text.end(), edge_pattern), end; it != end; ++it) {
        const int u = std::stoi((*it)[1].str());
        const int v = std::stoi((*it)[2].str());
        const int w = std::stoi((*it)[3].str());
        graph.addEdge(u, v, w, false);

        if (undirected) {
            graph.addEdge(v, u, w, false);
        }
    }

    return graph;
}

ExecutionRequest loadInput(const string& path) {
    const string text = readFile(path);
    const string algorithm = extractString(text, "algorithm", "dijkstra");
    const int vertices = extractInt(text, "vertices");
    const int source = extractInt(text, "source");
    const int destination = extractInt(text, "destination");
    const bool undirected = extractBool(text, "undirected", true);

    return {algorithm, buildGraph(text, vertices, undirected), source, destination};
}

PluginRegistry buildPluginRegistry() {
    PluginRegistry registry;
    registry.registerPlugin(make_unique<DijkstraPlugin>());
    registry.registerPlugin(make_unique<AStarPlugin>());
    return registry;
}

int main() {
    const string input_path = "../input/input.json";
    const string output_path = "result.json";

    const ExecutionRequest request = loadInput(input_path);
    const PluginRegistry registry = buildPluginRegistry();
    AlgorithmContext context;
    const AlgorithmPlugin& plugin = registry.require(request.algorithm);
    const PathResult path_result = plugin.run(request, context);
    const ExecutionResult result = buildExecutionResult(request, path_result, context);

    printResult(std::cout, result.algorithm, result.path_result);
    writeResultFile(output_path, result);
    return 0;
}
