import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// Events
export const getEvents = () => API.get('/events');
export const getEventsByOrganizer = (id) => API.get(`/events/organizer/${id}`);
export const createEvent = (data) => API.post('/events', data);
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const deleteEvent = (id) => API.delete(`/events/${id}`);
export const getAllEvents = () => API.get('/events');

// Tasks
export const getTasksByEvent = (eventId) => API.get(`/tasks/event/${eventId}`);
export const getTasksByUser = (userId) => API.get(`/tasks/user/${userId}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Budget
export const getBudgetByEvent = (eventId) => API.get(`/budgets/event/${eventId}`);
export const createBudget = (data) => API.post('/budgets', data);
export const createPayment = (data) => API.post('/budgets/payments', data);
export const updatePaymentStatus = (id, status) => API.patch(`/budgets/payments/${id}/status`, { status });

// Vendors
export const getVendors = () => API.get('/vendors');
export const getAvailableVendors = () => API.get('/vendors/available');
export const getVendorsByEvent = (eventId) => API.get(`/vendors/event/${eventId}`);
export const getVendorAvailabilityByEvent = (eventId) => API.get(`/vendors/availability?eventId=${eventId}`);
export const assignVendor = (data) => API.post('/vendors/assign', data);
export const updateContractStatus = (id, status) => API.patch(`/vendors/contract/${id}/status`, { status });
export const addVendorReview = (vendorId, data) => API.post(`/vendors/${vendorId}/reviews`, data);
export const getVendorReviews = (vendorId) => API.get(`/vendors/${vendorId}/reviews`);


// Chat
export const getChatRoom = (eventId) => API.get(`/chat/event/${eventId}`);
export const addMember = (roomId, userId) => API.post(`/chat/rooms/${roomId}/members`, { userId });
export const getMessages = (roomId) => API.get(`/chat/rooms/${roomId}/messages`);
export const sendMessage = (roomId, data) => API.post(`/chat/rooms/${roomId}/messages`, data);
export const sendDM = (data) => API.post('/chat/dm', data);
export const getDMConversation = (u1, u2) => API.get(`/chat/dm/${u1}/${u2}`);

// Invitations
export const getInvitationsByEvent = (eventId) => API.get(`/invitations/event/${eventId}`);
export const sendInvitation = (data) => API.post('/invitations', data);
export const getInvitationById = (id) => API.get(`/invitations/${id}`);
export const updateRSVP = (id, status) => API.patch(`/invitations/rsvp/${id}`, { status });

// Feedback
export const getFeedbackByEvent = (eventId) => API.get(`/guest-feedbacks/event/${eventId}`);
export const submitFeedback = (data) => API.post('/guest-feedbacks', data);
export const sendFeedbackForms = (eventId) => API.post(`/guest-feedbacks/send/${eventId}`);

export const getDMUnreadCount = (userId) => API.get(`/chat/dm/unread-count/${userId}`);
export const getUnreadSenders = (userId) => API.get(`/chat/dm/unread-senders/${userId}`);
export const markDMRead = (receiverId, senderId) => API.patch(`/chat/dm/mark-read/${receiverId}/${senderId}`);

export const getUnreadCount = (userId) => API.get(`/notifications/user/${userId}/unread-count`);
export const markAllRead = (userId) => API.patch(`/notifications/user/${userId}/mark-all-read`);
export const getNotifications = (userId) => API.get(`/notifications/user/${userId}`);

export const getTeamMembers = () => API.get('/users/team-members');
export const getUsers = () => API.get('/users');
export const getDMPartners = (userId) => API.get(`/chat/dm/partners/${userId}`);
export const sendVendorRequest = (data) => API.post('/notifications/vendor-request', data);
export const respondToVendorRequest = (notifId, data) => API.patch(`/notifications/${notifId}/respond`, data);
export const getAcceptedVendorIds = (userId) => API.get(`/notifications/accepted-vendors/${userId}`);


export const uploadTaskDocument = (taskId, file, uploadedById) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('taskId', taskId);
  formData.append('uploadedById', uploadedById);
  return API.post('/task-documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getTaskDocuments = (taskId) => API.get(`/task-documents/task/${taskId}`);
export const deleteTaskDocument = (docId) => API.delete(`/task-documents/${docId}`);


export default API;
