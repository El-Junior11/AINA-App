
import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MembresList from './pages/MembresList';
import StatistiquesMembres from './pages/StatistiquesMembres';
import AdminLayout from './layouts/AdminLayout';
import GroupePage from './pages/GroupePage';
import GroupeDetailsPage from './pages/GroupeDetailsPage';
import ReseauPage from './pages/ReseauPage';
import ReseauxVoirPlusPage from './pages/ReseauxVoirPlusPage';
import ResponsablePage from './pages/ResponsablePage';
import FormationPage from './pages/FormationPage';
import FormationStat from './pages/FormationStat';
import Notifications from './pages/Notifications';
import AccountSettings from './pages/AccountSettings';
import UserApprovals from './pages/UserApprovals';
import AdminNotifications from './pages/AdminNotifications';
import CommunesPage from './pages/CommunesPage';
import UsersPage from './pages/UsersPage';
import DetailsResponsablesPage from './pages/DetailsResponsablesPage';
import RapportsPage from './pages/RapportsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes privées */}
          <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/membres" element={<MembresList />} />
            <Route path="/membres/statistiques" element={<StatistiquesMembres />} />

            <Route path="/groupes" element={<GroupePage />} />
            <Route path="/groupes/details" element={<GroupeDetailsPage />} />
            <Route path="/rapports" element={<RapportsPage />} />
            <Route path="/reseaux" element={<ReseauPage />} />
            <Route path="/reseaux/voir-plus" element={<ReseauxVoirPlusPage />} />

            <Route path="/responsables" element={<ResponsablePage />} />
            <Route path="/responsables/details" element={<DetailsResponsablesPage/>}/>
            <Route path="/formations" element={<FormationPage />} />
            <Route path="/formation-stats" element={<FormationStat />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Administration */}
            <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/admin/approvals" element={<AdminRoute><UserApprovals /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/communes" element={<AdminRoute><CommunesPage /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
