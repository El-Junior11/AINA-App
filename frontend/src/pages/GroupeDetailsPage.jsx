import React,{useEffect,useState,useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft,Users,MapPin,ShieldCheck} from 'lucide-react';
import {getGroupes} from '../services/groupeService';
import {AuthContext} from '../context/AuthContext';

export default function GroupeDetailsPage(){
  const navigate = useNavigate();
  const {isAdmin} = useContext(AuthContext);

  const [groupes,setGroupes] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');

  useEffect(()=>{
    getGroupes()
      .then(res=>{
        setGroupes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(e=>{
        setError(e.response?.data?.message || 'Impossible de charger les groupes');
      })
      .finally(()=>{
        setLoading(false);
      });
  },[]);

  const menages = new Set(
    groupes.flatMap(g=>
      String(g.nummenage || '')
        .split(',')
        .map(v=>`${g.commune_id}:${v.trim()}`)
        .filter(v=>!v.endsWith(':'))
    )
  );

  const communes = new Set(
    groupes.map(g=>g.commune_id).filter(Boolean)
  );

  const cards = [
    {
      title:'Groupes solidaires',
      value:groupes.length,
      icon:Users
    },
    {
      title:'Ménages rattachés',
      value:menages.size,
      icon:ShieldCheck
    },
    {
      title:'Communes couvertes',
      value:communes.size,
      icon:MapPin
    }
  ];

  return(
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-slate-900 dark:text-white">

      {/* Bouton retour */}
      <button
        onClick={()=>navigate('/groupes')}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        <ArrowLeft size={17}/>
        Retour aux groupes
      </button>

      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          Vue d'ensemble des groupes
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isAdmin ? 'Données de toutes les communes' : 'Données de votre commune'}
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          Chargement...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-600 dark:text-rose-400"
        >
          {error}
        </div>
      ) : (
        <>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {cards.map(({title,value,icon:Icon})=>(
              <div
                key={title}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Icon className="text-emerald-600 dark:text-emerald-400" size={25}/>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {title}
                  </p>

                  <p className="text-2xl font-semibold mt-1">
                    {value}
                  </p>
                </div>
              </div>
            ))}

          </div>

          {/* Tableau détaillé */}
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">

            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-semibold">
                Liste détaillée des groupes
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {groupes.length} groupe(s) enregistré(s)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3 font-semibold">Groupe</th>
                    <th className="p-3 font-semibold">Commune</th>
                    <th className="p-3 font-semibold">Fokontany</th>
                    <th className="p-3 font-semibold">Village</th>
                    <th className="p-3 font-semibold">Ménages</th>
                    <th className="p-3 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {groupes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-500 dark:text-slate-400"
                      >
                        Aucun groupe enregistré
                      </td>
                    </tr>
                  ) : (
                    groupes.map(g=>(
                      <tr
                        key={g.codegs}
                        className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 font-medium">
                          {g.nomgs}
                        </td>

                        <td className="p-3">
                          {g.commune || '-'}
                        </td>

                        <td className="p-3">
                          {g.fokontany || '-'}
                        </td>

                        <td className="p-3">
                          {g.village || '-'}
                        </td>

                        <td className="p-3">
                          {g.nummenage || '-'}
                        </td>

                        <td className="p-3">
                          {g.date_creation || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
}