import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
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
          <Route index element={<HomePage />} />
          <Route path="match/:id" element={<PredictionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
