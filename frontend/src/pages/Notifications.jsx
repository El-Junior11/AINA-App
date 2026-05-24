import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, ChevronLeft, Search, 
  Square, RefreshCw, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [notifications, setNotifications] = useState([
    { id: 1, sender: "Santana Velice", subject: "Modification de profil", message: "L'utilisateur a modifié son email et ses compétences en Fullstack.", date: "30 avr.", read: false },
    { id: 2, sender: "User_123", subject: "Suppression de compte", message: "Demande de suppression définitive du compte rattaché à cet ID.", date: "29 avr.", read: true },
  ]);

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [search, setSearch] = useState("");
  
useEffect(() => {
  // 1. Ampiasao ny 'role' fa tsy 'user_role' intsony
  const currentRole = localStorage.getItem('role'); 
  
  // Debug: Jereo eto ny valiny ao amin'ny Console (F12)
  console.log("Ny role voaray ao amin'ny LocalStorage dia:", currentRole);

  // 2. Fanamarinana ny fahazoan-dalana
  if (!currentRole || currentRole.trim().toLowerCase() !== 'admin') {
    Swal.fire({
      title: 'Accès refusé',
      text: 'Seul un administrateur peut voir les logs système.',
      icon: 'error',
      confirmButtonText: 'Hiverina',
      confirmButtonColor: '#2563eb'
    }).then(() => {
      navigate('/'); // Averina any amin'ny Home raha tsy admin
    });
  } else {
    setLoading(false); // Raha admin tokoa dia avela hijery ny pejy
  }
}, [navigate])

  const deleteNotif = (id, e) => {
    if(e) e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
    if(selectedNotif?.id === id) setSelectedNotif(null);
  };

  const filtered = notifications.filter(n => 
    n.sender.toLowerCase().includes(search.toLowerCase()) || 
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  // Miseho mandritra ny fanamarinana ny role
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white dark:bg-slate-950 transition-colors">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-slate-800">
        <div className="flex items-center gap-4">
          {selectedNotif ? (
            <button onClick={() => setSelectedNotif(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2 text-slate-400">
              <Square size={18} />
              <RefreshCw size={18} className="cursor-pointer hover:rotate-180 transition-transform duration-500" />
            </div>
          )}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
          {selectedNotif && (
            <button onClick={() => deleteNotif(selectedNotif.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 max-w-2xl px-4 text-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher dans les logs..." 
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedNotif ? (
          /* VIEW: DETAIL */
          <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{selectedNotif.subject}</h1>
            <div className="flex items-center justify-between mb-8 pb-4 border-b dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{selectedNotif.sender[0]}</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedNotif.sender}</p>
                  <p className="text-xs text-slate-500">Alertes de sécurité</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{selectedNotif.date}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
              {selectedNotif.message}
            </div>
          </div>
        ) : (
          /* VIEW: LIST */
          <div className="flex flex-col">
            {filtered.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => setSelectedNotif(notif)}
                className={`flex items-center px-4 py-3 border-b dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 ${notif.read ? 'opacity-60' : 'font-bold border-l-4 border-l-blue-600'}`}
              >
                <div className="min-w-[180px] text-sm text-slate-800 dark:text-slate-200 truncate">{notif.sender}</div>
                <div className="flex-1 text-sm text-slate-500 truncate px-4">{notif.subject} — {notif.message}</div>
                <div className="flex items-center gap-4 ml-auto">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{notif.date}</span>
                  <button onClick={(e) => deleteNotif(notif.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <AlertCircle size={40} className="mb-2 opacity-20" />
                <p className="text-sm italic">Aucun log trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;