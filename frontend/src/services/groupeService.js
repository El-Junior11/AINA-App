import axios from 'axios';

// Hamarino raha mifanaraka amin'ny port fampiasanao ity URL ity
const API_URL = 'http://localhost:5000/api/groupes';

export const getGroupes = () => {
    return axios.get(API_URL);
};

export const getMenagesList = () => {
    return axios.get(`${API_URL}/menages-list`);
};

export const createGroupe = (data) => {
    return axios.post(API_URL, data);
};

export const updateGroupe = (id, data) => {
    return axios.put(`${API_URL}/${id}`, data);
};

export const deleteGroupe = (id) => {
    return axios.delete(`${API_URL}/${id}`);
};