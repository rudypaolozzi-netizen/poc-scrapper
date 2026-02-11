import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useSSE(taskId) {
    const [logs, setLogs] = useState([]);
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, connecting, streaming, completed, error
    const [error, setError] = useState(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        if (!taskId) {
            setStatus('idle');
            return;
        }

        // Reset state for new task
        setLogs([]);
        setResults([]);
        setError(null);
        setStatus('connecting');

        const es = new EventSource(`${API_URL}/api/scrape/stream/${taskId}`);
        eventSourceRef.current = es;

        es.onopen = () => {
            setStatus('streaming');
        };

        es.addEventListener('log', (event) => {
            try {
                const data = JSON.parse(event.data);
                setLogs(prev => [...prev, data]);
            } catch (e) {
                console.error('Failed to parse log event', e);
            }
        });

        es.addEventListener('result', (event) => {
            try {
                const data = JSON.parse(event.data);
                setResults(prev => [...prev, data]);
            } catch (e) {
                console.error('Failed to parse result event', e);
            }
        });

        es.addEventListener('done', (event) => {
            setStatus('completed');
            es.close();
        });

        es.addEventListener('error', (event) => {
            try {
                const data = JSON.parse(event.data);
                setError(data.message || 'Unknown error');
                setStatus('error');
                es.close();
            } catch (e) {
                // Native error event doesn't have data property usually if network error
                console.error('SSE Error Event', event);
                // Don't close immediately, let browser retry unless critical?
                // But for our API, 'event: error' implies backend logic error.
            }
        });

        es.onerror = (err) => {
            console.error('SSE Network Error', err);
            if (es.readyState === EventSource.CLOSED) {
                setStatus('error');
                setError('Connection lost');
            }
        };

        return () => {
            es.close();
        };
    }, [taskId]);

    return { logs, results, status, error };
}
