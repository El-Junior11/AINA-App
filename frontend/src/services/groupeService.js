import axios from '../api/axios';

const auth = () => ({
  headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}
});

export const getGroupes = (communeId = null) => axios.get('/groupes',{
  ...auth(),
  ...(communeId ? {params:{commune_id:communeId}} : {})
});

export const getMenagesList = (communeId = null) => axios.get('/groupes/menages-list',{
  ...auth(),
  ...(communeId ? {params:{commune_id:communeId}} : {})
});

export const getGroupeById = id => axios.get(`/groupes/${id}`,auth());

export const createGroupe = data => axios.post('/groupes',data,auth());

export const updateGroupe = (id,data) => axios.put(`/groupes/${id}`,data,auth());

export const deleteGroupe = id => axios.delete(`/groupes/${id}`,auth());