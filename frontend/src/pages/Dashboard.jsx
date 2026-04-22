import React from 'react';
import { Inbox } from 'lucide-react';

const Dashboard = () => {

  return (
    <div className="h-full flex flex-col">
      {/* --- VOTOATINY (CONTENT) IHANY SISA --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="max-w-md space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <Inbox size={48} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-800 dark:text-slate-200 text-xl font-medium">
            Votre boîte de réception est vide.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;