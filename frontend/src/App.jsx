import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<div className="text-secondary text-sm">Cargando...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
