import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasksByEvent, getEventsByOrganizer, createTask, updateTask, deleteTask, getTeamMembers, getAllEvents, uploadTaskDocument, getTaskDocuments, deleteTaskDocument } from '../services/api';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ taskName: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '' });
  const [teamMembers, setTeamMembers] = useState([]);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDocs, setTaskDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadTasks = (eventId) => {
    getTasksByEvent(eventId).then(r => {
      if (user?.role === 'ORGANIZER') {
        setTasks(r.data);
      } else {
        const myTasks = r.data.filter(t => String(t.assignedTo?.userId) === String(user.userId));
        setTasks(myTasks);
      }
    });
  };

  useEffect(() => {
    if (user?.role === 'ORGANIZER') {
      getEventsByOrganizer(user.userId).then(r => {
        setEvents(r.data);
        if (r.data.length > 0) setSelectedEvent(r.data[0].eventId);
      });
      getTeamMembers().then(r => setTeamMembers(r.data));
    } else {
      getAllEvents().then(r => {
        setEvents(r.data);
        if (r.data.length > 0) setSelectedEvent(r.data[0].eventId);
      });
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) loadTasks(selectedEvent);
  }, [selectedEvent]);

  const handleCreate = async () => {
    try {
      await createTask({ ...form, eventId: selectedEvent, assignedToId: form.assignedToId || user.userId });
      setShowModal(false);
      setForm({ taskName: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '' });
      loadTasks(selectedEvent);
    } catch { alert('Error creating task!'); }
  };

  const handleStatusUpdate = async (id, status) => {
    await updateTask(id, { status });
    loadTasks(selectedEvent);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id);
    loadTasks(selectedEvent);
  };

  const handleViewDocs = async (task) => {
    setSelectedTask(task);
    setShowDocsModal(true);
    const r = await getTaskDocuments(task.taskId);
    setTaskDocs(r.data);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadTaskDocument(selectedTask.taskId, file, user.userId);
      const r = await getTaskDocuments(selectedTask.taskId);
      setTaskDocs(r.data);
    } catch { alert('Upload failed!'); }
    finally { setUploading(false); }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Delete this file?')) return;
    await deleteTaskDocument(docId);
    const r = await getTaskDocuments(selectedTask.taskId);
    setTaskDocs(r.data);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: 0 }}>Tasks</h2>
          <div className="flex gap-10">
            <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ width: 'auto', marginBottom: 0 }}>
              {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
            </select>
            {user?.role === 'ORGANIZER' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
            )}
          </div>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Deadline</th><th>Files</th>
                {user?.role === 'ORGANIZER' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.taskId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.taskName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.description}</div>
                  </td>
                  <td>{t.assignedTo?.name || 'Unassigned'}</td>
                  <td><span className={`badge badge-${t.priority === 'HIGH' ? 'danger' : t.priority === 'MEDIUM' ? 'pending' : 'success'}`}>{t.priority}</span></td>
                  <td>
                    <select value={t.status} onChange={e => handleStatusUpdate(t.taskId, e.target.value)}
                      className="status-select"
                      style={{ width: 'auto', marginBottom: 0, padding: '4px 8px', fontSize: '12px' }}>
                      <option>PENDING</option>
                      <option>IN_PROGRESS</option>
                      <option>COMPLETED</option>
                    </select>
                  </td>
                  <td>{t.deadline}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleViewDocs(t)}>
                      📎 Files
                    </button>
                  </td>
                  {user?.role === 'ORGANIZER' && (
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.taskId)}>Delete</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No tasks assigned to you</p>
          )}
        </div>

        {/* Add Task Modal */}
        {showModal && user?.role === 'ORGANIZER' && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: 0 }}>Add Task</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <label>Task Name</label>
              <input placeholder="e.g. Book Catering" value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} />
              <label>Description</label>
              <input placeholder="Task description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <label>Assign To</label>
              <select value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">Select team member</option>
                {teamMembers.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
              </select>
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
              </select>
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate}>Create Task</button>
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {showDocsModal && selectedTask && (
          <div className="modal-overlay" onClick={() => setShowDocsModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: 0 }}>Files — {selectedTask.taskName}</h3>
                <button className="close-btn" onClick={() => setShowDocsModal(false)}>×</button>
              </div>

              {/* Upload Area - Only Team Members */}
              {user?.role !== 'ORGANIZER' && (
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  background: 'var(--bg)',
                  transition: 'border-color 0.2s ease'
                }}
                  onClick={() => document.getElementById('fileInput').click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {uploading ? 'Uploading...' : 'Click to upload file'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Images, PDF, Word, Excel supported
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
              )}

              {/* Organizer - View only message */}
              {user?.role === 'ORGANIZER' && (
                <div style={{
                  background: 'var(--primary-light)',
                  border: '1px solid #c4bbff',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: 'var(--primary)',
                  fontWeight: 500
                }}>
                  📋 Team members can upload proof files here. You can view them below.
                </div>
              )}

              {/* Files List */}
              {taskDocs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>
                  No files uploaded yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {taskDocs.map(doc => (
                    <div key={doc.documentId} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'var(--bg)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>
                          {doc.fileType?.includes('image') ? '🖼️' :
                           doc.fileType?.includes('pdf') ? '📄' : '📎'}
                        </span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{doc.fileName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {doc.uploadedBy?.name} · {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`http://localhost:8080${doc.fileUrl}`} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm">
                          View
                        </a>
                        {user?.role !== 'ORGANIZER' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDoc(doc.documentId)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;