import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MembresList from './pages/MembresList'; // Ny CRUD-nao
import AdminLayout from './layouts/AdminLayout';
import GroupePage from './pages/GroupePage';
import ReseauPage from './pages/ReseauPage';
import ResponsablePage from './pages/ResponsablePage';
import FormationPage from './pages/FormationPage';
import Notifications from './pages/Notifications';
import FormationStat from './pages/FormationStat';







const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Dashboard & Others) */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            {/* Ireto pejy ireto dia hiseho ao anatin'ny Outlet an'ny AdminLayout */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="membres" element={<MembresList />} />
            <Route path="groupes" element={<GroupePage/>}/>
            <Route path="reseaux" element={<ReseauPage/>} />
            <Route path="responsables" element={<ResponsablePage/>} />
            <Route path="formations" element={< FormationPage/>} />
            <Route path="notifications" element={< Notifications/>} />
            <Route path="/formation-stats" element={<FormationStat />} />

          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;