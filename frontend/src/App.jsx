import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CompareTray from './components/CompareTray';
import HomePage from './pages/HomePage';
import ListingsPage from './pages/ListingsPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SavedPage from './pages/SavedPage';
import ComparePage from './pages/ComparePage';
import './styles.css';


function PrivateRoute({ children, agentOnly }) {
  const { user, isAgent } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (agentOnly && !isAgent) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompareProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/property/:id" element={<PropertyDetailPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/saved" element={<PrivateRoute><SavedPage /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute agentOnly><DashboardPage /></PrivateRoute>} />
              </Routes>
            </main>
            <CompareTray />
            <Footer />
          </div>
        </CompareProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
