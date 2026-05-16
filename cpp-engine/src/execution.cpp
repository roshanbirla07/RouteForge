#include "execution.h"

#include <algorithm>
#include <unordered_set>

using std::find;
using std::to_string;
using std::unordered_set;
using std::vector;

namespace {
AlgorithmEvent makeEvent(const std::string& type, const vector<EventField>& fields) {
    return {type, fields};
}

TimelineFrame buildFrame(const ExecutionTimeline& timeline) {
    TimelineFrame frame;

    for (const AlgorithmEvent& event : timeline.events) {
        if (event.type == "visit_node") {
            for (const EventField& field : event.fields) {
                if (field.key == "node") {
                    const int node = std::stoi(field.value);
                    if (find(frame.visited.begin(), frame.visited.end(), node) == frame.visited.end()) {
                        frame.visited.push_back(node);
                    }

                    frame.active = {node};
                    frame.queue.erase(
                        std::remove(frame.queue.begin(), frame.queue.end(), node),
                        frame.queue.end());
                }
            }
        }

        if (event.type == "push_queue") {
            for (const EventField& field : event.fields) {
                if (field.key == "node") {
                    frame.queue.push_back(std::stoi(field.value));
                }
            }
        }

        if (event.type == "path_found") {
            frame.active.clear();
        }
    }

    return frame;
}
}

void AlgorithmContext::emit(const AlgorithmEvent& event) {
    timeline_.events.push_back(event);
    timeline_.frames.push_back(buildFrame(timeline_));
}

void AlgorithmContext::emitVisitNode(int node) {
    emit(makeEvent("visit_node", {{"node", to_string(node), false}}));
}

void AlgorithmContext::emitPushQueue(int node, int priority) {
    emit(makeEvent(
        "push_queue",
        {
            {"node", to_string(node), false},
            {"priority", to_string(priority), false}
        }));
}

void AlgorithmContext::emitRelaxEdge(int from, int to, int new_distance) {
    emit(makeEvent(
        "relax_edge",
        {
            {"from", to_string(from), false},
            {"to", to_string(to), false},
            {"newDistance", to_string(new_distance), false}
        }));
}

void AlgorithmContext::emitPathFound(const vector<int>& path, int distance) {
    emit(makeEvent(
        "path_found",
        {
            {"distance", to_string(distance), false},
            {"pathLength", to_string(static_cast<int>(path.size())), false}
        }));
}

const ExecutionTimeline& AlgorithmContext::timeline() const {
    return timeline_;
}

vector<int> AlgorithmContext::collectVisitedNodes() const {
    vector<int> visited_nodes;
    unordered_set<int> seen;

    for (const AlgorithmEvent& event : timeline_.events) {
        if (event.type != "visit_node") {
            continue;
        }

        for (const EventField& field : event.fields) {
            if (field.key != "node") {
                continue;
            }

            const int node = std::stoi(field.value);
            if (seen.insert(node).second) {
                visited_nodes.push_back(node);
            }
        }
    }

    return visited_nodes;
}

ExecutionResult buildExecutionResult(
    const ExecutionRequest& request,
    const PathResult& path_result,
    const AlgorithmContext& context) {
    return {
        request.algorithm,
        request.source,
        request.destination,
        path_result,
        context.collectVisitedNodes(),
        context.timeline()
    };
}
