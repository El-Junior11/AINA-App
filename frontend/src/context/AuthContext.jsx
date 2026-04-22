import { createContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
const AuthContext = createContext(undefined);

export { AuthContext };

// 2. Famoronana ny Provider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fanamarinana ny session rehefa mamelona pejy (refresh)
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const savedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (savedUser && token) {
                    // Jerena raha mbola hita ny data ary marina ny format-ny
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error("Erreur d'initialisation auth:", error);
                localStorage.clear(); // Fafana ny cache raha misy data simba
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            const res = await axios.post('/auth/login', { email, password });
            
            // Raha mahomby ny fidirana:
            const userData = res.data.user;
            const token = res.data.token;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return { success: true };
        } catch (err) {
            console.error("Login error:", err);
            return { 
                success: false, 
                message: err.response?.data?.message || "Identifiants invalides ou erreur serveur" 
            };
        }
    };

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    // Ny soso-kevitra (value) hatolotra ny pejy rehetra
    const authValues = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={authValues}>
            {!loading && children}
        </AuthContext.Provider>
    );
};