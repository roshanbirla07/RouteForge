#ifndef CPP_ENGINE_GRAPH_H
#define CPP_ENGINE_GRAPH_H

#include <vector>

const int kInfinity = 2147483647;

struct Edge {
    int to;
    int weight;
};

struct PathResult {
    int distance;
    std::vector<int> nodes;

    bool reachable() const;
};

class Graph {
public:
    explicit Graph(int vertices);

    void addEdge(int from, int to, int weight, bool undirected = true);
    const std::vector<std::vector<Edge>>& adjacencyList() const;
    int size() const;

private:
    std::vector<std::vector<Edge>> adjacency_list_;
};

#endif
