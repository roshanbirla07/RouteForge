#ifndef CPP_ENGINE_EXECUTION_H
#define CPP_ENGINE_EXECUTION_H

#include "graph.h"

#include <string>
#include <vector>

struct EventField {
    std::string key;
    std::string value;
    bool is_string;
};

struct AlgorithmEvent {
    std::string type;
    std::vector<EventField> fields;
};

struct TimelineFrame {
    std::vector<int> visited;
    std::vector<int> active;
    std::vector<int> queue;
};

struct ExecutionTimeline {
    std::vector<AlgorithmEvent> events;
    std::vector<TimelineFrame> frames;
};

struct ExecutionRequest {
    std::string algorithm;
    Graph graph;
    int source;
    int destination;
};

struct ExecutionResult {
    std::string algorithm;
    int source;
    int destination;
    PathResult path_result;
    std::vector<int> nodes_visited;
    ExecutionTimeline timeline;
};

class AlgorithmContext {
public:
    void emit(const AlgorithmEvent& event);
    void emitVisitNode(int node);
    void emitPushQueue(int node, int priority);
    void emitRelaxEdge(int from, int to, int new_distance);
    void emitPathFound(const std::vector<int>& path, int distance);

    const ExecutionTimeline& timeline() const;
    std::vector<int> collectVisitedNodes() const;

private:
    ExecutionTimeline timeline_;
};

ExecutionResult buildExecutionResult(
    const ExecutionRequest& request,
    const PathResult& path_result,
    const AlgorithmContext& context);

#endif
