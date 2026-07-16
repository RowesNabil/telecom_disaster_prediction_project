import { useEffect, useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle, Clock, Thermometer, Wind, TrendingUp } from 'lucide-react';
import { fetchIncidents } from '../lib/data';
import type { Incident } from '../lib/types';

type SortField = 'start_time' | 'duration' | 'peak_temperature' | 'peak_smoke' | 'peak_risk';
type SortDir = 'asc' | 'desc';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('start_time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchIncidents()
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const sorted = useMemo(() => {
    const arr = [...incidents];
    arr.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortField === 'duration') {
        aVal = new Date(a.end_time).getTime() - new Date(a.start_time).getTime();
        bVal = new Date(b.end_time).getTime() - new Date(b.start_time).getTime();
      } else if (sortField === 'start_time') {
        aVal = new Date(a.start_time).getTime();
        bVal = new Date(b.start_time).getTime();
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [incidents, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const formatDuration = (start: string, end: string): string => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const columns: { field: SortField; label: string; icon: typeof Clock }[] = [
    { field: 'start_time', label: 'Start Date', icon: Clock },
    { field: 'duration', label: 'Duration', icon: Clock },
    { field: 'peak_temperature', label: 'Peak Temp', icon: Thermometer },
    { field: 'peak_smoke', label: 'Peak Smoke', icon: Wind },
    { field: 'peak_risk', label: 'Peak Risk', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-scada-textDim font-mono text-sm animate-pulse">Loading incidents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-scada-red">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-mono text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-scada-textBright">Incidents Log</h2>
        <p className="text-sm text-scada-textDim mt-1">
          {incidents.length} historical incidents · Click column headers to sort
        </p>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-scada-border">
                <th className="px-4 py-3 text-left text-xs font-mono text-scada-textDim uppercase tracking-wide">
                  #
                </th>
                {columns.map((col) => {
                  const Icon = col.icon;
                  const active = sortField === col.field;
                  return (
                    <th key={col.field}>
                      <button
                        onClick={() => handleSort(col.field)}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-mono uppercase tracking-wide transition-colors ${
                          active ? 'text-scada-accent' : 'text-scada-textDim hover:text-scada-text'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {col.label}
                        {active && (
                          sortDir === 'asc'
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((inc, i) => {
                const startDate = new Date(inc.start_time);
                const endDate = new Date(inc.end_time);
                const duration = formatDuration(inc.start_time, inc.end_time);
                const riskPct = (inc.peak_risk * 100).toFixed(1);
                const isCritical = inc.peak_risk >= 0.7;

                return (
                  <tr
                    key={inc.id}
                    className="border-b border-scada-border/50 hover:bg-scada-panel2 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-scada-textDim">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-scada-text">
                        {startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                      </div>
                      <div className="font-mono text-xs text-scada-textDim mt-0.5">
                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-scada-text">{duration}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <span className={inc.peak_temperature >= 50 ? 'text-scada-red' : inc.peak_temperature >= 35 ? 'text-scada-orange' : 'text-scada-text'}>
                        {inc.peak_temperature.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <span className={inc.peak_smoke >= 20 ? 'text-scada-yellow' : 'text-scada-text'}>
                        {inc.peak_smoke.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <span
                        className={`font-bold ${isCritical ? 'text-scada-red' : 'text-scada-yellow'}`}
                      >
                        {riskPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
