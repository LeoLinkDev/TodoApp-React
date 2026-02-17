import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

const Auth = () => {
  const { login, register, error } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Validation
    if (!username.trim()) {
      setAuthError('Username is required');
      return;
    }

    if (username.trim().length < 3) {
      setAuthError('Username must be at least 3 characters');
      return;
    }

    if (!password) {
      setAuthError('Password is required');
      return;
    }

    if (password.length < 4) {
      setAuthError('Password must be at least 4 characters');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      // Clear form on success
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setAuthError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <section className="card auth-card" aria-labelledby="auth-title">
      <h2 id="auth-title">
        {isRegistering ? 'Create Account' : 'Sign In'}
      </h2>

      <form onSubmit={handleSubmit} className="form" noValidate>
        {(authError || error) && (
          <p className="auth-message error" role="alert">
            {authError || error}
          </p>
        )}

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength="3"
            disabled={isSubmitting}
          />
          <span className="hint">At least 3 characters.</span>
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            required
            minLength="4"
            disabled={isSubmitting}
          />
          <span className="hint">At least 4 characters.</span>
        </label>

        {isRegistering && (
          <label>
            Re-enter Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength="4"
              required
              disabled={isSubmitting}
            />
            <span className="hint">Must match your password.</span>
          </label>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isRegistering ? 'Creating Account...' : 'Signing In...')
              : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={toggleMode}
            disabled={isSubmitting}
          >
            {isRegistering ? 'Back to Login' : 'Create Account'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Auth;
