#include "astar.h"

#include <cmath>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

using std::abs;
using std::greater;
using std::pair;
using std::priority_queue;
using std::vector;

vector<int> reconstructPath(const vector<int>& parent, int source, int destination);

PathResult aStarShortestPath(const Graph& graph, int source, int destination, AlgorithmContext* context) {
    vector<int> distance(graph.size(), kInfinity);
    vector<int> parent(graph.size(), -1);

    using State = pair<int, int>;
    priority_queue<State, vector<State>, greater<State>> open_set;

    distance[source] = 0;
    const int source_priority = abs(source - destination);
    open_set.push({source_priority, source});
    if (context != nullptr) {
        context->emitPushQueue(source, source_priority);
    }

    while (!open_set.empty()) {
        const State current = open_set.top();
        open_set.pop();

        const int score = current.first;
        const int node = current.second;

        if (score > distance[node] + abs(node - destination)) {
            continue;
        }

        if (context != nullptr) {
            context->emitVisitNode(node);
        }

        if (node == destination) {
            break;
        }

        for (const Edge& edge : graph.adjacencyList()[node]) {
            if (distance[node] == kInfinity) {
                continue;
            }

            const int next_distance = distance[node] + edge.weight;
            if (next_distance < distance[edge.to]) {
                distance[edge.to] = next_distance;
                parent[edge.to] = node;
                const int priority = next_distance + abs(edge.to - destination);
                open_set.push({priority, edge.to});
                if (context != nullptr) {
                    context->emitRelaxEdge(node, edge.to, next_distance);
                    context->emitPushQueue(edge.to, priority);
                }
            }
        }
    }

    const PathResult result = {distance[destination], reconstructPath(parent, source, destination)};
    if (context != nullptr && result.reachable()) {
        context->emitPathFound(result.nodes, result.distance);
    }

    return result;
}

std::string AStarPlugin::name() const {
    return "astar";
}

PathResult AStarPlugin::run(const ExecutionRequest& request, AlgorithmContext& context) const {
    return aStarShortestPath(request.graph, request.source, request.destination, &context);
}
