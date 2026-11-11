const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

const validId = v => /^\d+$/.test(String(v ?? '')) && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

exports.getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const selected = req.query.commune_id;
    const communeId = isAdmin ? (selected === undefined || selected === '' ? null : validId(selected)) : validId(req.user?.commune_id);

    if (isAdmin && selected !== undefined && selected !== '' && !communeId)
      return res.status(400).json({ success: false, message: 'Commune invalide.' });
    if (!isAdmin && !communeId)
      return res.status(403).json({ success: false, message: 'Commune non attribuée.' });

    const where = communeId ? ' WHERE commune_id = :communeId' : '';
    const options = { type: QueryTypes.SELECT, replacements: { communeId } };

    const [membres, groupes, reseaux, responsables, formations, menages, communes] = await Promise.all([
      sequelize.query(`SELECT nummembre, annee_naissance, sexe FROM membres${where}`, options),
      sequelize.query(`SELECT codegs, date_creation FROM groupes${where}`, options),
      sequelize.query(`SELECT "Autonomie" FROM reseaux${where}`, options),
      sequelize.query(`SELECT "Poste" FROM responsables${where}`, options),
      sequelize.query(`SELECT f.gestionsimplifiee, f.agroeco, f.nutrition, f.genre, f.autonomie
        FROM formations f JOIN membres m ON m.nummembre = f.nummembre
        WHERE f.deleted_at IS NULL${communeId ? ' AND m.commune_id = :communeId' : ''}`, options),
      sequelize.query(`SELECT id_menage FROM menages${where}`, options),
      isAdmin ? sequelize.query('SELECT id_commune, nom_commune FROM communes ORDER BY nom_commune', { type: QueryTypes.SELECT }) : Promise.resolve([])
    ]);

    const total = {
      membres: membres.length,
      groupes: groupes.length,
      reseaux: reseaux.length,
      responsables: responsables.length,
      formations: formations.length,
      menages: menages.length,
      reseauxAutonomes: reseaux.filter(r => String(r.Autonomie ?? '').trim().toLowerCase() === 'oui').length
    };

    const resumeData = [
      ['Membres', total.membres], ['Groupes GS', total.groupes],
      ['Formations', total.formations], ['Réseaux', total.reseaux],
      ['Responsables', total.responsables]
    ].map(([subject, A]) => ({ subject, A }));

    const year = new Date().getFullYear();
    const ages = membres.map(m => Number(m.annee_naissance))
      .filter(y => Number.isInteger(y) && y >= 1900 && y <= year)
      .map(y => year - y);

    const ageData = [
      { name: 'Jeunes (<25)', value: ages.filter(a => a < 25).length },
      { name: 'Adultes (25-45)', value: ages.filter(a => a >= 25 && a <= 45).length },
      { name: 'Aînés (>45)', value: ages.filter(a => a > 45).length }
    ];

    const years = groupes.reduce((acc, g) => {
      const date = g.date_creation ? new Date(g.date_creation) : null;
      const y = date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : 'Inconnu';
      acc[y] = (acc[y] || 0) + 1;
      return acc;
    }, {});

    const evolutionGS = Object.entries(years).map(([year, count]) => ({
      year, count, pourcentage: total.groupes ? Number((count * 100 / total.groupes).toFixed(1)) : 0
    })).sort((a, b) => a.year === 'Inconnu' ? 1 : b.year === 'Inconnu' ? -1 : Number(a.year) - Number(b.year));

    const modules = [
      ['gestionsimplifiee', 'Gestion'], ['agroeco', 'Agro-Éco'],
      ['nutrition', 'Nutrition'], ['genre', 'Genre'], ['autonomie', 'Autonome']
    ];

    const moduleStats = modules.map(([id, name]) => ({
      name, valeur: formations.filter(f => id === 'autonomie' ? Number(f.autonomie) === 1 : f[id] === true).length
    }));

    const normalize = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const postes = [
      ['Président(e)', 'presid'], ['Secrétaire', 'secr'],
      ['Trésorier(e)', 'treso'], ['Conseiller(e)', 'conseil'], ['Membres', 'membre']
    ];

    const respData = postes.map(([name, keyword]) => ({
      name, valeur: responsables.filter(r => normalize(r.Poste).includes(keyword)).length
    }));

    return res.json({
      success: true, isAdmin, commune_id: communeId, communes,
      kpis: total, resumeData, ageData, moduleStats, respData, evolutionGS
    });
  } catch (error) {
    console.error('Dashboard:', error);
    return res.status(500).json({ success: false, message: 'Erreur de chargement des statistiques.' });
  }
};