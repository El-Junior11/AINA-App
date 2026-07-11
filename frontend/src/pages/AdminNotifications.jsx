import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, Clock, Trash2, Edit, PlusCircle, AlertCircle } from 'lucide-react';

// Mifandray amin'ny server backend
const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: true
});

const AdminNotifications = () => {
    const [logs, setLogs] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Hamarino ny fifandraisana
        socket.on('connect', () => {
            console.log("Connecté au serveur de notification:", socket.id);
            setIsConnected(true);
        });

        socket.on('admin_alert', (data) => {
            console.log("Nouvelle notification reçue:", data);
            setLogs((prevLogs) => [data, ...prevLogs]);
        });

        socket.on('connect_error', (err) => {
            console.error("Erreur de connexion socket:", err.message);
            setIsConnected(false);
        });

        return () => {
            socket.off('connect');
            socket.off('admin_alert');
            socket.off('connect_error');
        };
    }, []);

    const getActionInfo = (action) => {
        switch(action) {
            case 'DELETE': return { icon: <Trash2 size={16} />, color: 'text-red-500', bg: 'bg-red-50' };
            case 'PUT': return { icon: <Edit size={16} />, color: 'text-amber-500', bg: 'bg-amber-50' };
            case 'POST': return { icon: <PlusCircle size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' };
            default: return { icon: <Activity size={16} />, color: 'text-slate-500', bg: 'bg-slate-50' };
        }
    };

    const formatTableName = (url) => {
        const parts = url.split('/');
        return parts[2] || 'système';
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Activity className="text-indigo-600" /> Notifications d'activités
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Suivi des modifications en temps réel.</p>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>
            </div>

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <AlertCircle size={48} className="mb-2 opacity-50" />
                        <p>{isConnected ? "Aucune activité détectée pour le moment." : "Connexion au serveur..."}</p>
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const info = getActionInfo(log.action);
                        return (
                            <div 
                                key={index} 
                                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 hover:border-indigo-300 transition-colors animate-in fade-in slide-in-from-bottom-4"
                            >
                                <div className={`p-2 ${info.bg} rounded-full ${info.color}`}>
                                    {info.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                            {log.action === 'PUT' ? 'Modification' : log.action === 'POST' ? 'Création' : 'Suppression'}
                                        </h3>
                                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> {log.timestamp}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        <span className="font-semibold text-slate-900 dark:text-slate-200">{log.user}</span> a effectué une action 
                                        <code className="mx-1.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 dark:text-indigo-400">
                                            {log.action}
                                        </code> 
                                        sur la section 
                                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize ml-1">
                                            {formatTableName(log.table)}
                                        </span> 
                                        {log.id !== 'N/A' && ` (ID: ${log.id})`}.
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminNotifications;