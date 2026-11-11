import React, {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import axios from '../api/axios';

import { AuthContext } from '../context/AuthContext';

import {
  ArrowLeft,
  Users,
  House,
  ShieldCheck,
  UserRound,
  RefreshCw,
  ChartNoAxesCombined,
  MapPin
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#0284c7', '#e11d48'];

const panel =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm';

const field =
  'h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/30';

const StatistiquesMembres = () => {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'admin';

  const [membres, setMembres] = useState([]);
  const [communes, setCommunes] = useState([]);

  const [communeId, setCommuneId] = useState('all');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [communesError, setCommunesError] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      setCommunesError('');

      try {
        const token = localStorage.getItem('token');

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const [membresResult, communesResult] =
          await Promise.all([
            axios.get('/membres', config),

            isAdmin
              ? axios
                  .get('/auth/admin/communes', config)
                  .catch(err => {
                    console.error(
                      'Chargement des communes:',
                      err
                    );

                    return null;
                  })
              : Promise.resolve(null)
          ]);

        if (!active) return;

        if (!Array.isArray(membresResult.data)) {
          throw new Error(
            'Format de réponse membres inattendu'
          );
        }

        setMembres(membresResult.data);

        if (isAdmin) {
          if (
            communesResult &&
            Array.isArray(communesResult.data)
          ) {
            setCommunes(communesResult.data);
          } else {
            setCommunes([]);

            setCommunesError(
              'Liste des communes indisponible.'
            );
          }
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(
            err.response?.data?.message ||
            'Impossible de charger les membres.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [isAdmin, refreshKey]);

  // Membres visibles selon la commune sélectionnée

  const visible = useMemo(() => {
    if (!isAdmin || communeId === 'all') {
      return membres;
    }

    return membres.filter(
      m => String(m.commune_id) === communeId
    );
  }, [membres, isAdmin, communeId]);

  // Calcul des statistiques

  const stats = useMemo(() => {
    const hommes = visible.filter(
      m => m.sexe === 'Homme'
    ).length;

    const femmes = visible.filter(
      m => m.sexe === 'Femme'
    ).length;

    const chefs = visible.filter(
      m => m.chef === true
    ).length;

    // Identification des ménages
    // L'identifiant id_menage est prioritaire.

    const menages = new Set(
      visible
        .map(m => {
          if (m.id_menage != null) {
            return `id:${m.id_menage}`;
          }

          if (
            m.num_menage == null ||
            String(m.num_menage).trim() === ''
          ) {
            return null;
          }

          return `legacy:${m.commune_id ?? 'inconnue'}:${String(
            m.num_menage
          ).trim()}`;
        })
        .filter(Boolean)
    ).size;

    // Répartition par décennie de naissance

    const annees = new Map();

    visible.forEach(m => {
      const annee = Number(m.annee_naissance);

      if (
        !Number.isInteger(annee) ||
        annee < 1900 ||
        annee > new Date().getFullYear()
      ) {
        return;
      }

      const debut = Math.floor(annee / 10) * 10;

      const tranche = `${debut}–${debut + 9}`;

      annees.set(
        tranche,
        (annees.get(tranche) || 0) + 1
      );
    });

    return {
      total: visible.length,
      hommes,
      femmes,
      chefs,
      menages,

      genre: [
        {
          name: 'Hommes',
          value: hommes
        },
        {
          name: 'Femmes',
          value: femmes
        }
      ],

      naissances: [...annees]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periode, total]) => ({
          periode,
          total
        }))
    };
  }, [visible]);

  // Statistiques par commune

  const communesStats = useMemo(() => {
    if (!isAdmin) return [];

    return communes.map(c => {
      const id = c.id ?? c.id_commune;

      return {
        nom:
          c.nom ??
          c.nom_commune ??
          `Commune ${id}`,

        membres: membres.filter(
          m => String(m.commune_id) === String(id)
        ).length
      };
    });
  }, [communes, membres, isAdmin]);

  const cards = [
    {
      title: 'Total des membres',
      value: stats.total,
      Icon: Users,
      color: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40'
    },
    {
      title: 'Ménages représentés',
      value: stats.menages,
      Icon: House,
      color: 'text-violet-700 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40'
    },
    {
      title: 'Chefs de ménage',
      value: stats.chefs,
      Icon: ShieldCheck,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40'
    },
    {
      title: 'Hommes / Femmes',
      value: `${stats.hommes} / ${stats.femmes}`,
      Icon: UserRound,
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40'
    }
  ];

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* HEADER */}

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-5">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <span className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">

              <ChartNoAxesCombined size={20} />

            </span>

            <div>

              <h1 className="text-lg font-semibold">
                Statistiques des membres
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Analyse des membres et des ménages
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => navigate('/membres')}
            className={`${field} flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800`}
          >

            <ArrowLeft size={16} />

            Retour aux membres

          </button>

        </div>

      </header>

      {/* CONTENU */}

      <main className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">

        {/* FILTRES */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          <p className="text-sm text-slate-600 dark:text-slate-400">

            {isAdmin
              ? 'Vue administrateur · Données globales ou par commune'
              : 'Statistiques des membres accessibles à votre compte'}

          </p>

          <div className="flex flex-wrap gap-2 items-center">

            {isAdmin && (

              <label className="flex items-center gap-2 text-sm">

                <MapPin
                  size={16}
                  className="text-emerald-700"
                />

                <select
                  aria-label="Filtrer par commune"
                  className={field}
                  value={communeId}
                  onChange={e =>
                    setCommuneId(e.target.value)
                  }
                >

                  <option value="all">
                    Toutes les communes
                  </option>

                  {communes.map(c => (

                    <option
                      key={c.id ?? c.id_commune}
                      value={String(
                        c.id ?? c.id_commune
                      )}
                    >

                      {c.nom ?? c.nom_commune}

                    </option>

                  ))}

                </select>

              </label>

            )}

            <button
              type="button"
              onClick={() =>
                setRefreshKey(k => k + 1)
              }
              className={`${field} flex items-center gap-2`}
            >

              <RefreshCw size={16} />

              Actualiser

            </button>

          </div>

        </div>

        {communesError && (

          <p className="text-sm text-amber-700 dark:text-amber-400">
            {communesError}
          </p>

        )}

        {error && (

          <div className={`${panel} p-5 text-rose-700`}>
            {error}
          </div>

        )}

        {loading ? (

          <div className={`${panel} p-12 text-center text-slate-500`}>
            Chargement des statistiques...
          </div>

        ) : !error && (

          <>

            {/* CARTES STATISTIQUES */}

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

              {cards.map(
                ({
                  title,
                  value,
                  Icon,
                  color,
                  bg
                }) => (

                  <div
                    key={title}
                    className={`${panel} p-5 flex items-center gap-4`}
                  >

                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>

                      <Icon size={23} />

                    </span>

                    <div>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {title}
                      </p>

                      <p className="text-2xl font-semibold tabular-nums mt-1">
                        {value}
                      </p>

                    </div>

                  </div>

                )
              )}

            </section>

            {/* GRAPHIQUES */}

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* REPARTITION PAR SEXE */}

              <div className={`${panel} p-5`}>

                <h2 className="font-semibold mb-4">
                  Répartition par sexe
                </h2>

                {stats.hommes + stats.femmes > 0 ? (

                  <div className="h-72">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={stats.genre}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={95}
                          label
                        >

                          {stats.genre.map(
                            (item, index) => (

                              <Cell
                                key={item.name}
                                fill={COLORS[index]}
                              />

                            )
                          )}

                        </Pie>

                        <Tooltip />

                        <Legend />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                ) : (

                  <p className="text-sm text-slate-500 py-16 text-center">
                    Aucune donnée disponible.
                  </p>

                )}

              </div>

              {/* ANNEES DE NAISSANCE */}

              <div className={`${panel} p-5`}>

                <h2 className="font-semibold mb-4">
                  Répartition par décennie de naissance
                </h2>

                {stats.naissances.length ? (

                  <div className="h-72">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={stats.naissances}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          opacity={0.5}
                        />

                        <XAxis
                          dataKey="periode"
                        />

                        <YAxis
                          allowDecimals={false}
                        />

                        <Tooltip />

                        <Bar
                          dataKey="total"
                          name="Membres"
                          fill="#059669"
                          radius={[5, 5, 0, 0]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                ) : (

                  <p className="text-sm text-slate-500 py-16 text-center">
                    Aucune année de naissance exploitable.
                  </p>

                )}

              </div>

            </section>

            {/* MEMBRES PAR COMMUNE */}

            {isAdmin && communeId === 'all' && (

              <section className={`${panel} p-5`}>

                <h2 className="font-semibold mb-4">
                  Membres par commune
                </h2>

                {communesStats.length ? (

                  <div className="h-80">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={communesStats}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 35
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          opacity={0.5}
                        />

                        <XAxis
                          dataKey="nom"
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={65}
                        />

                        <YAxis
                          allowDecimals={false}
                        />

                        <Tooltip />

                        <Bar
                          dataKey="membres"
                          name="Membres"
                          fill="#0284c7"
                          radius={[5, 5, 0, 0]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                ) : (

                  <p className="text-sm text-slate-500">
                    Aucune commune disponible.
                  </p>

                )}

              </section>

            )}

            {/* NOTE */}

            <p className="text-xs text-slate-500 dark:text-slate-400">

              Les statistiques sont calculées à partir
              des membres accessibles via l'API.
              Les ménages sont comptés parmi les
              membres affichés.

            </p>

          </>

        )}

      </main>

    </div>
  );
};

export default StatistiquesMembres;