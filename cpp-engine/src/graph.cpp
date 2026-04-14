#include "graph.h"

bool PathResult::reachable() const {
    return distance != kInfinity && !nodes.empty();
}

Graph::Graph(int vertices) : adjacency_list_(vertices) {}

void Graph::addEdge(int from, int to, int weight, bool undirected) {
    adjacency_list_[from].push_back({to, weight});

    if (undirected) {
        adjacency_list_[to].push_back({from, weight});
    }
}

const std::vector<std::vector<Edge>>& Graph::adjacencyList() const {
    return adjacency_list_;
}

int Graph::size() const {
    return static_cast<int>(adjacency_list_.size());
}
