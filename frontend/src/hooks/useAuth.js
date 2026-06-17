import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function login(username, password) {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function register(username, password) {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.post('/auth/register', { username, password });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(username, newPassword) {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { username, newPassword });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { login, register, resetPassword, loading, error };
}
