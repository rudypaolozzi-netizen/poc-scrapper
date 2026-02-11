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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Source */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Source</label>
                        <div className="relative">
                            <select
                                name="source"
                                value={params.source}
                                onChange={handleChange}
                                disabled={isRunning}
                                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 appearance-none cursor-pointer hover:border-slate-700 w-full"
                            >
                                <option value="maps">Google Maps</option>
                                <option value="linkedin">LinkedIn</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Limite */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nb. Résultats</label>
                        <input
                            type="number"
                            name="limit"
                            value={params.limit}
                            onChange={handleChange}
                            min="1" max="100"
                            disabled={isRunning}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 w-full font-bold text-emerald-500"
                        />
                    </div>

                    {/* Métier */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Métier / Fonction</label>
                        <input
                            type="text"
                            name="sector"
                            value={params.sector}
                            onChange={handleChange}
                            placeholder="ex: Coiffeur, Directeur financier"
                            disabled={isRunning}
                            required
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 placeholder-slate-700 w-full"
                        />
                    </div>

                    {/* Ville */}
                    <div className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex justify-between">
                            Ville <span className="font-normal opacity-50 lowercase transition-opacity duration-300 group-hover:opacity-100 text-[10px]">(maps)</span>
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={params.city}
                            onChange={handleChange}
                            placeholder="ex: Clermont-Ferrand"
                            disabled={isRunning || params.source !== 'maps'}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-30 disabled:cursor-not-allowed placeholder-slate-700 w-full"
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
