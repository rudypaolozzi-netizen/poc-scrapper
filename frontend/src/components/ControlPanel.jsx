import React, { useState } from 'react';
import { Play, Square } from 'lucide-react';

export default function ControlPanel({ onStart, onStop, status }) {
    const [params, setParams] = useState({
        source: 'maps',
        sector: 'Coiffeur',
        city: 'Paris',
        limit: 10
    });

    const handleChange = (e) => {
        setParams({ ...params, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onStart(params);
    };

    const isRunning = status === 'streaming' || status === 'running' || status === 'connecting';

    return (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm shadow-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Source</label>
                        <select
                            name="source"
                            value={params.source}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 appearance-none cursor-pointer hover:border-slate-700"
                        >
                            <option value="maps">Google Maps</option>
                            <option value="linkedin">LinkedIn</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Start Limit</label>
                        <input
                            type="number"
                            name="limit"
                            value={params.limit}
                            onChange={handleChange}
                            min="1" max="100"
                            disabled={isRunning}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Keywords / Sector</label>
                        <input
                            type="text"
                            name="sector"
                            value={params.sector}
                            onChange={handleChange}
                            placeholder="e.g. Coiffeur"
                            disabled={isRunning}
                            required
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 placeholder-slate-700"
                        />
                    </div>

                    <div className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex justify-between">
                            City <span className="font-normal opacity-50 lowercase transition-opacity duration-300 group-hover:opacity-100 text-[10px]">(maps only)</span>
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={params.city}
                            onChange={handleChange}
                            placeholder="e.g. Bordeaux"
                            disabled={isRunning || params.source !== 'maps'}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-30 disabled:cursor-not-allowed placeholder-slate-700"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                    {isRunning ? (
                        <button
                            type="button"
                            onClick={onStop}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wide"
                        >
                            <Square size={16} fill="currentColor" /> Stop Process
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 hover:shadow-xl hover:shadow-emerald-500/20 text-sm uppercase tracking-wide group"
                        >
                            <Play size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /> Launch Scraper
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
