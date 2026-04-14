#include <algorithm>
#include <functional>
#include <iostream>
#include <limits>
#include <queue>
#include <string>
#include <utility>
#include <vector>

class Graph {
public:
    explicit Graph(int vertices) : adjacency_list_(vertices) {}

    void addEdge(int from, int to, int weight, bool undirected = true) {
        adjacency_list_[from].push_back({to, weight});
        if (undirected) {
            adjacency_list_[to].push_back({from, weight});
        }
    }

    const std::vector<std::vector<std::pair<int, int>>>& getAdjacencyList() const {
        return adjacency_list_;
    }

    int size() const {
        return static_cast<int>(adjacency_list_.size());
    }

private:
    std::vector<std::vector<std::pair<int, int>>> adjacency_list_;
};

struct DijkstraResult {
    int distance;
    std::vector<int> path;
};

class DijkstraSolver {
public:
    static DijkstraResult shortestPath(const Graph& graph, int source, int destination) {
        const int inf = std::numeric_limits<int>::max();
        std::vector<int> distance(graph.size(), inf);
        std::vector<int> parent(graph.size(), -1);

        using State = std::pair<int, int>;
        std::priority_queue<State, std::vector<State>, std::greater<State>> min_heap;

        distance[source] = 0;
        min_heap.push({0, source});

        while (!min_heap.empty()) {
            const State current_state = min_heap.top();
            min_heap.pop();
            const int current_distance = current_state.first;
            const int node = current_state.second;

            if (current_distance > distance[node]) {
                continue;
            }

            if (node == destination) {
                break;
            }

            for (const auto& edge : graph.getAdjacencyList()[node]) {
                const int neighbor = edge.first;
                const int weight = edge.second;
                if (distance[node] != inf && distance[node] + weight < distance[neighbor]) {
                    distance[neighbor] = distance[node] + weight;
                    parent[neighbor] = node;
                    min_heap.push({distance[neighbor], neighbor});
                }
            }
        }

        return {distance[destination], reconstructPath(parent, source, destination)};
    }

private:
    static std::vector<int> reconstructPath(const std::vector<int>& parent, int source, int destination) {
        std::vector<int> path;

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
};

void printResult(const DijkstraResult& result, int source, int destination) {
    if (result.distance == std::numeric_limits<int>::max() || result.path.empty()) {
        std::cout << "No path exists from " << source << " to " << destination << ".\n";
        return;
    }

    std::cout << "Shortest distance: " << result.distance << '\n';
    std::cout << "Shortest path: ";

    for (std::size_t i = 0; i < result.path.size(); ++i) {
        std::cout << result.path[i];
        if (i + 1 < result.path.size()) {
            std::cout << " -> ";
        }
    }

    std::cout << '\n';
}

int main() {
    Graph graph(6);

    graph.addEdge(0, 1, 4);
    graph.addEdge(0, 2, 1);
    graph.addEdge(2, 1, 2);
    graph.addEdge(1, 3, 1);
    graph.addEdge(2, 3, 5);
    graph.addEdge(3, 4, 3);
    graph.addEdge(4, 5, 1);
    graph.addEdge(1, 5, 10);

    const int source = 0;
    const int destination = 5;

    const DijkstraResult result = DijkstraSolver::shortestPath(graph, source, destination);
    printResult(result, source, destination);

    return 0;
}
