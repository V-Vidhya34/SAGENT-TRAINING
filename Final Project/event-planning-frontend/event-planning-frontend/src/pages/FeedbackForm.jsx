import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInvitationById, submitFeedback } from '../services/api';

const FeedbackForm = () => {
  const { id } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const eventEnded = invitation?.event
    ? invitation.event.status === 'COMPLETED' ||
      (invitation.event.eventDate ? new Date(invitation.event.eventDate) < new Date() : false)
    : true;

  useEffect(() => {
    setLoading(true);
    getInvitationById(id)
      .then(r => {
        setInvitation(r.data);
        setError('');
      })
      .catch(() => setError('Invitation not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!eventEnded) {
      setError('Feedback opens after the event ends.');
      return;
    }
    if (!rating) {
      setError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ invitationId: id, rating, comments });
      setDone(true);
      setError('');
    } catch {
      setError('Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        {loading && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading feedback form...</div>
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</div>
          </div>
        )}

        {!loading && invitation && !done && (
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Event Feedback</div>
              <h2 style={{ marginBottom: '6px' }}>
                Hi {invitation.guestName}, tell us how it went
              </h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {invitation.event?.eventName} · {invitation.event?.eventDate} · {invitation.event?.venue}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Your rating</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className="btn"
                    onClick={() => setRating(n)}
                    style={{
                      background: rating === n ? 'var(--primary)' : 'white',
                      color: rating === n ? 'white' : 'var(--text-primary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <label>Comments</label>
            <textarea
              rows={4}
              placeholder="Share what you liked and what we can improve"
              value={comments}
              onChange={e => setComments(e.target.value)}
              style={{ width: '100%' }}
            />

            {!eventEnded && (
              <div style={{ color: 'var(--warning)', marginTop: '10px' }}>
                Feedback opens after the event ends.
              </div>
            )}
            {error && <div style={{ color: 'var(--danger)', marginTop: '10px' }}>{error}</div>}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '14px' }}
              onClick={handleSubmit}
              disabled={submitting || !eventEnded}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}

        {!loading && invitation && done && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Thank you for your feedback
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Your response was sent to the organizer.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
