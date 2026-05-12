import {
  CirclePlus,
  Crosshair,
  LayoutGrid,
  Map,
  MousePointer2,
  Route,
  Trash2,
  Wand2
} from 'lucide-react';

const MODE_BUTTONS = [
  { mode: 'select', label: 'Select', icon: MousePointer2 },
  { mode: 'connect', label: 'Connect', icon: Crosshair },
  { mode: 'delete', label: 'Delete', icon: Trash2 }
];

const ACTION_BUTTONS = [
  { key: 'add', label: 'Add Node', icon: CirclePlus },
  { key: 'arrange', label: 'Auto Arrange', icon: LayoutGrid },
  { key: 'clear', label: 'Clear Graph', icon: Map }
];

export default function Toolbar({
  onAddNode,
  onAutoArrange,
  onClearGraph,
  onForgeRoute,
  onModeChange,
  interactionMode,
  algorithm,
  onAlgorithmChange,
  loading
}) {
  function handleAction(key) {
    if (key === 'add') {
      onAddNode();
      return;
    }

    if (key === 'arrange') {
      onAutoArrange();
      return;
    }

    onClearGraph();
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/72 px-3 py-2 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex items-center gap-2 rounded-full border border-white/6 bg-white/4 px-1.5 py-1">
        {ACTION_BUTTONS.map((button) => {
          const Icon = button.icon;

          return (
            <button
              key={button.key}
              type="button"
              title={button.label}
              aria-label={button.label}
              onClick={() => handleAction(button.key)}
              className="toolbar-icon-button"
            >
              <Icon size={16} strokeWidth={2.1} />
            </button>
          );
        })}
      </div>

      <div className="h-7 w-px bg-white/10" />

      <div className="flex items-center gap-2 rounded-full border border-white/6 bg-white/4 px-1.5 py-1">
        {MODE_BUTTONS.map((button) => {
          const Icon = button.icon;

          return (
            <button
              key={button.mode}
              type="button"
              title={button.label}
              aria-label={button.label}
              onClick={() => onModeChange(button.mode)}
              className={interactionMode === button.mode ? 'toolbar-icon-button toolbar-icon-active' : 'toolbar-icon-button'}
            >
              <Icon size={16} strokeWidth={2.1} />
            </button>
          );
        })}
      </div>

      <div className="h-7 w-px bg-white/10" />

      <div className="flex items-center gap-2 rounded-full border border-white/6 bg-white/4 px-1.5 py-1">
        <button
          type="button"
          title="Dijkstra"
          aria-label="Dijkstra"
          onClick={() => onAlgorithmChange('dijkstra')}
          className={algorithm === 'dijkstra' ? 'toolbar-icon-button toolbar-icon-active' : 'toolbar-icon-button'}
        >
          <Route size={15} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          title="A*"
          aria-label="A*"
          onClick={() => onAlgorithmChange('astar')}
          className={algorithm === 'astar' ? 'toolbar-icon-button toolbar-icon-active' : 'toolbar-icon-button'}
        >
          <Wand2 size={15} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          title="Forge Route"
          aria-label="Forge Route"
          onClick={onForgeRoute}
          disabled={loading}
          className="toolbar-icon-button toolbar-icon-forge"
        >
          {loading ? <span className="text-base leading-none">…</span> : <Route size={15} strokeWidth={2.3} />}
        </button>
      </div>
    </div>
  );
}
