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

PathResult aStarShortestPath(const Graph& graph, int source, int destination) {
    vector<int> distance(graph.size(), kInfinity);
    vector<int> parent(graph.size(), -1);

    using State = pair<int, int>;
    priority_queue<State, vector<State>, greater<State>> open_set;

    distance[source] = 0;
    open_set.push({abs(source - destination), source});

    while (!open_set.empty()) {
        const State current = open_set.top();
        open_set.pop();

        const int score = current.first;
        const int node = current.second;

        if (score > distance[node] + abs(node - destination)) {
            continue;
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
                open_set.push({next_distance + abs(edge.to - destination), edge.to});
            }
        }
    }

    return {distance[destination], reconstructPath(parent, source, destination)};
}
