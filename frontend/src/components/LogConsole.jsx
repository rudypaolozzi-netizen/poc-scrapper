import React, { useEffect, useRef } from 'react';

export default function LogConsole({ logs }) {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const getLogColor = (level) => {
        switch (level?.toUpperCase()) {
            case 'ERROR': return 'text-red-500 font-bold';
            case 'WARNING': return 'text-yellow-500';
            case 'INFO': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="bg-[#0D1117] text-green-400 p-4 rounded-lg font-mono text-xs md:text-sm h-64 overflow-y-auto border border-gray-800 shadow-inner flex flex-col gap-1 tracking-tight">
            {logs.length === 0 && <span className="opacity-30 italic">Ready to scrape...</span>}
            {logs.map((log, i) => (
                <div key={i} className={`${getLogColor(log.level)} break-words`}>
                    <span className="opacity-50 mr-2 text-[10px] uppercase">[{log.level || 'INFO'}]</span>
                    {log.message}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
}
