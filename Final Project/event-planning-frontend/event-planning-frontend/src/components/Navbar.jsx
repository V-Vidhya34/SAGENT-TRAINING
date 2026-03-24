import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getUnreadCount, markAllRead, getDMUnreadCount } from '../services/api';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);

  useEffect(() => {
    if (user?.userId) {
      getUnreadCount(user.userId).then(r => setUnread(r.data.count || r.data.unreadCount || 0)).catch(() => {});
      getDMUnreadCount(user.userId).then(r => setDmUnread(r.data.count || 0)).catch(() => {});

      const interval = setInterval(() => {
        getUnreadCount(user.userId).then(r => setUnread(r.data.count || r.data.unreadCount || 0)).catch(() => {});
        getDMUnreadCount(user.userId).then(r => setDmUnread(r.data.count || 0)).catch(() => {});
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/notifications') {
      setTimeout(() => {
        markAllRead(user?.userId).catch(() => {});
        setUnread(0);
      }, 3000);
    }

    if (location.pathname === '/chat') {
      setDmUnread(0);
    }
  }, [location.pathname]);

  const handleLogout = () => { logoutUser(); navigate('/login'); };

  const getMenuItems = () => {
    if (user?.role === 'ORGANIZER') return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Events', path: '/events' },
      { label: 'Tasks', path: '/tasks' },
      { label: 'Budget', path: '/budget' },
      { label: 'Vendors', path: '/vendors' },
      { label: 'Chat', path: '/chat' },
      { label: 'Invitations', path: '/invitations' },
    ];
    if (user?.role === 'TEAM_MEMBER') return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Tasks', path: '/tasks' },
      { label: 'Vendors', path: '/vendors' },
      { label: 'Chat', path: '/chat' },
    ];
    if (user?.role === 'VENDOR') return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Chat', path: '/chat' },
    ];
    return [];
  };

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <Link to="/dashboard" className="navbar__brand">
          EventPlan
        </Link>

        <div className="navbar__links">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            const isChatItem = item.path === '/chat';
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar__link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
                {isChatItem && dmUnread > 0 && (
                  <span className="navbar__badge">{dmUnread}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="navbar__actions">
        <div className="navbar__pill">{user?.role?.replace('_', ' ')}</div>
        <div className="navbar__user">{user?.name}</div>

        <Link
          to="/notifications"
          className={`navbar__icon ${location.pathname === '/notifications' ? 'is-active' : ''}`}
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" role="img" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-1.6 1.6a1 1 0 0 0 .7 1.7h16.8a1 1 0 0 0 .7-1.7L19 16Z"
            />
          </svg>
          {unread > 0 && (
            <span className="navbar__badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </Link>

        <button onClick={handleLogout} className="navbar__logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
