#ifndef CPP_ENGINE_PLUGINS_H
#define CPP_ENGINE_PLUGINS_H

#include "execution.h"

#include <memory>
#include <string>
#include <unordered_map>

class AlgorithmPlugin {
public:
    virtual ~AlgorithmPlugin() = default;

    virtual std::string name() const = 0;
    virtual PathResult run(const ExecutionRequest& request, AlgorithmContext& context) const = 0;
};

class PluginRegistry {
public:
    void registerPlugin(std::unique_ptr<AlgorithmPlugin> plugin);
    const AlgorithmPlugin& require(const std::string& name) const;

private:
    std::unordered_map<std::string, std::unique_ptr<AlgorithmPlugin>> plugins_;
};

#endif
