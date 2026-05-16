#include "plugins.h"

#include <stdexcept>

using std::move;
using std::runtime_error;
using std::unique_ptr;

void PluginRegistry::registerPlugin(unique_ptr<AlgorithmPlugin> plugin) {
    const std::string plugin_name = plugin->name();
    plugins_[plugin_name] = move(plugin);
}

const AlgorithmPlugin& PluginRegistry::require(const std::string& name) const {
    const auto plugin = plugins_.find(name);
    if (plugin == plugins_.end()) {
        throw runtime_error("Unsupported algorithm: " + name);
    }

    return *plugin->second;
}
