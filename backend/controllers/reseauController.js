const {QueryTypes} = require('sequelize');
const Reseau = require('../models/reseauModel');
const sequelize = require('../config/db');

const isAdmin = req => req.user?.role === 'admin';

const fail = (status,message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const errorResponse = (res,error) => res.status(error.status || 500).json({
  message:error.status ? error.message : 'Erreur interne du serveur.'
});

const parseId = value => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const parseGroupIds = body => {
  const ids = body.groupes_ids ?? body.groupesIds;

  if(!Array.isArray(ids) || !ids.length)
    fail(400,'Sélectionnez au moins un groupe solidaire (groupes_ids).');

  const parsed = ids.map(parseId);

  if(parsed.some(id=>!id) || new Set(parsed).size !== parsed.length)
    fail(400,'Identifiants de groupes invalides ou répétés.');

  return parsed;
};

const communeFor = (req,body,existing) => {
  if(!isAdmin(req)){
    const id = parseId(req.user?.commune_id);

    if(!id)
      fail(403,'Aucune commune attribuée à cet utilisateur.');

    if(existing && Number(existing.commune_id) !== id)
      fail(404,'Réseau introuvable.');

    return id;
  }

  if(existing?.commune_id){
    if(
      body.commune_id != null &&
      Number(body.commune_id) !== Number(existing.commune_id)
    ){
      fail(400,'Le changement de commune d’un réseau existant est interdit.');
    }

    return Number(existing.commune_id);
  }

  const id = parseId(body.commune_id);

  if(!id)
    fail(400,'Sélectionnez une commune valide.');

  return id;
};

const validateFlags = body => {
  const result = {};

  for(const key of ['Activite','Plaidoyer','Plan']){
    const value = body[key] ?? 'Non';

    if(value !== 'Oui' && value !== 'Non')
      fail(400,`${key} doit être Oui ou Non.`);

    result[key] = value;
  }

  result.Autonomie =
    ['Activite','Plaidoyer','Plan'].every(k=>result[k]==='Oui')
      ? 'Oui'
      : 'Non';

  return result;
};

const validateDate = value => {
  if(value == null || value === '') return null;

  if(
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ){
    fail(400,'DateCreation invalide (AAAA-MM-JJ).');
  }

  return value;
};

const findAuthorized = async (req,id,transaction) => {
  const where = {codeRS:id};

  if(!isAdmin(req)){
    const communeId = parseId(req.user?.commune_id);

    if(!communeId)
      fail(403,'Aucune commune attribuée.');

    where.commune_id = communeId;
  }

  const item = await Reseau.findOne({where,transaction});

  if(!item)
    fail(404,'Réseau introuvable ou accès refusé.');

  return item;
};

const communeExists = async (id,transaction) => {
  const rows = await sequelize.query(
    'SELECT nom_commune FROM communes WHERE id_commune = :id',
    {
      replacements:{id},
      type:QueryTypes.SELECT,
      transaction
    }
  );

  if(!rows.length)
    fail(400,'Commune inexistante.');

  return rows[0].nom_commune;
};

const groupsInCommune = async (ids,communeId,transaction) => {
  const groups = await sequelize.query(
    `SELECT codegs, nomgs
     FROM groupes
     WHERE codegs IN (:ids)
       AND commune_id = :communeId
     ORDER BY codegs`,
    {
      replacements:{ids,communeId},
      type:QueryTypes.SELECT,
      transaction
    }
  );

  if(groups.length !== ids.length)
    fail(400,'Un ou plusieurs groupes sont inexistants ou hors de cette commune.');

  return groups;
};

const linkGroups = async (codeRS,groups,transaction) => {
  await sequelize.query(
    'DELETE FROM reseau_groupes WHERE "codeRS" = :codeRS',
    {
      replacements:{codeRS},
      transaction
    }
  );

  for(const group of groups){
    await sequelize.query(
      `INSERT INTO reseau_groupes ("codeRS",codegs)
       VALUES (:codeRS,:codegs)`,
      {
        replacements:{codeRS,codegs:group.codegs},
        transaction
      }
    );
  }
};

const decorate = async (items,transaction) => {
  if(!items.length) return [];

  const ids = items.map(r=>r.codeRS);

  const links = await sequelize.query(
    `SELECT rg."codeRS",g.codegs,g.nomgs
     FROM reseau_groupes rg
     JOIN groupes g ON g.codegs=rg.codegs
     WHERE rg."codeRS" IN (:ids)
     ORDER BY g.nomgs`,
    {
      replacements:{ids},
      type:QueryTypes.SELECT,
      transaction
    }
  );

  const communeIds = [
    ...new Set(items.map(r=>r.commune_id).filter(Boolean))
  ];

  const communes = communeIds.length
    ? await sequelize.query(
        `SELECT id_commune,nom_commune
         FROM communes
         WHERE id_commune IN (:ids)`,
        {
          replacements:{ids:communeIds},
          type:QueryTypes.SELECT,
          transaction
        }
      )
    : [];

  const names = new Map(
    communes.map(c=>[Number(c.id_commune),c.nom_commune])
  );

  return items.map(item=>{
    const row = typeof item.toJSON === 'function'
      ? item.toJSON()
      : item;

    const groups = links.filter(
      l=>Number(l.codeRS) === Number(row.codeRS)
    );

    return {
      ...row,
      NomCommune:names.get(Number(row.commune_id)) || null,
      groupes_ids:groups.map(g=>g.codegs),
      groupes:groups.map(g=>({
        codegs:g.codegs,
        nomgs:g.nomgs
      }))
    };
  });
};

exports.getAllReseaux = async (req,res) => {
  try{
    const where = {};

    if(isAdmin(req)){
      if(req.query.commune_id != null && req.query.commune_id !== ''){
        const id = parseId(req.query.commune_id);

        if(!id)
          fail(400,'Filtre commune invalide.');

        where.commune_id = id;
      }
    }else{
      const id = parseId(req.user?.commune_id);

      if(!id)
        fail(403,'Aucune commune attribuée.');

      where.commune_id = id;
    }

    const rows = await Reseau.findAll({
      where,
      order:[['codeRS','DESC']]
    });

    res.json(await decorate(rows));
  }catch(error){
    errorResponse(res,error);
  }
};

exports.getReseauById = async (req,res) => {
  try{
    const id = parseId(req.params.id);

    if(!id)
      fail(400,'Identifiant invalide.');

    const item = await findAuthorized(req,id);

    res.json((await decorate([item]))[0]);
  }catch(error){
    errorResponse(res,error);
  }
};

exports.createReseau = async (req,res) => {
  try{
    if(!req.user?.user_id)
      fail(401,'Utilisateur non authentifié.');

    const communeId = communeFor(req,req.body);
    const nom = String(req.body.NomRS || '').trim();

    if(!nom || nom.length > 255)
      fail(400,'NomRS est obligatoire (255 caractères maximum).');

    const ids = parseGroupIds(req.body);
    const flags = validateFlags(req.body);
    const date = validateDate(req.body.DateCreation);

    const result = await sequelize.transaction(async transaction=>{
      await communeExists(communeId,transaction);

      const groups = await groupsInCommune(ids,communeId,transaction);

      const item = await Reseau.create({
        NomRS:nom,
        NomGS:groups.map(g=>g.nomgs).join(', '),
        commune_id:communeId,
        DateCreation:date,
        ...flags,
        user_id:req.user.user_id
      },{transaction});

      await linkGroups(item.codeRS,groups,transaction);

      return (await decorate([item],transaction))[0];
    });

    res.locals.createdData = result;

    res.status(201).json({
      message:'Réseau créé avec succès !',
      data:result
    });
  }catch(error){
    errorResponse(res,error);
  }
};

exports.updateReseau = async (req,res) => {
  try{
    const id = parseId(req.params.id);

    if(!id)
      fail(400,'Identifiant invalide.');

    const result = await sequelize.transaction(async transaction=>{
      const item = await findAuthorized(req,id,transaction);
      const oldData = (await decorate([item],transaction))[0];

      const communeId = communeFor(req,req.body,item);
      const nom = String(req.body.NomRS ?? item.NomRS).trim();

      if(!nom || nom.length > 255)
        fail(400,'NomRS est obligatoire (255 caractères maximum).');

      const ids = parseGroupIds(req.body);
      const groups = await groupsInCommune(ids,communeId,transaction);

      const flags = validateFlags({
        Activite:req.body.Activite ?? item.Activite,
        Plaidoyer:req.body.Plaidoyer ?? item.Plaidoyer,
        Plan:req.body.Plan ?? item.Plan
      });

      const date = validateDate(
        req.body.DateCreation ?? item.DateCreation
      );

      await item.update({
        NomRS:nom,
        NomGS:groups.map(g=>g.nomgs).join(', '),
        commune_id:communeId,
        DateCreation:date,
        ...flags
      },{transaction});

      await linkGroups(item.codeRS,groups,transaction);

      const newData = (await decorate([item],transaction))[0];

      return {oldData,newData};
    });

    res.locals.oldData = result.oldData;
    res.locals.newData = result.newData;

    res.json({
      message:'Réseau mis à jour avec succès !',
      data:result.newData
    });
  }catch(error){
    errorResponse(res,error);
  }
};

exports.deleteReseau = async (req,res) => {
  try{
    const id = parseId(req.params.id);

    if(!id)
      fail(400,'Identifiant invalide.');

    const oldData = await sequelize.transaction(async transaction=>{
      const item = await findAuthorized(req,id,transaction);
      const snapshot = (await decorate([item],transaction))[0];

      await item.destroy({transaction});

      return snapshot;
    });

    res.locals.deletedData = oldData;

    res.json({
      message:'Réseau supprimé avec succès !'
    });
  }catch(error){
    errorResponse(res,error);
  }
};