import React from 'react';
import { Download } from 'lucide-react';

export default function ResultsTable({ results, onExport }) {
    if (!results || results.length === 0) return (
        <div className="text-center p-8 opacity-50 border border-dashed rounded-lg border-slate-700 text-slate-400 font-mono text-sm">
            No data collected yet. Start scraping to see results.
        </div>
    );

    return (
        <div className="w-full bg-slate-900/50 p-1 rounded-xl">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    Found Contacts <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-0.5 rounded-full">{results.length}</span>
                </h3>
                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition-all border border-slate-700 hover:border-slate-600 shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 custom-scrollbar">
                <table className="w-full text-left bg-slate-900 border-collapse">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                            <th className="px-4 py-3">Business Name</th>
                            <th className="px-4 py-3">Website</th>
                            <th className="px-4 py-3">Email Address</th>
                            <th className="px-4 py-3">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs md:text-sm text-slate-300">
                        {results.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors animate-fade-in group">
                                <td className="px-4 py-3 font-medium text-slate-100">{r.nom}</td>
                                <td className="px-4 py-3 truncate max-w-[150px] text-blue-400 group-hover:text-blue-300 transition-colors">
                                    {r.website ? (
                                        <a href={r.website} target="_blank" rel="noopener noreferrer" className="hover:underline opacity-80 hover:opacity-100">
                                            {r.website.replace(/^https?:\/\/(www\.)?/, '')}
                                        </a>
                                    ) : <span className="opacity-20">-</span>}
                                </td>
                                <td className="px-4 py-3 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                    {r.email ? (
                                        <a href={`mailto:${r.email}`} className="hover:underline flex items-center gap-1">
                                            {r.email}
                                        </a>
                                    ) : <span className="opacity-20">-</span>}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-400">
                                    {r.telephone ? (
                                        <a href={`tel:${r.telephone}`} className="hover:text-slate-200 transition-colors">{r.telephone}</a>
                                    ) : <span className="opacity-20">-</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
