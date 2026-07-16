import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchDailyRiskByMonth, fetchDailyRiskByDate, fetchIncidentsByDateRange } from '../lib/data';
import type { DailyRisk, Incident } from '../lib/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WARNING_THRESHOLD = 0.3;
const CRITICAL_THRESHOLD = 0.7;

function getDayColor(maxRisk: number): string {
  if (maxRisk >= CRITICAL_THRESHOLD) return 'bg-scada-red/80 text-white border-scada-red glow-red';
  if (maxRisk >= WARNING_THRESHOLD) return 'bg-scada-yellow/70 text-scada-bg border-scada-yellow';
  return 'bg-scada-green/20 text-scada-green border-scada-green/30';
}

function getDayDot(maxRisk: number): string {
  if (maxRisk >= CRITICAL_THRESHOLD) return 'bg-scada-red';
  if (maxRisk >= WARNING_THRESHOLD) return 'bg-scada-yellow';
  return 'bg-scada-green';
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [dailyData, setDailyData] = useState<Map<string, DailyRisk>>(new Map());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayData, setSelectedDayData] = useState<DailyRisk | null>(null);
  const [selectedIncidents, setSelectedIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyRiskByMonth(year, month);
      const map = new Map<string, DailyRisk>();
      data.forEach((d) => map.set(d.date, d));
      setDailyData(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (!selectedDay) return;
    Promise.all([
      fetchDailyRiskByDate(selectedDay),
      fetchIncidentsByDateRange(
        `${selectedDay}T00:00:00`,
        `${selectedDay}T23:59:59`
      ),
    ]).then(([dayData, incidents]) => {
      setSelectedDayData(dayData);
      setSelectedIncidents(incidents);
    });
  }, [selectedDay]);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthStats = Array.from(dailyData.values());
  const criticalCount = monthStats.filter((d) => d.had_critical).length;
  const warningCount = monthStats.filter((d) => d.had_warning && !d.had_critical).length;
  const normalCount = monthStats.filter((d) => !d.had_warning && !d.had_critical).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-scada-textBright">Risk Calendar</h2>
          <p className="text-sm text-scada-textDim mt-1">Daily risk levels · Click any day for details</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-scada-green" />
              <span className="text-scada-textDim">Normal ({normalCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-scada-yellow" />
              <span className="text-scada-textDim">Warning ({warningCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-scada-red" />
              <span className="text-scada-textDim">Critical ({criticalCount})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md text-scada-textDim hover:text-scada-text hover:bg-scada-panel2 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-scada-textBright">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md text-scada-textDim hover:text-scada-text hover:bg-scada-panel2 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-scada-textDim font-mono text-sm animate-pulse">Loading calendar...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-scada-red text-sm font-mono">{error}</div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAY_NAMES.map((day) => (
                <div key={day} className="text-center text-xs font-mono text-scada-textDim uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = dailyData.get(dateStr);
                const maxRisk = dayData?.max_risk ?? 0;
                const colorClass = dayData ? getDayColor(maxRisk) : 'bg-scada-panel2 text-scada-textDim border-scada-border';
                const isSelected = selectedDay === dateStr;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(dateStr)}
                    className={`relative aspect-square rounded-md border text-sm font-mono font-semibold transition-all duration-150 hover:scale-105 ${colorClass} ${
                      isSelected ? 'ring-2 ring-scada-accent' : ''
                    }`}
                  >
                    {day}
                    {dayData && (
                      <span
                        className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${getDayDot(maxRisk)}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="panel max-w-md w-full p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalIcon className="w-5 h-5 text-scada-accent" />
                <h3 className="text-lg font-bold text-scada-textBright">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-md text-scada-textDim hover:text-scada-text hover:bg-scada-panel2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedDayData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-scada-panel2 rounded-md p-3">
                    <p className="text-xs text-scada-textDim uppercase">Max Risk</p>
                    <p
                      className={`font-mono font-bold text-xl mt-1 ${
                        selectedDayData.max_risk >= CRITICAL_THRESHOLD
                          ? 'text-scada-red'
                          : selectedDayData.max_risk >= WARNING_THRESHOLD
                          ? 'text-scada-yellow'
                          : 'text-scada-green'
                      }`}
                    >
                      {(selectedDayData.max_risk * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-scada-panel2 rounded-md p-3">
                    <p className="text-xs text-scada-textDim uppercase">Avg Risk</p>
                    <p className="font-mono font-bold text-xl text-scada-text mt-1">
                      {(selectedDayData.avg_risk * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedDayData.had_critical && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-scada-red/10 border border-scada-red/30 text-scada-red text-xs font-mono">
                      <AlertTriangle className="w-3 h-3" /> Critical Event
                    </span>
                  )}
                  {selectedDayData.had_warning && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-scada-yellow/10 border border-scada-yellow/30 text-scada-yellow text-xs font-mono">
                      <AlertTriangle className="w-3 h-3" /> Warning Event
                    </span>
                  )}
                  {!selectedDayData.had_warning && !selectedDayData.had_critical && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-scada-green/10 border border-scada-green/30 text-scada-green text-xs font-mono">
                      <span className="status-dot bg-scada-green" /> Normal Day
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs text-scada-textDim uppercase mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> Incidents on this day
                  </p>
                  {selectedIncidents.length === 0 ? (
                    <p className="text-sm text-scada-textDim font-mono">No incidents recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedIncidents.map((inc) => (
                        <div key={inc.id} className="bg-scada-panel2 rounded-md p-3 border border-scada-border">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-scada-textDim">
                              {new Date(inc.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              {' – '}
                              {new Date(inc.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-mono text-xs text-scada-red font-bold">
                              {(inc.peak_risk * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs font-mono text-scada-textDim">
                            <span>Peak Temp: {inc.peak_temperature.toFixed(1)}°C</span>
                            <span>Smoke: {inc.peak_smoke.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-scada-textDim font-mono">No data available for this date</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
