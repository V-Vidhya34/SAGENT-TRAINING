import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { getChatRoom, getMessages, sendMessage, addMember,
         getEventsByOrganizer, sendDM, getDMConversation,
         getUsers, getAllEvents, getDMPartners,getUnreadCount,getUnreadSenders,markDMRead,getTasksByUser } from '../services/api';

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('group');

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dmPartners, setDmPartners] = useState([]);
  const [selectedDMUser, setSelectedDMUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmMsg, setDmMsg] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const msgEnd = useRef(null);

  const roleColor = { ORGANIZER: 'var(--primary)', TEAM_MEMBER: 'var(--warning)', VENDOR: 'var(--success)' };

  const [unreadCount, setUnreadCount] = useState(0);

  const [unreadSenders, setUnreadSenders] = useState([]);

// loadDMPartners function la add பண்ணு:
const loadDMPartners = (allUsersData) => {
  getDMPartners(user.userId).then(r => {
    const partners = allUsersData.filter(u => r.data.includes(u.userId));
    setDmPartners(partners);
  }).catch(() => {});
  // Unread senders load பண்ணு
  getUnreadSenders(user.userId).then(r => setUnreadSenders(r.data.senderIds || [])).catch(() => {});
};

useEffect(() => {
  getUnreadCount(user.userId).then(r => setUnreadCount(r.data.unreadCount)).catch(() => {});
}, []);

  // const getFilterableUsers = (users) => {
  //   if (user?.role === 'VENDOR') return users.filter(u => u.role === 'ORGANIZER');
  //   if (user?.role === 'TEAM_MEMBER') return users.filter(u => u.role !== u.role || true);
  //   return users;
  // };

  const getFilterableUsers = (users) => {
    if (user?.role === 'VENDOR') return users.filter(u => u.role === 'ORGANIZER');
    if (user?.role === 'TEAM_MEMBER') return users.filter(u => u.role === 'ORGANIZER' || u.role === 'TEAM_MEMBER' || u.role === 'VENDOR');
    return users; // ORGANIZER — everyone
  };

  // const loadDMPartners = (allUsersData) => {
  //   getDMPartners(user.userId).then(r => {
  //     const partners = allUsersData.filter(u => r.data.includes(u.userId));
  //     setDmPartners(partners);
  //   }).catch(() => {});
  // };

  // useEffect(() => {
  //   if (user?.role !== 'VENDOR') {
  //     const fn = user?.role === 'ORGANIZER' ? getEventsByOrganizer(user.userId) : getAllEvents();
  //     fn.then(r => { setEvents(r.data); if (r.data.length > 0) setSelectedEvent(r.data[0].eventId); });
  //   }

  useEffect(() => {
  if (user?.role !== 'VENDOR') {
    if (user?.role === 'ORGANIZER') {
      getEventsByOrganizer(user.userId).then(r => {
        setEvents(r.data);
        if (r.data.length > 0) setSelectedEvent(r.data[0].eventId);
      });
    } else {
      // TEAM_MEMBER — only assigned events
      getTasksByUser(user.userId).then(r => {
        const assignedEventIds = [...new Set(r.data.map(t => t.event?.eventId).filter(Boolean))];
        getAllEvents().then(evRes => {
          const assignedEvents = evRes.data.filter(e => assignedEventIds.includes(e.eventId));
          setEvents(assignedEvents);
          if (assignedEvents.length > 0) setSelectedEvent(assignedEvents[0].eventId);
        });
      }).catch(() => {});
    }
  }
  // ... rest of useEffect
    getUsers().then(r => {
      const others = r.data.filter(u => u.userId !== user.userId);
      setAllUsers(others);
      loadDMPartners(others);

      // const dmId = searchParams.get('dmUserId');
      // if (dmId) {
      //   setTab('dm');
      //   const found = others.find(u => u.userId === parseInt(dmId));
      //   if (found) {
      //     setSelectedDMUser(found);
      //     getDMConversation(user.userId, found.userId).then(r => setDmMessages(r.data)).catch(() => {});
      //   }
      // }

      const dmId = searchParams.get('dmUserId');
if (dmId) {
  setTab('dm');
  const found = others.find(u => u.userId === parseInt(dmId));
  if (found) {
    setSelectedDMUser(found);
    getDMConversation(user.userId, found.userId).then(r => setDmMessages(r.data)).catch(() => {});
    markDMRead(user.userId, found.userId).catch(() => {}); // ← add பண்ணு
  }
}

    });
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    getChatRoom(selectedEvent).then(r => {
      setChatRoom(r.data);
      return getMessages(r.data.chatRoomId);
    }).then(r => setMessages(r.data)).catch(() => {});
  }, [selectedEvent]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, dmMessages]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setFilteredUsers([]); setShowSearch(false); return; }
    const filtered = getFilterableUsers(allUsers).filter(u =>
      u.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
    setShowSearch(true);
  };

  // const handleSelectDMUser = (selectedUser) => {
  //   setSelectedDMUser(selectedUser);
  //   setSearchQuery('');
  //   setShowSearch(false);
  //   setDmMessages([]);
  //   getDMConversation(user.userId, selectedUser.userId).then(r => setDmMessages(r.data)).catch(() => {});
  // };

  const handleSelectDMUser = (selectedUser) => {
  setSelectedDMUser(selectedUser);
  setSearchQuery('');
  setShowSearch(false);
  setDmMessages([]);
  getDMConversation(user.userId, selectedUser.userId).then(r => setDmMessages(r.data)).catch(() => {});
  // Mark as read
  markDMRead(user.userId, selectedUser.userId).catch(() => {});
  setUnreadSenders(prev => prev.filter(id => id !== selectedUser.userId));
};

  const handleDMSend = async () => {
    if (!dmMsg.trim() || !selectedDMUser) return;
    await sendDM({ senderId: user.userId, receiverId: selectedDMUser.userId, content: dmMsg });
    setDmMsg('');
    getDMConversation(user.userId, selectedDMUser.userId).then(r => {
      setDmMessages(r.data);
      loadDMPartners(allUsers);
    });
  };

  // const handleSend = async () => {
  //   if (!newMsg.trim() || !chatRoom) return;
  //   try {
  //     await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
  //     setNewMsg('');
  //     getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
  //   } catch (e) {
  //     if (e.response?.status === 500) {
  //       await addMember(chatRoom.chatRoomId, user.userId);
  //       await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
  //       setNewMsg('');
  //       getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
  //     }
  //   }
  // // };


  // const handleSend = async () => {
  //   if (!newMsg.trim() || !chatRoom) return;
  //   try {
  //     await addMember(chatRoom.chatRoomId, user.userId);
  //     await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
  //     setNewMsg('');
  //     getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
  //   } catch (e) {
  //     console.error('Send error:', e);
  //   }
  // };

  // const handleSend = async () => {
  // if (!newMsg.trim() || !chatRoom) return;
  // try {
  //   await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
  //   setNewMsg('');
  //   getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
  // } catch (e) {
  //   if (e.response?.status === 500) {
  //     try {
  //       await addMember(chatRoom.chatRoomId, user.userId);
  //       await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
  //       setNewMsg('');
  //       getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
  //     } catch (err) {
  //       console.error('Send error:', err);
  //     }
  //   }
  // }
