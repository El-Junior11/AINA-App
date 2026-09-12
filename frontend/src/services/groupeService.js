import axios from '../api/axios';


const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const getGroupes = () => {
    return axios.get('/groupes',getAuthHeaders());
};

export const getMenagesList = () => {
    return axios.get('/groupes/menages-list',getAuthHeaders());
};

export const createGroupe = (data) => {
    return axios.post('/groupes', data, getAuthHeaders());
};

export const updateGroupe = (id, data) => {
    return axios.put(`/groupes/${id}`, data, getAuthHeaders());
};

export const deleteGroupe = (id) => {
    return axios.delete(`/groupes/${id}`, getAuthHeaders());
};