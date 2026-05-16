#ifndef CPP_ENGINE_DIJKSTRA_H
#define CPP_ENGINE_DIJKSTRA_H

#include "execution.h"
#include "graph.h"
#include "plugins.h"

PathResult dijkstraShortestPath(
    const Graph& graph,
    int source,
    int destination,
    AlgorithmContext* context = nullptr);

class DijkstraPlugin : public AlgorithmPlugin {
public:
    std::string name() const override;
    PathResult run(const ExecutionRequest& request, AlgorithmContext& context) const override;
};

#endif
