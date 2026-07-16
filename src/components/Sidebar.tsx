import { Activity, Calendar, AlertTriangle, BarChart3, Flame, Radio } from 'lucide-react';

export type PageId = 'home' | 'sentinel' | 'calendar' | 'incidents' | 'about';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: typeof Activity }[] = [
  { id: 'home', label: 'Live Status', icon: Activity },
  { id: 'sentinel', label: 'SentinelNode', icon: Radio },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'incidents', label: 'Incidents Log', icon: AlertTriangle },
  { id: 'about', label: 'Model Insights', icon: BarChart3 },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-scada-panel border-r border-scada-border fixed left-0 top-0 z-30">
        <div className="px-5 py-5 border-b border-scada-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-scada-red/10 border border-scada-red/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-scada-red" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-scada-textBright leading-tight">FIRE WATCH</h1>
              <p className="text-xs text-scada-textDim">Telecom Central Office</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-scada-accent/10 text-scada-accent border-l-2 border-scada-accent'
                    : 'text-scada-textDim hover:text-scada-text hover:bg-scada-panel2'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'animate-pulse-glow' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-scada-border">
          <div className="flex items-center gap-2 text-xs text-scada-textDim">
            <span className="status-dot bg-scada-green animate-pulse" />
            <span>System Online</span>
          </div>
          <p className="text-xs text-scada-textDim mt-1 font-mono">v1.0.0 · SCADA</p>
        </div>
      </aside>

      {/* Mobile top nav */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-30 bg-scada-panel border-b border-scada-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-scada-red" />
            <span className="text-sm font-bold text-scada-textBright">FIRE WATCH</span>
          </div>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`p-2 rounded-md transition-colors ${
                    active ? 'bg-scada-accent/10 text-scada-accent' : 'text-scada-textDim'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
