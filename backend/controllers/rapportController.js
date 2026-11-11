const sequelize = require('../config/db');
const { QueryTypes: Q } = require('sequelize');

const INDICATEURS = [
  ['gsf','Groupes GSF'],['membres_f','Membres GSF - Femmes'],
  ['membres_h','Membres GSF - Hommes'],['membres_total','Membres GSF - Total'],
  ['reseaux','Réseaux'],['genre_f','Formés Genre - Femmes'],
  ['genre_h','Formés Genre - Hommes'],['genre_total','Formés Genre - Total'],
  ['epracc_f','Formés EPRACC - Femmes'],['epracc_h','Formés EPRACC - Hommes'],
  ['epracc_total','Formés EPRACC - Total']
];

const QUALITATIFS = [
  ['genre','Changements transformateurs en matière de genre'],
  ['developpement','Activités de développement local'],
  ['agroecologie','Résultats de la transition agroécologique'],
  ['climat','Adaptation au changement climatique']
];

const validId = x => /^\d+$/.test(String(x??'')) && Number.isSafeInteger(Number(x)) && Number(x)>0 ? Number(x) : null;
const run = (sql,replacements={}) => sequelize.query(sql,{type:Q.SELECT,replacements});

function scope(req,res){
  const admin=req.user?.role==='admin',requested=req.query.commune_id;
  const id=admin?(requested==null||requested===''?null:validId(requested)):validId(req.user?.commune_id);
  if((!admin&&!id)||(admin&&requested!=null&&requested!==''&&!id)){
    res.status(admin?400:403).json({success:false,message:admin?'Commune invalide':'Commune non attribuée'});
    return false;
  }
  return {admin,id};
}

exports.getRapport=async(req,res)=>{
  try{
    const s=scope(req,res);if(!s)return;
    const annee=validId(req.query.annee||new Date().getFullYear()),mois=validId(req.query.mois||new Date().getMonth()+1);
    if(!annee||annee<2020||annee>2100||!mois||mois>12)
      return res.status(400).json({success:false,message:'Période invalide'});

    const communes=await run('SELECT id_commune,nom_commune FROM communes ORDER BY nom_commune');
    const allowed=communes.filter(c=>!s.id||c.id_commune===s.id);

    const sql=`SELECT c.id_commune,c.nom_commune,
      (SELECT COUNT(*)::int FROM groupes g WHERE g.commune_id=c.id_commune) AS gsf,
      (SELECT COUNT(*)::int FROM membres m WHERE m.commune_id=c.id_commune AND LOWER(TRIM(m.sexe)) IN ('f','femme','féminin','feminin')) AS membres_f,
      (SELECT COUNT(*)::int FROM membres m WHERE m.commune_id=c.id_commune AND LOWER(TRIM(m.sexe)) IN ('h','homme','masculin','m')) AS membres_h,
      (SELECT COUNT(*)::int FROM membres m WHERE m.commune_id=c.id_commune) AS membres_total,
      (SELECT COUNT(*)::int FROM reseaux r WHERE r.commune_id=c.id_commune) AS reseaux,
      (SELECT COUNT(*)::int FROM formations f JOIN membres m ON m.nummembre=f.nummembre WHERE m.commune_id=c.id_commune AND f.deleted_at IS NULL AND f.genre=true AND LOWER(TRIM(m.sexe)) IN ('f','femme','féminin','feminin')) AS genre_f,
      (SELECT COUNT(*)::int FROM formations f JOIN membres m ON m.nummembre=f.nummembre WHERE m.commune_id=c.id_commune AND f.deleted_at IS NULL AND f.genre=true AND LOWER(TRIM(m.sexe)) IN ('h','homme','masculin','m')) AS genre_h,
      (SELECT COUNT(*)::int FROM formations f JOIN membres m ON m.nummembre=f.nummembre WHERE m.commune_id=c.id_commune AND f.deleted_at IS NULL AND f.genre=true) AS genre_total,
      (SELECT COUNT(*)::int FROM formations f JOIN membres m ON m.nummembre=f.nummembre WHERE m.commune_id=c.id_commune AND f.deleted_at IS NULL AND f.epracc=true AND LOWER(TRIM(m.sexe)) IN ('f','femme','féminin','feminin')) AS epracc_f,
      (SELECT COUNT(*)::int FROM formations f JOIN membres m ON m.nummembre=f.nummembre WHERE m.commune_id=c.id_commune AND f.deleted_at IS NULL AND f.epracc=true AND LOWER(TRIM(m.sexe)) IN ('h','homme','masculin','m')) AS epracc_h,
      (SELECT COUNT(*)::int FROM formations f JOIN membres m ON m.nummembre=f.nummembre WHERE m.commune_id=c.id_commune AND f.deleted_at IS NULL AND f.epracc=true) AS epracc_total
      FROM communes c ${s.id?'WHERE c.id_commune=:id':''} ORDER BY c.nom_commune`;

    const [rows,objectifs,qualitatifs]=await Promise.all([
      run(sql,{id:s.id}),
      run(`SELECT commune_id,indicateur,valeur FROM rapport_objectifs WHERE annee=:annee ${s.id?'AND commune_id=:id':''}`,{annee,id:s.id}),
      run(`SELECT commune_id,categorie,description FROM rapport_qualitatifs WHERE annee=:annee AND mois=:mois ${s.id?'AND commune_id=:id':''}`,{annee,mois,id:s.id})
    ]);

    const objectiveMap=new Map(objectifs.map(x=>[`${x.commune_id}:${x.indicateur}`,Number(x.valeur)]));
    const result=rows.map(row=>({
      commune_id:row.id_commune,commune:row.nom_commune,
      indicateurs:INDICATEURS.map(([key,label])=>{
        const objectif=objectiveMap.get(`${row.id_commune}:${key}`)??null;
        const resultat=Number(row[key]);
        return {key,label,objectif,resultat,taux:objectif>0?Math.round(resultat/objectif*10000)/100:null};
      })
    }));

    return res.json({
      success:true,annee,mois,isAdmin:s.admin,commune_id:s.id,
      communes:s.admin?communes:allowed,mode:'actuel',
      avertissement:'Résultats calculés sur les données actuelles, sans historique mensuel. Le mois choisi concerne les données qualitatives uniquement.',
      indicateurs:INDICATEURS.map(([key,label])=>({key,label})),
      categories:QUALITATIFS.map(([key,label])=>({key,label})),
      rapports:result,qualitatifs
    });
  }catch(e){
    console.error('Rapport:',e);
    res.status(500).json({success:false,message:'Erreur rapport'});
  }
};

