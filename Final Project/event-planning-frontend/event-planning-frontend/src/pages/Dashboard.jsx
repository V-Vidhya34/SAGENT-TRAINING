import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEventsByOrganizer, getTasksByUser, getUnreadCount } from '../services/api';
import { Link } from 'react-router-dom';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getEventsByOrganizer(user.userId).then(r => setEvents(r.data)).catch(() => {});
    getTasksByUser(user.userId).then(r => setTasks(r.data)).catch(() => {});
    getUnreadCount(user.userId).then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, []);


  const today = new Date();
today.setHours(0, 0, 0, 0);

const upcomingEvents = events
  .filter(e => e.eventDate && new Date(e.eventDate) >= today)
  .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

const nextEvent = upcomingEvents[0] || null;

const daysRemaining = nextEvent?.eventDate
  ? Math.ceil((new Date(nextEvent.eventDate) - new Date()) / (1000 * 60 * 60 * 24))
  : null;

  
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Organizer Dashboard</p>
          <h2 style={{ fontSize: '28px', marginBottom: 0 }}>Welcome back, {user?.name}</h2>
        </div>

        {/* Next Event Banner */}
        {nextEvent && (
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
            borderRadius: 'var(--radius-xl)', padding: '28px 32px',
            marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Next Event
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
                {nextEvent.eventName}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                {nextEvent.eventDate && new Date(nextEvent.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })} · {nextEvent.venue}
              </div>
            </div>
            {daysRemaining !== null && (
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-lg)',
                padding: '16px 24px', textAlign: 'center', backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{daysRemaining}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>days remaining</div>
              </div>
            )}
          </div>
        )}

        <div className="grid-2">
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: 0 }}>Recent Events</h3>
              <Link to="/events" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            {events.length === 0 && <p style={{ fontSize: '13px' }}>No events yet</p>}
            {events.slice(0, 3).map(e => (
              <div key={e.eventId} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{e.eventName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{e.eventDate} · {e.venue}</div>
                <span className="badge badge-info" style={{ marginTop: '6px' }}>{e.eventType}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: 0 }}>Pending Tasks</h3>
              <Link to="/tasks" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            {pendingTasks.length === 0 && <p style={{ fontSize: '13px' }}>No pending tasks</p>}
            {pendingTasks.slice(0, 4).map(t => (
              <div key={t.taskId} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.taskName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Deadline: {t.deadline}</div>
                <span className={`badge badge-${t.priority === 'HIGH' ? 'danger' : 'pending'}`} style={{ marginTop: '6px' }}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};


// ============ TEAM MEMBER ============
const TeamMemberDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getTasksByUser(user.userId).then(r => setTasks(r.data)).catch(() => {});
    getUnreadCount(user.userId).then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, []);

  return (
    <div style={{ marginTop: 'var(--nav-height)' }}>
      <div style={{
        height: '260px',
        background:'url(https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80)',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px 40px' }}>
        <div style={{ padding: '28px 0 24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Team Member Dashboard</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 0 }}>
            Welcome back, {user?.name}
          </h1>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: 0, fontSize: '15px' }}>Assigned Tasks</h3>
            <Link to="/tasks" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          {tasks.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No tasks assigned yet</p>}
          <table>
            <thead>
              <tr><th>Task</th><th>Priority</th><th>Status</th><th>Deadline</th></tr>
            </thead>
            <tbody>
              {tasks.slice(0, 5).map(t => (
                <tr key={t.taskId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.taskName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.description}</div>
                  </td>
                  <td><span className={`badge badge-${t.priority === 'HIGH' ? 'danger' : t.priority === 'MEDIUM' ? 'pending' : 'success'}`}>{t.priority}</span></td>
                  <td><span className={`badge badge-${t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'pending'}`}>{t.status}</span></td>
                  <td>{t.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {unread > 0 && (
          <div style={{
            marginTop: '16px', background: 'white', borderRadius: '14px',
            padding: '16px 22px', border: '1px solid var(--primary)',
            boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
              You have {unread} unread notification{unread > 1 ? 's' : ''}
            </div>
            <Link to="/notifications" style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ VENDOR ============
const VendorDashboard = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getUnreadCount(user.userId).then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, []);

  return (
    <div style={{ marginTop: 'var(--nav-height)' }}>
      <div style={{
        height: '280px',
        background: 'url(https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1400&q=80) center/cover no-repeat',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10, 28, 32, 0.25), rgba(10, 28, 32, 0.6))' }} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px 40px' }}>
        <div style={{ padding: '28px 0 24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Vendor Dashboard</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 0 }}>Welcome back, {user?.name}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <Link to="/chat" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '16px', padding: '22px',
              border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'all 0.18s ease', borderTop: '4px solid var(--primary)'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>Messages</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Chat with organizers and team members
              </div>
              <span className="badge badge-primary">Open chat</span>
            </div>
          </Link>
          <Link to="/notifications" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '16px', padding: '22px',
              border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'all 0.18s ease', borderTop: '4px solid var(--success)'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', marginBottom: '4px' }}>{unread}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Unread notifications</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Stay updated on vendor requests</div>
            </div>
          </Link>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '22px',
            border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Vendor tip
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px' }}>Respond quickly to win more gigs</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Fast replies improve your booking chances with organizers.
            </div>
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px', padding: '40px',
          border: '1px solid var(--border-light)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Your Vendor Profile</div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Keep your profile fresh so organizers can trust your work.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
            <div style={{ background: 'var(--border-light)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Availability</div>
              <div style={{ fontWeight: 700 }}>Open for requests</div>
            </div>
            <div style={{ background: 'var(--border-light)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Response time</div>
              <div style={{ fontWeight: 700 }}>Within 24 hrs</div>
            </div>
            <div style={{ background: 'var(--border-light)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Next step</div>
              <div style={{ fontWeight: 700 }}>Update portfolio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'TEAM_MEMBER') return <TeamMemberDashboard />;
  if (user?.role === 'VENDOR') return <VendorDashboard />;
  return <OrganizerDashboard />;
};

export default Dashboard;
