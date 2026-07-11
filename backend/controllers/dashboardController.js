const sequelize = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    const whereClause = isAdmin ? '' : 'WHERE user_id = ?';
    const queryParams = isAdmin ? [] : [userId];
    const queryOptions = isAdmin 
      ? { type: sequelize.QueryTypes.SELECT } 
      : { replacements: queryParams, type: sequelize.QueryTypes.SELECT };

    const [resM, resG, resR, resP, resF] = await Promise.all([
      sequelize.query(`SELECT * FROM membres ${whereClause}`, queryOptions),
      sequelize.query(`SELECT * FROM groupes ${whereClause}`, queryOptions),
      sequelize.query(`SELECT * FROM reseaux ${whereClause}`, queryOptions),
      sequelize.query(`SELECT * FROM responsables ${whereClause}`, queryOptions),
      sequelize.query(`SELECT * FROM formations ${whereClause}`, queryOptions)
    ]);

    const totalMembres = resM.length;
    const totalGroupes = resG.length;
    const totalReseaux = resR.length;
    const totalResponsables = resP.length;
    const totalFormations = resF.length;
    const reseauxAutonomes = resR.filter(r => (r.Autonomie || r.autonomie) === 'Oui').length;

    const resumeData = [
      { subject: 'Membres', A: totalMembres },
      { subject: 'Groupes GS', A: totalGroupes },
      { subject: 'Formations', A: totalFormations },
      { subject: 'Réseaux', A: totalReseaux },
      { subject: 'Responsables', A: totalResponsables }
    ];

const ageData = [
      { 
        name: 'Jeunes (<25)', 
        value: resM.filter(m => (currentYear - (parseInt(m.annee_naissance) || 2000)) < 25).length 
      },
      { 
        name: 'Adultes (25-45)', 
        value: resM.filter(m => {
          const a = currentYear - (parseInt(m.annee_naissance) || 2000); 
          return a >= 25 && a <= 45;
        }).length 
      },
      { 
        name: 'Aînés (>45)', 
        value: resM.filter(m => (currentYear - (parseInt(m.annee_naissance) || 2000)) > 45).length 
      }
    ];

    const distributionGS = resG.reduce((acc, g) => {
      const year = g.date_creation ? new Date(g.date_creation).getFullYear() : 'Inconnu';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const evolutionGS = Object.keys(distributionGS).map(year => ({
      year,
      count: distributionGS[year],
      pourcentage: totalGroupes > 0 ? parseFloat(((distributionGS[year] / totalGroupes) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.year - b.year);

    const modules = [
      { id: 'gestionsimplifiee', label: 'Gestion' },
      { id: 'agroeco', label: 'Agro-Éco' },
      { id: 'nutrition', label: 'Nutrition' },
      { id: 'genre', label: 'Genre' },
      { id: 'autonomie', label: 'Autonome' }
    ];

const moduleStats = modules.map(mod => ({
      name: mod.label,
      valeur: resF.filter(f => {
        // Tsy mila "item = f.formation" intsony ianao
        // Jereo mivantana ny column ao amin'ny object f
        const val = f[mod.id]; 
        
        // Raha 'autonomie' ilay izy, integer izy fa tsy boolean
        if (mod.id === 'autonomie') {
            return val === 1 || val === true; 
        }
        
        // Raha boolean ny hafa (agroeco, etc)
        return val === true || val === 1 || val === 'true';
      }).length
    }));

    const normalizePoste = (txt) => txt ? txt.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    const respData = [
      { name: 'Président(e)', valeur: resP.filter(r => normalizePoste(r.Poste || r.poste).includes("presid")).length },
      { name: 'Secrétaire', valeur: resP.filter(r => normalizePoste(r.Poste || r.poste).includes("secr")).length },
      { name: 'Trésorier(e)', valeur: resP.filter(r => normalizePoste(r.Poste || r.poste).includes("treso")).length },
      { name: 'Conseiller(e)', valeur: resP.filter(r => normalizePoste(r.Poste || r.poste).includes("conseil")).length },
      { name: 'Membres', valeur: resP.filter(r => normalizePoste(r.Poste || r.poste).includes("membre")).length }
    ];

    res.json({
      success: true,
      kpis: {
        membres: totalMembres,
        groupes: totalGroupes,
        reseaux: totalReseaux,
        responsables: totalResponsables,
        formations: totalFormations,
        reseauxAutonomes
      },
      resumeData,
      ageData,
      moduleStats,
      respData,
      evolutionGS
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };