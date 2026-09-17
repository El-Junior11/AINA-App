const AuditLog = require('../models/AuditLog');

const getEntityLabel = (tableName, data) => {
    if (!data || typeof data !== 'object') {
        return 'Inconnu';
    }

    const table = String(tableName || '').toLowerCase();

    if (table.includes('membres')) {
        const nom = data.nom_membre || data.nom || '';
        const prenom = data.prenom_membre || data.prenom || '';
        const fullName = `${nom} ${prenom}`.trim();

        return fullName || `Membre ID ${data.nummembre || data.id || ''}`.trim();
    }

    if (table.includes('groupes')) {
        return (
            data.nomgs ||
            data.nom_groupe ||
            data.nom ||
            `Groupe ID ${data.codegs || data.id || ''}`.trim()
        );
    }

    if (table.includes('reseaux')) {
        return (
            data.NomRS ||
            data.nomRS ||
            data.nom_reseau ||
            data.nom ||
            `Réseau ID ${data.codeRS || data.id || ''}`.trim()
        );
    }

    return (
        data.nom ||
        data.name ||
        data.titre ||
        data.libelle ||
        `Élément ID ${data.id || ''}`.trim()
    );
};

const normalizeValue = (value) => {
    if (value === undefined) return null;
    if (value === null) return null;

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === 'object') {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return String(value);
        }
    }

    return value;
};

const valuesAreDifferent = (oldValue, newValue) => {
    const oldNormalized = normalizeValue(oldValue);
    const newNormalized = normalizeValue(newValue);

    return JSON.stringify(oldNormalized) !== JSON.stringify(newNormalized);
};

const logAction = (req, res, next) => {
    const originalSend = res.send;

    res.send = async function (body) {
        originalSend.apply(res, arguments);

        if (
            !['POST', 'PUT', 'DELETE'].includes(req.method) ||
            res.statusCode < 200 ||
            res.statusCode >= 300
        ) {
            return;
        }

        const tableName = req.originalUrl.split('/')[2] || 'inconnu';

        if (String(tableName).toLowerCase() === 'audit-logs') {
            return;
        }

        let details = {};

        if (req.method === 'POST') {
            const createdData =
                res.locals.createdData ||
                req.body ||
                {};

            details = {
                entity: getEntityLabel(tableName, createdData),
                data: createdData
            };
        }

        if (req.method === 'PUT') {
            const oldData = res.locals.oldData || {};
            const newData =
                res.locals.newData ||
                req.body ||
                {};

            const changes = {};

            Object.keys(req.body || {}).forEach((key) => {
                if (
                    [
                        'id',
                        'user_id',
                        'created_at',
                        'updated_at',
                        'createdAt',
                        'updatedAt'
                    ].includes(key)
                ) {
                    return;
                }

                if (
                    Object.prototype.hasOwnProperty.call(oldData, key) &&
                    valuesAreDifferent(oldData[key], newData[key])
                ) {
                    changes[key] = {
                        old: normalizeValue(oldData[key]),
                        new: normalizeValue(newData[key])
                    };
                }
            });

            details = {
                entity: getEntityLabel(tableName, oldData),
                changes
            };
        }

        if (req.method === 'DELETE') {
            const deletedData = res.locals.deletedData || {};

            details = {
                entity: getEntityLabel(tableName, deletedData),
                deleted_data: deletedData
            };
        }

        const auditData = {
            table_name: req.originalUrl,
            action_type: req.method,
            target_id:
                req.params.id &&
                req.params.id !== 'undefined'
                    ? req.params.id
                    : null,
            user_id: req.user?.user_id || null,
            details: JSON.stringify(details)
        };

        try {
            const createdAudit = await AuditLog.create(auditData);

            if (global.io) {
                global.io.emit('admin_alert', {
                    ...createdAudit.toJSON(),
                    details,
                    User: {
                        name: req.user?.name || 'Administrateur'
                    }
                });
            }
        } catch (error) {
            console.error("Erreur d'audit:", error);
        }
    };

    next();
};

module.exports = logAction;