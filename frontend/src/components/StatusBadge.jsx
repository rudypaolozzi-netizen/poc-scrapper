import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wifi, WifiOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function StatusBadge() {
    const [online, setOnline] = useState(null);

    useEffect(() => {
        const check = async () => {
            try {
                await axios.get(`${API_URL}/api/health`, { timeout: 2000 });
                setOnline(true);
            } catch (e) {
                setOnline(false);
            }
        };

        check();
        const interval = setInterval(check, 10000); // 10s poll
        return () => clearInterval(interval);
    }, []);

    if (online === null) return (
        <div className="flex items-center gap-2 text-[10px] text-slate-500 animate-pulse uppercase tracking-wider font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> Connecting...
        </div>
    );

    return (
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full ring-1 ring-inset transition-colors uppercase tracking-widest ${online ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]' : 'bg-red-500/10 text-red-500 ring-red-500/20'}`}>
            {online ? <Wifi size={10} /> : <WifiOff size={10} />}
            {online ? 'System Online' : 'Backend Offline'}
        </div>
    );
}
