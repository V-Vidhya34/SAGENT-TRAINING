import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const RSVP = () => {
  const { id } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:8080/api/invitations/${id}`)
      .then(r => setInvitation(r.data))
      .catch(() => setError('Invitation not found!'));
  }, [id]);

  const handleRSVP = async (status) => {
    try {
      await axios.patch(`http://localhost:8080/api/invitations/rsvp/${id}`, { rsvpStatus: status });
      setDone(status);
    } catch {
      setError('Something went wrong! Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #0ea5e9 100%)',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '90%',
        maxWidth: '460px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>

        {/* Logo */}
        <div style={{
          fontSize: '13px', fontWeight: 700, color: 'var(--primary)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '24px', opacity: 0.6
        }}>
          ✦ EventPlan
        </div>

        {/* Loading */}
        {!invitation && !error && (
          <div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Loading invitation...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>😕</div>
            <p style={{ color: '#ef4444', fontSize: '15px', fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Invitation */}
        {invitation && !done && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{
              fontSize: '22px', fontWeight: 800,
              color: '#111827', marginBottom: '6px'
            }}>
              You're Invited!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
              Hi <strong style={{ color: '#5c54e8' }}>{invitation.guestName}</strong>, you have been invited to an event!
            </p>

            {invitation.event && (
              <div style={{
                background: '#f4f5f9',
                borderRadius: '14px',
                padding: '18px',
                marginBottom: '24px',
                textAlign: 'left',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Event Details</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827', marginBottom: '10px' }}>
                  {invitation.event?.eventName}
                </div>
                {invitation.event?.eventDate && (
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                    📅 {new Date(invitation.event.eventDate).toLocaleDateString('en-IN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                )}
                {invitation.event?.venue && (
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    📍 {invitation.event.venue}
                  </div>
                )}
                {invitation.event?.startTime && invitation.event?.endTime && (
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Time: {invitation.event.startTime} - {invitation.event.endTime}
                  </div>
                )}
              </div>
            )}

            {invitation.rsvpStatus !== 'PENDING' ? (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: invitation.rsvpStatus === 'ACCEPTED' ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${invitation.rsvpStatus === 'ACCEPTED' ? '#bbf7d0' : '#fecaca'}`
              }}>
                <p style={{
                  color: invitation.rsvpStatus === 'ACCEPTED' ? '#15803d' : '#b91c1c',
                  fontWeight: 600, fontSize: '14px', margin: 0
                }}>
                  {invitation.rsvpStatus === 'ACCEPTED'
                    ? 'You have already accepted this invitation!'
                    : 'You have already declined this invitation.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleRSVP('ACCEPTED')} style={{
                  flex: 1, padding: '14px', fontSize: '15px', fontWeight: 700,
                  background: '#22c55e', color: 'white', border: 'none',
                  borderRadius: '12px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                  fontFamily: 'inherit', transition: '0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
                  onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
                >
                  Accept
                </button>
                <button onClick={() => handleRSVP('DECLINED')} style={{
                  flex: 1, padding: '14px', fontSize: '15px', fontWeight: 700,
                  background: '#ef4444', color: 'white', border: 'none',
                  borderRadius: '12px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                  fontFamily: 'inherit', transition: '0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                >
                  Decline
                </button>
              </div>
            )}
          </>
        )}

        {/* Done */}
        {done && (
          <>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>
              {done === 'ACCEPTED' ? '🎊' : '😢'}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
              {done === 'ACCEPTED' ? 'See you there!' : 'Maybe next time!'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Your response has been recorded. Thank you!
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default RSVP;