//};

const handleSend = async () => {
  if (!newMsg.trim() || !chatRoom) return;
  try {
    await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
    setNewMsg('');
    getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
    // Count refresh
    getUnreadCount(user.userId).then(r => setUnreadCount(r.data.unreadCount)).catch(() => {});
  } catch (e) {
    if (e.response?.status === 500) {
      try {
        await addMember(chatRoom.chatRoomId, user.userId);
        await sendMessage(chatRoom.chatRoomId, { senderId: user.userId, content: newMsg });
        setNewMsg('');
        getMessages(chatRoom.chatRoomId).then(r => setMessages(r.data));
      } catch (err) {
        console.error('Send error:', err);
      }
    }
  }
};

  const bubbleStyle = (isMe) => ({
    maxWidth: '70%', padding: '10px 14px',
    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isMe ? 'var(--primary)' : 'var(--border-light)',
    color: isMe ? 'white' : 'var(--text-primary)', fontSize: '14px'
  });

  const msgStyle = (isMe) => ({
    display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '12px'
  });

  return (
    <div className="page">
      <div className="container">
        <h2>Chat</h2>

        {/* <div className="flex gap-10" style={{ marginBottom: '16px' }}>
          {user?.role !== 'VENDOR' && (
            <button className={`btn ${tab === 'group' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('group')}>
              Group Chat
            </button>
          )}
          <button className={`btn ${tab === 'dm' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('dm')}>
            Direct Message
          </button>
        </div> */}

        <div className="flex gap-10" style={{ marginBottom: '16px' }}>
  {user?.role !== 'VENDOR' && (
    <button className={`btn ${tab === 'group' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('group')}>
      Group Chat
    </button>
  )}
  <button className={`btn ${tab === 'dm' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('dm')}
    style={{ position: 'relative' }}>
    Direct Message
    {unreadCount > 0 && (
      <span style={{
        position: 'absolute', top: '-6px', right: '-6px',
        background: 'var(--danger)', color: 'white',
        borderRadius: '50%', width: '18px', height: '18px',
        fontSize: '11px', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {unreadCount}
      </span>
    )}
  </button>
</div>

        {/* GROUP CHAT */}
        {tab === 'group' && user?.role !== 'VENDOR' && (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: 0 }}>{chatRoom?.name || 'Select Event'}</h3>
              <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
                style={{ width: 'auto', marginBottom: 0 }}>
                {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
              </select>
            </div>
            <div style={{
              height: '400px', overflowY: 'auto', padding: '12px',
              background: 'var(--bg)', borderRadius: 'var(--radius-md)', marginBottom: '12px'
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '160px', fontSize: '14px' }}>
                  No messages yet. Say hi!
                </div>
              )}
              {messages.map(m => (
                <div key={m.messageId} style={msgStyle(m.sender?.userId === user.userId)}>
                  <div>
                    {m.sender?.userId !== user.userId && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{m.sender?.name}</div>
                    )}
                    <div style={bubbleStyle(m.sender?.userId === user.userId)}>{m.content}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {new Date(m.sentAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgEnd} />
            </div>
            <div className="flex gap-10">
              <input placeholder="Type a message..." value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ marginBottom: 0 }} />
              <button className="btn btn-primary" onClick={handleSend}>Send</button>
            </div>
          </div>
        )}

        {/* DIRECT MESSAGE */}
        {tab === 'dm' && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', height: '550px' }}>

            {/* Left Panel */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ marginBottom: '12px' }}>Messages</h3>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input placeholder="Search people..." value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  style={{ marginBottom: 0, fontSize: '13px' }} />
                {showSearch && (
                  <div style={{
                    position: 'absolute', top: '44px', left: 0, right: 0,
                    background: 'white', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', zIndex: 100,
                    boxShadow: 'var(--shadow-md)', maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {filteredUsers.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No users found</div>
                    ) : filteredUsers.map(u => (
                      <div key={u.userId} onClick={() => handleSelectDMUser(u)} style={{
                        padding: '10px 14px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-light)'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: roleColor[u.role] || 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '13px', flexShrink: 0
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {dmPartners.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
                    Search someone to start chatting
                  </p>
                )}
                {/* {dmPartners.map(p => (
                  <div key={p.userId} onClick={() => handleSelectDMUser(p)} style={{
                    padding: '10px 12px', cursor: 'pointer', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px',
                    background: selectedDMUser?.userId === p.userId ? 'var(--primary-light)' : 'transparent',
                    border: `1px solid ${selectedDMUser?.userId === p.userId ? 'var(--primary)' : 'transparent'}`,
                    transition: 'all var(--transition)'
                  }}
                    onMouseEnter={e => { if (selectedDMUser?.userId !== p.userId) e.currentTarget.style.background = 'var(--bg)'; }}
                    onMouseLeave={e => { if (selectedDMUser?.userId !== p.userId) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: roleColor[p.role] || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '15px', flexShrink: 0
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.role?.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))} */}

                {dmPartners.map(p => (
  <div key={p.userId} onClick={() => {
    handleSelectDMUser(p);
    setUnreadSenders(prev => prev.filter(id => id !== p.userId));
  }} style={{
    padding: '10px 12px', cursor: 'pointer', borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px',
    background: selectedDMUser?.userId === p.userId ? 'var(--primary-light)' : 'transparent',
    border: `1px solid ${selectedDMUser?.userId === p.userId ? 'var(--primary)' : 'transparent'}`,
    transition: 'all var(--transition)'
  }}>
    <div style={{ position: 'relative' }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: roleColor[p.role] || 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 700, fontSize: '15px', flexShrink: 0
      }}>
        {p.name.charAt(0).toUpperCase()}
      </div>
      {/* Unread dot */}
      {unreadSenders.includes(p.userId) && (
        <span style={{
          position: 'absolute', top: 0, right: 0,
          width: '10px', height: '10px',
          background: '#ef4444', borderRadius: '50%',
          border: '2px solid white'
        }} />
      )}
    </div>
    <div>
      <div style={{
        fontWeight: unreadSenders.includes(p.userId) ? 700 : 600,
        fontSize: '13px',
        color: unreadSenders.includes(p.userId) ? 'var(--text-primary)' : 'var(--text-secondary)'
      }}>
        {p.name}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.role?.replace('_', ' ')}</div>
    </div>
  </div>
))}
              </div>
            </div>

            {/* Right Panel */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              {!selectedDMUser ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '14px' }}>Select a contact to start chatting</p>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)'
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: roleColor[selectedDMUser.role] || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '16px'
                    }}>
                      {selectedDMUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedDMUser.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedDMUser.role?.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div style={{
                    flex: 1, overflowY: 'auto', padding: '12px',
                    background: 'var(--bg)', borderRadius: 'var(--radius-md)', marginBottom: '12px'
                  }}>
                    {dmMessages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '100px', fontSize: '14px' }}>
                        No messages yet. Say hi to {selectedDMUser.name}!
                      </div>
                    )}
                    {dmMessages.map(m => (
                      <div key={m.dmId} style={msgStyle(m.sender?.userId === user.userId)}>
                        <div>
                          <div style={bubbleStyle(m.sender?.userId === user.userId)}>{m.content}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {new Date(m.sentAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={msgEnd} />
                  </div>

                  <div className="flex gap-10">
                    <input placeholder={`Message ${selectedDMUser.name}...`}
                      value={dmMsg} onChange={e => setDmMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDMSend()}
                      style={{ marginBottom: 0 }} />
                    <button className="btn btn-primary" onClick={handleDMSend}>Send</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;