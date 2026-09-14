const express=require('express');
const router=express.Router();
const {AuditLog,User}=require('../models/associations');

router.get('/',async(req,res)=>{
  try{
    const logs=await AuditLog.findAll({
      include:[{model:User,attributes:['name']}],
      order:[['created_at','DESC']],
      limit:50
    });
    res.json(logs);
  }catch(error){
    console.error("Audit Fetch Error:",error);
    res.status(500).json({message:"Erreur lors de la récupération des logs"});
  }
});

router.post('/delete/:id',async(req,res)=>{
  try{
    const {id}=req.params;
    const log=await AuditLog.findByPk(id);
    if(!log)return res.status(404).json({message:"Trace d'audit introuvable"});
    await log.destroy();
    res.status(200).json({message:"Trace supprimée avec succès"});
  }catch(error){
    console.error("Audit Delete Error:",error);
    res.status(500).json({message:"Erreur lors de la suppression de la trace"});
  }
});

router.post('/restore/:id',async(req,res)=>{
  try{
    const {id}=req.params;
    const log=await AuditLog.findByPk(id);

    if(!log)return res.status(404).json({message:"Trace d'audit introuvable"});

    if(log.action_type!=='DELETE'){
      return res.status(400).json({message:"Cette trace ne correspond pas à une suppression"});
    }

    let details=log.details;

    if(typeof details==='string'){
      try{
        details=JSON.parse(details);
      }catch{
        details={};
      }
    }

    const deletedData=details?.deleted_data;

    if(!deletedData||typeof deletedData!=='object'){
      return res.status(400).json({message:"Aucune donnée supprimée disponible pour restauration"});
    }

    const tableName=String(log.table_name||'').toLowerCase();
    let Model=null;

    if(tableName.includes('membres')){
      Model=require('../models/Membre');
    }else if(tableName.includes('groupes')){
      Model=require('../models/Groupe');
    }else if(tableName.includes('reseaux')){
      Model=require('../models/Reseau');
    }else{
      return res.status(400).json({message:"Table non prise en charge pour la restauration"});
    }

    const restoredData={...deletedData};

    delete restoredData.createdAt;
    delete restoredData.updatedAt;
    delete restoredData.created_at;
    delete restoredData.updated_at;

    const existingId=restoredData.id;

    if(existingId){
      const existing=await Model.findByPk(existingId);
      if(existing){
        return res.status(409).json({message:"Cet élément existe déjà"});
      }
    }

    await Model.create(restoredData);

    res.status(200).json({
      message:"Élément restauré avec succès",
      data:restoredData
    });
  }catch(error){
    console.error("Audit Restore Error:",error);
    res.status(500).json({
      message:"Erreur lors de la restauration",
      error:error.message
    });
  }
});

module.exports=router;