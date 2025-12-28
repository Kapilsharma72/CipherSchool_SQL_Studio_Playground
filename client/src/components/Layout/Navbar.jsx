import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Cipher SQL Studio</Link>
      </div>
      
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <span className="welcome-message">Welcome, {user?.name || 'User'}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-button">Login</Link>
            <Link to="/register" className="register-button">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
