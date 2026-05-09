import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ cartCount, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">🏪 Marketplace (Buyer)</Link>
        
        <ul className="navbar-menu">
          <li><Link to="/">Shop</Link></li>
          <li><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/cart" className="cart-link">🛒 Cart ({cartCount})</Link></li>
          <li><button onClick={handleLogout} className="btn-logout">Logout</button></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
