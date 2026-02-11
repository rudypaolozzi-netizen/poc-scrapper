import React, { useState } from 'react';
import axios from 'axios';
import { useSSE } from './hooks/useSSE';
import ControlPanel from './components/ControlPanel';
import LogConsole from './components/LogConsole';
import ResultsTable from './components/ResultsTable';
import StatusBadge from './components/StatusBadge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [taskId, setTaskId] = useState(null);
  const { logs, results, status, error } = useSSE(taskId);

  const startScraping = async (params) => {
    try {
      const resp = await axios.post(`${API_URL}/api/scrape/start`, params);
      setTaskId(resp.data.task_id);
    } catch (e) {
      alert("Failed to start scraping: " + (e.response?.data?.detail || e.message));
    }
  };

  const stopScraping = async () => {
    if (!taskId) return;
    try {
      await axios.delete(`${API_URL}/api/scrape/stop/${taskId}`);
    } catch (e) {
      console.error(e);
      alert("Failed to stop: " + e.message);
    }
  };

  const exportCSV = () => {
    if (!taskId) return;
    window.location.href = `${API_URL}/api/scrape/results/${taskId}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800/50 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 tracking-tight">
              Scraper Dashboard
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 font-mono opacity-70">
              Technical Control Interface v1.0
            </p>
          </div>
          <StatusBadge />
        </header>

        {/* Status Bar (Mobile-friendly check) */}
        {status !== 'idle' && (
          <div className={`text-center text-xs py-1 rounded border ${status === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'bg-blue-900/10 border-blue-900/20 text-blue-400'} uppercase tracking-widest font-bold`}>
            Status: {status}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
          {/* Left Column: Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <ControlPanel onStart={startScraping} onStop={stopScraping} status={status} />

            <div className="hidden lg:block space-y-2">
              <h3 className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-widest">System Logs</h3>
              <LogConsole logs={logs} />
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded border border-red-500/20 text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* On mobile, logs might be better below? Or accessible via toggle? For now, stacking Logs above Results table on mobile */}
            <div className="lg:hidden space-y-2 mb-6">
              <h3 className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-widest">System Logs</h3>
              <LogConsole logs={logs} />
            </div>

            <ResultsTable results={results} onExport={results.length > 0 ? exportCSV : null} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
