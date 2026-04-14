#include "dijkstra.h"

#include <functional>
#include <queue>
#include <utility>
#include <vector>

using std::greater;
using std::pair;
using std::priority_queue;
using std::vector;

vector<int> reconstructPath(const vector<int>& parent, int source, int destination);

PathResult dijkstraShortestPath(const Graph& graph, int source, int destination) {
    vector<int> distance(graph.size(), kInfinity);
    vector<int> parent(graph.size(), -1);

    using State = pair<int, int>;
    priority_queue<State, vector<State>, greater<State>> min_heap;

    distance[source] = 0;
    min_heap.push({0, source});

    while (!min_heap.empty()) {
        const State current = min_heap.top();
        min_heap.pop();

        const int current_distance = current.first;
        const int node = current.second;

        if (current_distance > distance[node]) {
            continue;
        }

        if (node == destination) {
            break;
        }

        for (const Edge& edge : graph.adjacencyList()[node]) {
            const int next_distance = distance[node] + edge.weight;

            if (distance[node] != kInfinity && next_distance < distance[edge.to]) {
                distance[edge.to] = next_distance;
                parent[edge.to] = node;
                min_heap.push({next_distance, edge.to});
            }
        }
    }

    return {distance[destination], reconstructPath(parent, source, destination)};
}
