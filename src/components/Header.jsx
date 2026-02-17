import { useAuth } from '../hooks/useAuth';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="app-header">
      <div className="container header-content">
        <div className="brand">
          <span className="logo" aria-hidden="true">✓</span>
          <div>
            <h1>Todo List</h1>
            <p className="subtitle">Simple, secure, and fast</p>
          </div>
        </div>
        {isAuthenticated && (
          <div className="session">
            <span className="session-user" aria-live="polite">
              Signed in as <strong>{user?.username}</strong>
            </span>
            <button 
              className="btn btn-ghost" 
              type="button" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
