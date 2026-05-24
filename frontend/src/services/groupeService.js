import axios from 'axios';

const API_URL = 'http://localhost:5000/api/groupes';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const getGroupes = () => {
    return axios.get(API_URL, getAuthHeaders());
};

export const getMenagesList = () => {
    return axios.get(`${API_URL}/menages-list`, getAuthHeaders());
};

export const createGroupe = (data) => {
    return axios.post(API_URL, data, getAuthHeaders());
};

export const updateGroupe = (id, data) => {
    return axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
};

export const deleteGroupe = (id) => {
    return axios.delete(`${API_URL}/${id}`, getAuthHeaders());
};