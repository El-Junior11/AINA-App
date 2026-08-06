const AuditLog = require('../models/AuditLog');

// Helper function hamantarana ny anarana marina (nom/titre) arakaraka ny table
const getEntityLabel = (tableName, data) => {
    if (!data) return "Inconnu";
    
    // Mampiasa ireo colonne hitantsika tao amin'ny \d
    if (tableName.includes('membres')) return `${data.nom_membre || ''} ${data.prenom_membre || ''}`.trim() || "Membre";
    if (tableName.includes('groupes')) return data.nomgs || "Groupe";
    if (tableName.includes('reseaux')) return data.NomRS || "Réseau";
    if (tableName.includes('responsables')) return `Poste: ${data.Poste || 'Non défini'}`;
    if (tableName.includes('formations')) return `Formation #${data.codeformation || 'ID'}`;
    
    return data.nom || data.titre || "Élément";
};

const logAction = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function (body) {
        originalSend.apply(res, arguments);

        if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
            const tableName = req.originalUrl.split('/')[2]; // Ohatra: 'membres'
            let details = {};

            if (req.method === 'PUT') {
                const oldData = res.locals.oldData || {};
                const newData = req.body;
                
                // Mampiasa ny helper hametraka ny anarana
                details.nom = getEntityLabel(tableName, oldData) !== "Inconnu" ? getEntityLabel(tableName, oldData) : getEntityLabel(tableName, newData);

                for (let key in newData) {
                    if (oldData[key] !== undefined && String(oldData[key]) !== String(newData[key])) {
                        details[key] = { old: oldData[key], new: newData[key] };
                    }
                }
            } else if (req.method === 'DELETE') {
                const deletedData = res.locals.deletedData || {};
                details = { 
                    message: `Suppression`,
                    nom: getEntityLabel(tableName, deletedData)
                };
            } else {
                details = req.body;
            }

            const auditData = {
                table_name: req.originalUrl,
                action_type: req.method,
                target_id: req.params.id || 'N/A',
                user_id: req.user ? req.user.user_id : null,
                details: JSON.stringify(details)
            };

            try {
                const savedLog = await AuditLog.create(auditData);
                if (global.io) {
                    global.io.emit('admin_alert', {
                        ...auditData,
                        details: details,
                        User: { name: req.user ? req.user.name : "Administrateur" },
                        created_at: new Date()
                    });
                }
            } catch (error) {
                console.error("Erreur d'audit:", error);
            }
        }
    };
    next();
};

module.exports = logAction;