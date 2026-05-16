#ifndef CPP_ENGINE_ASTAR_H
#define CPP_ENGINE_ASTAR_H

#include "execution.h"
#include "graph.h"
#include "plugins.h"

PathResult aStarShortestPath(
    const Graph& graph,
    int source,
    int destination,
    AlgorithmContext* context = nullptr);

class AStarPlugin : public AlgorithmPlugin {
public:
    std::string name() const override;
    PathResult run(const ExecutionRequest& request, AlgorithmContext& context) const override;
};

#endif