exports.saveObjectif=async(req,res)=>{
  try{
    if(req.user?.role!=='admin')return res.status(403).json({success:false,message:'Admin uniquement'});
    const annee=validId(req.body.annee),commune_id=validId(req.body.commune_id),{indicateur}=req.body,valeur=Number(req.body.valeur);
    if(!annee||annee<2020||annee>2100||!commune_id||!INDICATEURS.some(x=>x[0]===indicateur)||!Number.isFinite(valeur)||valeur<0)
      return res.status(400).json({success:false,message:'Données invalides'});

    await sequelize.query(`INSERT INTO rapport_objectifs(annee,commune_id,indicateur,valeur)
      VALUES(:annee,:commune_id,:indicateur,:valeur)
      ON CONFLICT(annee,commune_id,indicateur) DO UPDATE SET valeur=EXCLUDED.valeur`,
      {replacements:{annee,commune_id,indicateur,valeur}});
    res.json({success:true});
  }catch(e){
    console.error(e);
    res.status(500).json({success:false,message:'Erreur enregistrement'});
  }
};

exports.saveQualitatif=async(req,res)=>{
  try{
    const admin=req.user?.role==='admin',commune_id=admin?validId(req.body.commune_id):validId(req.user?.commune_id);
    const annee=validId(req.body.annee),mois=validId(req.body.mois),{categorie,description}=req.body;
    if(!commune_id||!annee||annee<2020||annee>2100||!mois||mois>12||!QUALITATIFS.some(x=>x[0]===categorie)||typeof description!=='string'||description.length>10000)
      return res.status(400).json({success:false,message:'Données invalides'});

    await sequelize.query(`INSERT INTO rapport_qualitatifs(annee,mois,commune_id,categorie,description)
      VALUES(:annee,:mois,:commune_id,:categorie,:description)
      ON CONFLICT(annee,mois,commune_id,categorie)
      DO UPDATE SET description=EXCLUDED.description,updated_at=now()`,
      {replacements:{annee,mois,commune_id,categorie,description}});
    res.json({success:true});
  }catch(e){
    console.error(e);
    res.status(500).json({success:false,message:'Erreur enregistrement'});
  }
};