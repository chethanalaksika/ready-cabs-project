import { useState, useEffect, useRef, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import './index.css';

// --- INITIAL MOCK DATA ---
const initialUsers = [
  { id: 'u1', username: 'admin', password: '1234', name: 'Ready Admin', email: 'admin@readycabs.com', role: 'admin' },
];

const initialCars = [
  {
    id: 'c1',
    brand: 'Toyota',
    model: 'Prius 2024',
    description: 'Hybrid efficiency with modern comfort. Perfect for city tours.',
    pricePerDay: 15000,
    image: 'prius.jpg',
    availableDates: ['2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14', '2026-04-15'],
  },
  {
    id: 'c2',
    brand: 'Honda',
    model: 'Vezel RS',
    description: 'Sporty crossover SUV ideal for both city and outstation trips.',
    pricePerDay: 20000,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    availableDates: ['2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18'],
  }
];

// --- EMAIL SETTINGS ---
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_8qdbemt',
  TEMPLATE_ID: 'template_nlbhlyo',
  PUBLIC_KEY: 'wEEwxITCFbOsOWA2N'
};

const sendEmail = (to_email, to_name, message, subject) => {
  if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY.includes('YOUR')) return;
  const templateParams = { to_email, to_name, from_name: 'Ready Cabs & Tours', message, subject };
  emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, templateParams, EMAILJS_CONFIG.PUBLIC_KEY)
    .then((res) => console.log('Email sent!', res), (err) => console.error('Email failed', err));
};

const API_URL = import.meta.env.DEV ? 'http://127.0.0.1:5000/api' : '/api';

export default function App() {
  const initialBackendFallback = [{ id: 'u1', username: 'admin', password: '1234', name: 'Ready Admin', role: 'admin' }];
  const [users, setUsers] = useState(initialBackendFallback);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [adminSettings, setAdminSettings] = useState({ notificationEmail: 'chethanalaksika9@gmail.com' });
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cars');
  const [custCancel, setCustCancel] = useState(null);
  const [custReason, setCustReason] = useState('');
  const [showDeveloper, setShowDeveloper] = useState(false);

  // Auto-reset tab on login/logout (v9.5 Reliability Fix)
  useEffect(() => {
    if (currentUser) {
       if (currentUser.role === 'admin') setActiveTab('analytics');
       else setActiveTab('cars');
    }
  }, [currentUser]);

  // --- INITIAL DATA FETCH (PG) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await fetch(`${API_URL}/users`).then(r => r.json()); if (Array.isArray(u)) setUsers(u);
        const c = await fetch(`${API_URL}/cars`).then(r => r.json()); if (Array.isArray(c)) setCars(c);
        const b = await fetch(`${API_URL}/bookings`).then(r => r.json()); if (Array.isArray(b)) setBookings(b);
        const m = await fetch(`${API_URL}/messages`).then(r => r.json()); if (Array.isArray(m)) setMessages(m);
      } catch (err) { console.error("Fetch failed", err); }
    };
    fetchData();
  }, []);

  // --- REAL-TIME POLLING FOR USERS, MESSAGES & BOOKINGS (3s) ---
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const u = await fetch(`${API_URL}/users`).then(r => r.json()); if (Array.isArray(u)) setUsers(u);
        const m = await fetch(`${API_URL}/messages`).then(r => r.json()); if (Array.isArray(m)) setMessages(m);
        const b = await fetch(`${API_URL}/bookings`).then(r => r.json()); if (Array.isArray(b)) setBookings(b);
      } catch (e) {}
    }, 3000);
    return () => clearInterval(poll);
  }, []);

  // Sync users to local for current session if needed
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('cars', JSON.stringify(cars)); }, [cars]);
  useEffect(() => { localStorage.setItem('bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('adminSettings', JSON.stringify(adminSettings)); }, [adminSettings]);

  if (!currentUser) return (
    <div className="app-container">
      <AuthView setUsers={setUsers} users={users || []} onLogin={setCurrentUser} />
    </div>
  );

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand brand-font">Ready Cabs <span className="brand-accent">& Tours</span></div>
        <div className="nav-links">
          {currentUser.role === 'admin' ? (
            <>
              <button className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Overview</button>
              <button className={`nav-link ${activeTab === 'cars' ? 'active' : ''}`} onClick={() => setActiveTab('cars')}>Fleet</button>
              <button 
                className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`} 
                onClick={() => setActiveTab('bookings')}
                style={{ position: 'relative' }}
              >
                Bookings
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                   <span style={{ position: 'absolute', top: '-5px', right: '-12px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 900, minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)', border: '2px solid #000', padding: '0 4px' }}>
                      {bookings.filter(b => b.status === 'pending').length}
                   </span>
                )}
              </button>
              <button className={`nav-link ${activeTab === 'admin_alerts' ? 'active' : ''}`} onClick={() => {
                setActiveTab('admin_alerts');
                bookings.forEach(b => {
                  if (b.status === 'customer_canceled' && !b.adminSeen) {
                    fetch(`${API_URL}/bookings/${b.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...b, adminSeen: true })
                    });
                  }
                });
                setBookings(prev => prev.map(b => b.status === 'customer_canceled' ? { ...b, adminSeen: true } : b));
              }}>
                Alerts
                {bookings.filter(b => b.status === 'customer_canceled' && !b.adminSeen).length > 0 && (
                   <span style={{ marginLeft: '8px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}></span>
                )}
              </button>
              <button className={`nav-link ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>Users</button>
              <button className={`nav-link ${activeTab === 'add_member' ? 'active' : ''}`} onClick={() => setActiveTab('add_member')}>+ Add Member</button>
            </>
          ) : (
            <>
              <button className={`nav-link ${activeTab === 'cars' ? 'active' : ''}`} onClick={() => setActiveTab('cars')}>Fleet</button>
              <button className={`nav-link ${activeTab === 'mybookings' ? 'active' : ''}`} onClick={() => setActiveTab('mybookings')}>My Bookings</button>
              <button className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => {
                setActiveTab('notifications');
                bookings.forEach(b => {
                  if (b.customerId === currentUser.id && b.status === 'rejected' && !b.seen) {
                    fetch(`${API_URL}/bookings/${b.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...b, seen: true })
                    });
                  }
                });
                setBookings(prev => prev.map(b => (b.customerId === currentUser.id && b.status === 'rejected') ? { ...b, seen: true } : b));
              }}>
                Alerts
                {bookings.filter(b => b.customerId === currentUser.id && b.status === 'rejected' && !b.seen).length > 0 && (
                   <span style={{ marginLeft: '8px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}></span>
                )}
              </button>
              <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
            </>
          )}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 16px' }}></div>
          <button className="btn-secondary" onClick={() => setCurrentUser(null)}>Logout</button>
        </div>
      </nav>
      <main className="main-content" style={{ maxWidth: activeTab === 'cars' && currentUser.role === 'customer' ? '100%' : '1200px', padding: activeTab === 'cars' && currentUser.role === 'customer' ? '0' : '40px' }}>
        {currentUser.role === 'admin' ? (
          <>
            {activeTab === 'analytics' && <AdminAnalytics bookings={bookings} cars={cars} users={users} />}
            {activeTab === 'cars' && <AdminCars cars={cars} setCars={setCars} />}
            {activeTab === 'bookings' && <AdminBookings bookings={bookings} setBookings={setBookings} cars={cars} users={users} />}
            {activeTab === 'admin_alerts' && <AdminNotifications bookings={bookings} cars={cars} users={users} />}
            {activeTab === 'customers' && <AdminCustomers users={users} setUsers={setUsers} setBookings={setBookings} cars={cars} adminSettings={adminSettings} />}
            {activeTab === 'add_member' && <AdminAddMember setUsers={setUsers} setActiveTab={setActiveTab} />}
          </>
        ) : (
          <>
            {activeTab === 'cars' && <CustomerCars cars={cars} setCars={setCars} bookings={bookings} setBookings={setBookings} currentUser={currentUser} adminSettings={adminSettings} />}
            {activeTab === 'mybookings' && <CustomerBookings bookings={bookings} cars={cars} currentUser={currentUser} setCustCancel={setCustCancel} setCustReason={setCustReason} />}
            {activeTab === 'notifications' && <CustomerNotifications bookings={bookings} setBookings={setBookings} cars={cars} currentUser={currentUser} setCustCancel={setCustCancel} setCustReason={setCustReason} />}
            {activeTab === 'profile' && <CustomerProfile currentUser={currentUser} setCurrentUser={setCurrentUser} setUsers={setUsers} users={users} onLogout={() => setCurrentUser(null)} />}
          </>
        )}
      </main>
      
      {custCancel && (
        <div className="modal-overlay" style={{ zIndex: 10001, backdropFilter: 'blur(15px)' }}>
          <div className="glass-card modal-content" style={{ maxWidth: '450px', padding: '40px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
             <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚨</div>
             <h3 className="brand-font" style={{ fontSize: '1.8rem', color: '#fff' }}>Cancel Trip Request</h3>
             <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Please provide a specific reason for canceling your booking of <strong style={{ color: 'var(--primary)' }}>{cars.find(c => c.id === custCancel.carId)?.model}</strong>.</p>
             <textarea 
                value={custReason} 
                onChange={e => setCustReason(e.target.value)} 
                placeholder="TYPE CANCELLATION REASON HERE..." 
                style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', marginBottom: '25px', outline: 'none' }}
             />
             <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-danger" 
                  style={{ flex: 1, padding: '15px', borderRadius: '50px', fontWeight: 800, opacity: custReason.trim() ? 1 : 0.4, cursor: custReason.trim() ? 'pointer' : 'not-allowed' }}
                  disabled={!custReason.trim()}
                  onClick={() => {
                    const update = { status: 'customer_canceled', custCancelReason: custReason, adminSeen: false };
                    fetch(`${API_URL}/bookings/${custCancel.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(update)
                    }).then(() => {
                       setBookings(prev => prev.map(b => b.id === custCancel.id ? { ...b, ...update } : b));
                       sendEmail(adminSettings.notificationEmail, 'Admin', `Trip Canceled by Customer (${currentUser.name}): ${custReason}`, `Customer Cancellation`);
                       setCustCancel(null); setCustReason('');
                    });
                  }}
                >
                  YES, CANCEL
                </button>
                <button className="btn-secondary" style={{ flex: 1, padding: '15px', borderRadius: '50px', fontWeight: 800 }} onClick={() => { setCustCancel(null); setCustReason(''); }}>GO BACK</button>
             </div>
          </div>
        </div>
      )}

      <ChatWidget currentUser={currentUser} users={users} messages={messages} setMessages={setMessages} />

      {/* Developer Watermark Button */}
      <button 
        onClick={() => setShowDeveloper(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '10px 18px',
          borderRadius: '50px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9000,
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }}></div> Developed By
      </button>

      {/* Developer Modal */}
      {showDeveloper && (
        <div className="modal-overlay" style={{ zIndex: 10002, backdropFilter: 'blur(20px)' }} onClick={() => setShowDeveloper(false)}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', padding: '40px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.4)', background: '#0a0a0f' }} onClick={e => e.stopPropagation()}>
             <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)', color: '#000' }}>⭐</div>
             <h3 className="brand-font" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '2px' }}>Software Engineer</h3>
             <h2 className="brand-font" style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '25px' }}>Chethana Laksika</h2>
             
             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 500 }}>
                   <span style={{ fontSize: '1.5rem' }}>📞</span> 070 566 4601
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-main)', fontSize: '1rem', fontStyle: 'italic', wordBreak: 'break-all' }}>
                   <span style={{ fontSize: '1.5rem' }}>✉️</span> chethanalaksika9@gmail.com
                </div>
             </div>

             <button 
               className="btn-primary" 
               style={{ width: '100%', height: '55px', borderRadius: '50px', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase' }} 
               onClick={() => setShowDeveloper(false)}
             >
               Close Developer Info
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAnalytics({ bookings, cars, users }) {
  const revenue = useMemo(() => {
    return bookings.filter(b => b.status === 'accepted').reduce((sum, b) => {
      const days = Array.isArray(b.date) ? b.date.length : 1;
      const car = cars.find(c => c.id === b.carId);
      const dailyPrice = car ? Number(car.pricePerDay) : 0;
      const extra = Number(b.extraCharge) || 0;
      return sum + (dailyPrice * days) + extra;
    }, 0);
  }, [bookings, cars]);

  return (
    <div style={{ animation: 'fadeUp 0.8s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div><h2 className="brand-font" style={{ fontSize: '3rem', margin: 0 }}>Analytics</h2><p style={{ color: 'var(--text-muted)' }}>Business Overview</p></div>
      </div>
      <div className="grid-cars" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
        <div className="glass-card" style={{ padding: '30px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>REVENUE</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '15px 0', color: 'var(--primary)' }}>LKR {revenue.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ padding: '30px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>USERS</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '15px 0' }}>{users.filter(u => u.role === 'customer').length}</div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3 className="brand-font" style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Elite Member Rankings</h3>
        <div className="glass-card" style={{ padding: '40px' }}>
           {(() => {
              const counts = {};
              bookings.forEach(b => { counts[b.customerId] = (counts[b.customerId] || 0) + 1; });
              const sorted = Object.entries(counts)
                .map(([id, count]) => ({ user: users.find(u => u.id === id), count }))
                .filter(x => x.user)
                .sort((a,b) => b.count - a.count)
                .slice(0, 5);
              
              if (sorted.length === 0) return <div style={{ textAlign: 'center', opacity: 0.5 }}>No data available to generate rankings.</div>;
              
              const max = sorted[0].count;
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {sorted.map((item, idx) => (
                      <div key={item.user.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', animation: `slideRight ${0.4 + idx*0.1}s ease-out` }}>
                         <div style={{ width: '150px', textAlign: 'right', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.user.name.toUpperCase()}</div>
                         <div style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${(item.count/max)*100}%`, height: '100%', background: 'linear-gradient(to right, #f59e0b, #b45309)', borderRadius: '15px', position: 'relative', transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                               <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#000', fontSize: '0.8rem' }}>{item.count}</div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              );
           })()}
        </div>
      </div>
    </div>
  );
}

function AuthView({ setUsers, users, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '', whatsapp: '', selfie: '' });
  const [error, setError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
       if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
       }
    } catch (e) {
       setError("Camera permission denied.");
       setIsCameraActive(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setFormData({ ...formData, selfie: canvas.toDataURL('image/jpeg') });
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setIsCameraActive(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    console.log("Submit triggered. isLogin:", isLogin, "Users count:", users?.length);
    if (isLogin) {
      if (!users || users.length === 0) {
        console.warn("Users list is empty, cannot verify credentials.");
        return setError('Invalid credentials (System syncing...)');
      }
      const user = users.find(u => u.username === formData.username && u.password === formData.password);
      console.log("User search result:", user ? "Found" : "Not Found");
      if (user) onLogin(user); else setError('Invalid credentials');
    } else {
      if (!formData.username || !formData.password || !formData.name || !formData.whatsapp || !formData.selfie || !formData.email) return setError('Mandatory fields missing');
      console.log("Attempting registration for:", formData.username);
      const newUser = { id: 'u' + Date.now() + Math.random().toString(36).substr(2, 5), ...formData, role: 'customer' };
      fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).then(() => {
        setUsers(prev => [...prev, newUser]);
        onLogin(newUser);
      }).catch(err => {
        console.error("Reg Error", err);
        setError('Connection error. Try again.');
      });
    }
  };

  return (
    <div className="login-layout">
      <div className="login-bg-text"><span>READY</span><span style={{ marginLeft: '10%' }}>CABS</span></div>
      <div className="hero-wrapper" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
        <div className="glass-card auth-box">
          <h2 className="brand-font" style={{ textAlign: 'center', fontSize: '3rem', margin: '0' }}>Ready Cabs</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>Sign in or Register</p>
          {error && <div className="badge badge-rejected" style={{ width: '100%', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                <input placeholder="WhatsApp" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                <div style={{ marginBottom: '20px' }}>
                  {!formData.selfie ? (
                    <div>{isCameraActive ? <><video ref={videoRef} style={{ width: '100%', borderRadius: '12px' }} /><button type="button" className="btn-primary" onClick={captureSelfie} style={{ width: '100%', marginTop: '10px' }}>CAPTURE</button></> : <button type="button" className="btn-success" onClick={startCamera} style={{ width: '100%' }}>TAKE SELFIE</button>}</div>
                  ) : <div style={{ position: 'relative' }}><img src={formData.selfie} style={{ width: '100%', borderRadius: '12px' }} alt="Selfie" /><button type="button" onClick={() => setFormData({...formData, selfie: ''})} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', color: '#fff', border: 'none', width: '25px', height: '25px' }}>✕</button></div>}
                </div>
              </>
            )}
            <input placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
            <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <button className="btn-primary" style={{ width: '100%', marginTop: '16px', height: '55px' }}>{isLogin ? 'Login' : 'Submit'}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '24px', width: '100%', color: 'var(--primary)' }}>{isLogin ? 'Register' : 'Login'}</button>
        </div>
      </div>
    </div>
  );
}

function AdminCars({ cars, setCars }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const initialForm = { brand: '', model: '', pricePerDay: '', image: '', availableDates: [] };
  const [formData, setFormData] = useState(initialForm);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const datesForMonth = useMemo(() => {
    const [y, mm] = viewMonth.split('-').map(Number);
    const lastDay = new Date(y, mm, 0).getDate();
    return Array.from({length: lastDay}, (_, i) => `${viewMonth}-${(i+1).toString().padStart(2,'0')}`);
  }, [viewMonth]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      const r = new FileReader(); r.onloadend = () => setFormData({ ...formData, image: r.result }); r.readAsDataURL(f);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const cleanForm = { ...formData, pricePerDay: Number(formData.pricePerDay) };
    if (editingCar) {
      // In a full implementation we would Patch here, but for this step we will skip as it's a prototype car list.
      setCars(prev => prev.map(c => c.id === editingCar.id ? { ...cleanForm, id: c.id } : c));
    } else {
      const newCar = { ...cleanForm, id: 'c' + Date.now() + Math.random().toString(36).substr(2, 5) };
      console.log("Sending Car Data:", newCar);
      fetch(`${API_URL}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCar)
      }).then(res => {
        if (res.ok) {
           setCars(prev => [...prev, newCar]);
           alert('Vehicle Saved Successfully!');
           setShowAdd(false); setEditingCar(null); setFormData(initialForm);
        } else {
           res.json().then(e => alert('Database Error: ' + e.error));
        }
      }).catch(e => {
        console.error("Network Error:", e);
        alert('Connection error. Is the backend running?');
      });
    }
  };

  const executeDelete = () => {
    fetch(`${API_URL}/cars/delete/${confirmDelete.id}`, { method: 'POST' })
      .then(res => {
        if (res.ok) {
          setCars(prev => prev.filter(x => x.id !== confirmDelete.id));
          setConfirmDelete(null);
        } else {
          alert('Failed to delete from database');
        }
      });
  };

  const toggleDate = (d) => {
    const list = formData.availableDates || [];
    if (list.includes(d)) setFormData({ ...formData, availableDates: list.filter(x => x !== d) });
    else setFormData({ ...formData, availableDates: [...list, d] });
  };

  const handleM = (delta) => {
    const [y, m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setViewMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2 className="brand-font" style={{ fontSize: '2.5rem' }}>Fleet Management</h2>
        <button className="btn-primary" onClick={() => { setEditingCar(null); setFormData(initialForm); setShowAdd(true); }}>+ Add New Vehicle</button>
      </div>
      <div className="grid-cars">
        {cars.map(c => (
          <div key={c.id} className="car-card">
            <img src={c.image} className="car-image" alt={c.model} />
            <div className="car-details">
               <h3 className="brand-font" style={{ fontSize: '1.2rem' }}>{c.model}</h3>
               <div className="car-price" style={{ margin: '15px 0' }}>LKR {Number(c.pricePerDay || 0).toLocaleString()}</div>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-success" style={{ flex: 1 }} onClick={() => { setEditingCar(c); setFormData(c); setShowAdd(true); }}>Edit</button>
                  <button onClick={() => setConfirmDelete(c)} className="btn-danger" style={{ flex: 1 }}>Del</button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ padding: '30px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
             <h3 className="brand-font" style={{ marginBottom: '20px' }}>{editingCar ? 'Update Vehicle' : 'Register New Vehicle'}</h3>
             <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <input placeholder="Brand" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                   <input placeholder="Model" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <input placeholder="Price per Day" type="number" value={formData.pricePerDay} onChange={e => setFormData({...formData, pricePerDay: e.target.value})} />
                
                <h4 style={{ margin: '10px 0 5px' }}>Set Availability (Any Month)</h4>
                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <button type="button" onClick={() => handleM(-1)} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: 900, fontSize: '1.5rem', cursor: 'pointer', border: 'none' }}>◀</button>
                    <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800 }}>{new Date(viewMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    <button type="button" onClick={() => handleM(1)} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: 900, fontSize: '1.5rem', cursor: 'pointer', border: 'none' }}>▶</button>
                  </div>
                  <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                    {datesForMonth.map(d => (
                      <div key={d} onClick={() => toggleDate(d)} className={`cal-day available`} style={{ width: 'auto', height: '35px', fontSize: '0.8rem', border: formData.availableDates?.includes(d) ? '2px solid var(--primary)' : '1px solid #333', background: formData.availableDates?.includes(d) ? 'rgba(245, 158, 11, 0.2)' : '' }}>{d.slice(-2)}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.5 }}>{formData.availableDates?.length || 0} days total selected</div>
                </div>

                <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  {formData.image ? (
                    <div style={{ position: 'relative' }}><img src={formData.image} style={{ width: '100%', borderRadius: '8px' }} alt="Preview" /><button type="button" onClick={() => setFormData({...formData, image: ''})} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '25px', height: '25px' }}>✕</button></div>
                  ) : (
                    <label style={{ cursor: 'pointer' }}>Click to Upload Photo<input type="file" hidden accept="image/*" onChange={handleFile} /></label>
                  )}
                </div>
                <button className="btn-primary" style={{ height: '50px' }}>{editingCar ? 'UPDATE FLEET' : 'SAVE TO FLEET'}</button>
                <button type="button" className="btn-secondary" style={{ width: '100%', borderRadius: '50px' }} onClick={() => setShowAdd(false)}>CANCEL</button>
             </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(15px)' }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
             <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
             <h3 className="brand-font" style={{ fontSize: '1.8rem', color: '#fff' }}>Secure Fleet Alert</h3>
             <p style={{ color: 'var(--text-muted)', margin: '15px 0 30px' }}>Are you absolutely sure you want to permanently remove <strong style={{ color: 'var(--primary)' }}>{confirmDelete.model}</strong> from the collection?</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn-danger" style={{ height: '55px', borderRadius: '50px', fontSize: '1rem', fontWeight: 800 }} onClick={executeDelete}>YES, PROCEED DELETE</button>
                <button className="btn-secondary" style={{ height: '55px', borderRadius: '50px', fontSize: '1rem', fontWeight: 800 }} onClick={() => setConfirmDelete(null)}>NO, ABORT ACTION</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminBookings({ bookings, setBookings, cars, users }) {
  const [selected, setSelected] = useState(null);
  const [canceling, setCanceling] = useState(null);
  const [reason, setReason] = useState('');

  const sortedBookings = useMemo(() => [...bookings].sort((a,b)=>b.id.localeCompare(a.id)), [bookings]);

  const handleStatus = (id, status) => {
    fetch(`${API_URL}/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, seen: false, adminSeen: true })
    }).then(() => {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status, seen: false, adminSeen: true } : b));
      const b = bookings.find(x => x.id === id);
      const u = users.find(x => x.id === b.customerId);
      if (u?.email) sendEmail(u.email, u.name, `Booking status: ${status}`, `Update`);
      setSelected(null);
    });
  };

  const confirmCancel = () => {
    fetch(`${API_URL}/bookings/${canceling.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', cancelReason: reason, seen: false, adminSeen: true })
    }).then(() => {
      setBookings(prev => prev.map(b => b.id === canceling.id ? { ...b, status: 'rejected', cancelReason: reason, seen: false, adminSeen: true } : b));
      const u = users.find(x => x.id === canceling.customerId);
      if (u?.email) sendEmail(u.email, u.name, `Canceled: ${reason}`, `Cancellation`);
      setCanceling(null); setReason(''); setSelected(null);
    });
  };

  const customerUser = selected ? users.find(u => u.id === selected.customerId) : null;

  return (
    <div style={{ animation: 'fadeUp 0.8s' }}>
      <h2 className="brand-font">Reservations</h2>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>CUSTOMER</th><th>CAR</th><th>STAY</th><th>STATUS</th><th>ACTION</th></tr></thead>
          <tbody>
            {sortedBookings.map(b => (
              <tr key={b.id}>
                <td>{b.customerName}</td>
                <td>{cars.find(c => c.id === b.carId)?.model}</td>
                <td>{Array.isArray(b.date) ? b.date.length : 1} Days</td>
                <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                <td><button className="btn-primary" style={{ padding: '8px 20px', borderRadius: '50px' }} onClick={() => setSelected(b)}>Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(15px)' }}>
          <div className="modal-content glass-card" style={{ maxWidth: '800px', width: '95%', padding: '0', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.2)', maxHeight: '90vh', display: 'flex' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', width: '100%' }}>
                <div style={{ padding: '30px', borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
                   <div style={{ marginBottom: '25px' }}>
                      <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '10px' }}>CUSTOMER IDENTITY</h4>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <img src={customerUser?.selfie} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} alt="Selfie" />
                         <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', wordBreak: 'break-word' }}>{selected.customerName}</div>
                            <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>{customerUser?.email}</div>
                            <div style={{ color: '#fff', opacity: 0.5, fontWeight: 700, fontSize: '0.75rem', marginTop: '2px' }}>{customerUser?.whatsapp}</div>
                         </div>
                      </div>
                   </div>
                   
                   <h4 style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '10px' }}>VERIFICATION DOCUMENT</h4>
                   <img src={selected.idPhoto} style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' }} alt="ID Photo" />
                </div>

                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                   <h3 className="brand-font" style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>Trip Overview</h3>
                   <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                      <span className={`badge badge-${selected.status}`} style={{ fontSize: '0.7rem' }}>{selected.status.toUpperCase()}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, background: selected.extraCharge > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', color: selected.extraCharge > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.5)', padding: '4px 12px', borderRadius: '50px', border: '1px solid currentColor', letterSpacing: '0.5px' }}>
                         {selected.extraCharge > 0 ? 'WITH CHAUFFEUR' : 'SELF-DRIVE'}
                      </span>
                   </div>
                   
                   <div style={{ flex: 1 }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 3px 0' }}>SELECTED VEHICLE</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '15px' }}>{cars.find(c => c.id === selected.carId)?.model}</p>

                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 3px 0' }}>RESERVED DATES</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                         {selected.date.map(d => (
                            <span key={d} style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                               {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                         ))}
                      </div>
                   </div>

                   <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                         {selected.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                               <button className="btn-success" style={{ flex: 1, height: '45px', borderRadius: '50px', fontWeight: 800, fontSize: '0.8rem' }} onClick={() => handleStatus(selected.id, 'accepted')}>APPROVE</button>
                               <button className="btn-danger" style={{ flex: 1, height: '45px', borderRadius: '50px', fontWeight: 800, fontSize: '0.8rem' }} onClick={() => setCanceling(selected)}>REJECT</button>
                            </div>
                         ) : selected.status === 'accepted' ? (
                            <button className="btn-danger" style={{ width: '100%', height: '45px', borderRadius: '50px', fontWeight: 800, fontSize: '0.8rem' }} onClick={() => setCanceling(selected)}>CANCEL TRIP</button>
                         ) : null}
                         <button className="btn-secondary" style={{ height: '45px', borderRadius: '50px', fontWeight: 800, fontSize: '0.8rem' }} onClick={() => setSelected(null)}>CLOSE WINDOW</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {canceling && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', padding: '30px' }}>
             <h3>Cancellation Reason</h3>
             <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="PLEASE TYPE SPECIFIC REJECTION REASON HERE..." 
                style={{ width: '100%', height: '120px', marginTop: '20px', padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: reason.trim() ? '1px solid var(--primary)' : '1px solid rgba(239, 68, 68, 0.3)', color: '#fff', fontSize: '1rem', outline: 'none' }} 
             />
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  className="btn-danger" 
                  style={{ flex: 1, height: '50px', borderRadius: '50px', fontWeight: 800, opacity: reason.trim() ? 1 : 0.4, cursor: reason.trim() ? 'pointer' : 'not-allowed' }} 
                  onClick={confirmCancel}
                  disabled={!reason.trim()}
                >
                  CONFIRM REJECT
                </button>
                <button className="btn-secondary" style={{ flex: 1, height: '50px', borderRadius: '50px', fontWeight: 800 }} onClick={() => { setCanceling(null); setReason(''); }}>ABORT</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCustomers({ users, setUsers, setBookings, cars, adminSettings }) {
  const [sel, setSel] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [manual, setManual] = useState(null); // { user, car, dates, step }

  const executeDelete = () => {
     fetch(`${API_URL}/users/delete/${confirmDel.id}`, { method: 'POST' })
       .then(res => {
         if (res.ok) {
           setUsers(prev => prev.filter(u => u.id !== confirmDel.id));
           setBookings(prev => prev.filter(b => b.customerId !== confirmDel.id));
           setConfirmDel(null);
         }
       })
       .catch(err => console.error(err));
  };

  return (
    <div style={{ animation: 'fadeUp 0.8s' }}>
      <h2 className="brand-font" style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Member Base</h2>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>IDENTIFIER</th><th>CONTACT</th><th>ACTION</th></tr></thead>
          <tbody>{users.filter(u => u.role !== 'admin').map(u => (
            <tr key={u.id}>
              <td style={{ padding: '20px', fontWeight: 600 }}>{u.name}</td>
              <td>{u.whatsapp}</td>
              <td>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn-primary" onClick={() => setSel(u)} style={{ padding: '8px 20px', fontSize: '0.8rem' }}>Profile</button>
                  <button className="btn-success" onClick={() => setManual({ user: u, step: 1 })} style={{ padding: '8px 20px', fontSize: '0.8rem' }}>Book</button>
                  <button 
                    onClick={() => setConfirmDel(u)} 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: '#ef4444', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transition: 'all 0.3s',
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.05)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.05)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <polyline points="3 6 5 6 21 6"></polyline>
                       <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      
      {sel && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(15px)' }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', padding: '0', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
             <div style={{ height: '100px', background: 'linear-gradient(to right, var(--primary), #b45309)', opacity: 0.15 }}></div>
             <div style={{ padding: '0 40px 40px', marginTop: '-50px', textAlign: 'center' }}>
                <div style={{ width: '140px', height: '140px', margin: '0 auto 20px', position: 'relative' }}>
                   <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), transparent, var(--primary))', animation: 'spin 4s linear infinite', opacity: 0.5 }}></div>
                   <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #0a0a0a', overflow: 'hidden', boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)' }}>
                      <img src={sel.selfie} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Customer Selfie" />
                   </div>
                </div>
                <h2 className="brand-font" style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#fff' }}>{sel.name}</h2>
                <div className="badge badge-pending" style={{ display: 'inline-block', marginBottom: '25px', opacity: 0.8, letterSpacing: '2px' }}>PREMIUM MEMBER</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 15px rgba(255,255,255,0.01)' }}>
                   <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>MEMBER EMAIL</div>
                   <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', wordBreak: 'break-all' }}>{sel.email || 'No email set'}</div>
                   <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }}></div>
                   <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>WHATSAPP CONNECT</div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{sel.whatsapp}</div>
                </div>

                <button className="btn-secondary" style={{ width: '100%', marginTop: '30px', height: '55px', borderRadius: '50px', fontWeight: 800 }} onClick={() => setSel(null)}>RETURN TO BASE</button>
             </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(20px)' }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
             <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚮</div>
             <h3 className="brand-font" style={{ fontSize: '1.8rem', color: '#fff' }}>Terminate User?</h3>
             <p style={{ color: 'var(--text-muted)', margin: '15px 0 30px' }}>Are you sure you want to remove <strong style={{ color: 'var(--primary)' }}>{confirmDel.name}</strong>? This will also purge their booking history.</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn-danger" style={{ height: '55px', borderRadius: '50px', fontWeight: 800 }} onClick={executeDelete}>CONFIRM TERMINATION</button>
                <button className="btn-secondary" style={{ height: '55px', borderRadius: '50px', fontWeight: 800 }} onClick={() => setConfirmDel(null)}>KEEP MEMBER</button>
             </div>
          </div>
        </div>
      )}
      {manual && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(15px)' }}>
           <div className="modal-content glass-card" style={{ maxWidth: manual.step === 1 ? '900px' : '580px', padding: 0, overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                 <h3 className="brand-font">Manual Booking: {manual.user.name}</h3>
                 <button onClick={() => setManual(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              {manual.step === 1 && (
                 <div style={{ padding: '40px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Select a vehicle to initiate the reservation.</p>
                    <div className="grid-cars" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                       {cars.map(c => (
                          <div key={c.id} className="car-card" onClick={() => setManual({ ...manual, car: c, step: 2, dates: [] })} style={{ cursor: 'pointer' }}>
                             <img src={c.image} style={{ height: '140px', objectFit: 'cover' }} alt={c.model} />
                             <div style={{ padding: '15px' }}><div style={{ fontWeight: 800 }}>{c.model}</div><div style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>LKR {c.pricePerDay.toLocaleString()}</div></div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
              {manual.step === 2 && (
                 <div style={{ padding: '40px' }}>
                    <h4 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Select Stay Dates for {manual.car.model}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px', maxHeight: '40vh', overflowY: 'auto', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px' }}>
                       {manual.car.availableDates.map(d => {
                          const isSel = manual.dates.includes(d);
                          return (
                             <div key={d} onClick={() => setManual({ ...manual, dates: isSel ? manual.dates.filter(x => x !== d) : [...manual.dates, d] })} style={{ padding: '10px 15px', borderRadius: '10px', background: isSel ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: isSel ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                {new Date(d).toLocaleDateString()}
                             </div>
                          );
                       })}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <button className="btn-primary" style={{ flex: 1 }} disabled={manual.dates.length === 0} onClick={() => setManual({ ...manual, step: 3 })}>NEXT STEP</button>
                       <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setManual({ ...manual, step: 1 })}>CHANGE CAR</button>
                    </div>
                 </div>
              )}
              {manual.step === 3 && (
                 <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚗</div>
                    <h4 className="brand-font">Reservation Summary</h4>
                    <div className="glass-card" style={{ padding: '24px', margin: '20px 0', textAlign: 'left' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Member:</span><strong>{manual.user.name}</strong></div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Vehicle:</span><strong>{manual.car.model}</strong></div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Duration:</span><strong>{manual.dates.length} Days</strong></div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}><span style={{ fontWeight: 800 }}>TOTAL LKR:</span><strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{(manual.car.pricePerDay * manual.dates.length).toLocaleString()}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <button className="btn-success" style={{ flex: 1 }} onClick={() => {
                          const b = { id: 'b' + Date.now() + Math.random().toString(36).substr(2, 5), carId: manual.car.id, customerId: manual.user.id, customerName: manual.user.name, date: manual.dates, idPhoto: manual.user.selfie, status: 'accepted', extraCharge: 0, seen: false, adminSeen: true };
                          fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
                            .then(() => {
                               setBookings(prev => [...prev, b]);
                               sendEmail(manual.user.email, manual.user.name, `We have manually booked ${manual.car.model} for you. Duration: ${manual.dates.length} days.`, `Confirmed Booking`);
                               alert('Manual Booking Created Successfully!');
                               setManual(null);
                            });
                       }}>CONFIRM & BOOK</button>
                       <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setManual({ ...manual, step: 2 })}>GO BACK</button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

function CustomerCars({ cars, bookings, setBookings, currentUser, adminSettings }) {
  const [selected, setSelected] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [idImg, setIdImg] = useState(null);
  const [driver, setDriver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(1);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
       if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
       }
    } catch (e) {
       console.error("Camera access failed", e);
    }
  };
  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas'); canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0); setIdImg(canvas.toDataURL('image/jpeg'));
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setIdImg(r.result); r.readAsDataURL(f); } };
  
  const submit = () => {
    const b = { id: 'b' + Date.now() + Math.random().toString(36).substr(2, 5), carId: selected.id, customerId: currentUser.id, customerName: currentUser.name, date: [...selectedDates], idPhoto: idImg, status: 'pending', extraCharge: (3500 * selectedDates.length * (driver ? 1 : 0)), seen: false, adminSeen: false };
    fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    }).then(() => {
      setBookings(prev => [...prev, b]);
      sendEmail(adminSettings.notificationEmail, 'Admin', `Request: ${selected.model}`, `Booking Alert`);
      alert('Request Sent!'); setSelected(null); setSelectedDates([]); setIdImg(null); setStep(1);
    });
  };

  const filtered = useMemo(() => cars.filter(c => c.model.toLowerCase().includes(searchTerm.toLowerCase())), [cars, searchTerm]);
  const currentTotal = useMemo(() => selected ? ( (Number(selected.pricePerDay || 0) + (driver ? 3500 : 0)) * selectedDates.length ) : 0, [selected, driver, selectedDates]);
  const occupiedDates = useMemo(() => bookings.filter(b => selected && b.carId === selected.id && (b.status === 'pending' || b.status === 'accepted')).flatMap(b => b.date), [bookings, selected]);
  const groupedDates = useMemo(() => selected?.availableDates?.reduce((acc, d) => { const m = d.slice(0, 7); if (!acc[m]) acc[m] = []; acc[m].push(d); return acc; }, {}) || {}, [selected]);

  return (
    <div style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px' }}>
      <div className="hero-customer" style={{ minHeight: '75vh', background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.12) 0%, transparent 70%), #050505' }}>
        <div className="blur-blob"></div>
        <h1 className="hero-title">READY<br/><span className="brand-accent">CABS</span></h1>
        <p className="hero-subtitle">Premium Mobility Reimagined</p>
        <button onClick={() => document.getElementById('fleet').scrollIntoView({ behavior: 'smooth' })} className="scroll-indicator"><span>Explore Fleet</span><span>↓</span></button>
      </div>

      <div id="fleet" className="fleet-section" style={{ padding: '100px 40px', background: '#050508' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '30px', flexWrap: 'wrap', gap: '30px' }}>
           <div><h2 className="brand-font" style={{ fontSize: '3rem', margin: 0 }}>The Fleet</h2></div>
           <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}><span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span><input placeholder="Search model..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '50px', height: '55px', borderRadius: '50px', background: 'rgba(255,255,255,0.03)' }} /></div>
        </div>
        <div className="grid-cars">{filtered.map(c => (
          <div key={c.id} className="car-card"><img src={c.image} className="car-image" alt={c.model} /><div className="car-details"><h3 className="brand-font">{c.model}</h3><div className="car-price">LKR {Number(c.pricePerDay || 0).toLocaleString()} / day</div><button className="btn-primary" style={{ width: '100%' }} onClick={() => setSelected(c)}>REQUEST</button></div></div>
        ))}</div>
      </div>

      {selected && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)' }}>
          <div className="modal-content" style={{ maxWidth: '580px', background: '#0a0a0a' }}>
             <div className="modal-header"><h3 className="brand-font">Book {selected.model}</h3><button onClick={() => { setSelected(null); setSelectedDates([]); setIdImg(null); setStep(1); }}>✕</button></div>
             {step === 1 ? (
                <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                   {Object.keys(groupedDates).sort().length > 0 ? Object.keys(groupedDates).sort().map(m => (
                      <div key={m} style={{ marginBottom: '25px' }}>
                         <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>{new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                         <div className="calendar-grid">
                            {groupedDates[m].map(d => {
                               const isOccupied = occupiedDates.includes(d);
                               return (
                                 <div key={d} className={`cal-day ${isOccupied ? 'booked' : 'available'}`} style={{ height: '50px', border: selectedDates.includes(d) ? '2px solid var(--primary)' : isOccupied ? '1px solid #441111' : '1px solid #333', background: selectedDates.includes(d) ? 'rgba(245, 158, 11, 0.2)' : isOccupied ? 'rgba(239, 68, 68, 0.1)' : '', cursor: isOccupied ? 'not-allowed' : 'pointer', color: isOccupied ? '#ef4444' : '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} onClick={() => { if (!isOccupied) { if (selectedDates.includes(d)) setSelectedDates(selectedDates.filter(x => x !== d)); else setSelectedDates([...selectedDates, d]); } }}>
                                   <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{d.slice(-2)}</div>
                                   {isOccupied && <div style={{ fontSize: '0.5rem', fontWeight: 900 }}>BOOKED</div>}
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                   )) : <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No available dates set for this vehicle yet.</div>}
                   <button className="btn-primary" style={{ width: '100%', marginTop: '30px' }} disabled={selectedDates.length === 0} onClick={() => setStep(2)}>PROCEED</button>
                </div>
             ) : (
                <div style={{ padding: '32px' }}>
                   <div onClick={() => setDriver(!driver)} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', cursor: 'pointer', borderRadius: '16px', border: driver ? '2px solid var(--primary)' : '1px solid #222', background: driver ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)', marginBottom: '30px' }}>
                      👨‍✈️ <div style={{ flex: 1 }}><strong>Chauffeur Service</strong></div><div>+ LKR {(3500 * selectedDates.length).toLocaleString()}</div>
                   </div>
                   <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>ID VERIFICATION PHOTO</div>
                   {!idImg ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <video ref={videoRef} style={{ width: '100%', borderRadius: '12px' }} />
                         <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}><button className="btn-success" style={{ flex: 1 }} onClick={startCamera}>LENS</button><label className="btn-primary" style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>UPLOAD<input type="file" hidden accept="image/*" onChange={handleFile} /></label><button className="btn-primary" style={{ flex: 1 }} onClick={capture}>SNAP</button></div>
                      </div>
                   ) : <div style={{ position: 'relative' }}><img src={idImg} style={{ width: '100%', borderRadius: '16px', border: '2px solid var(--primary)' }} alt="ID Proof" /><button onClick={() => setIdImg(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '30px', height: '30px', border: 'none', color: '#fff' }}>✕</button></div>}
                   <div className="glass-card" style={{ marginTop: '30px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 800 }}>TOTAL</span><span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.8rem' }}>LKR {currentTotal.toLocaleString()}</span></div>
                   </div>
                   <button className="btn-primary" style={{ width: '100%', marginTop: '30px', height: '60px' }} onClick={submit}>CONFIRM</button>
                   <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setStep(1)}>BACK</button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerBookings({ bookings, cars, currentUser, setCustCancel, setCustReason }) {
  const my = useMemo(() => bookings.filter(b => b.customerId === currentUser.id), [bookings, currentUser.id]);
  return (
    <div className="table-wrapper">
       <table>
          <thead><tr><th>CAR</th><th>STAY</th><th>STATUS</th><th>ACTION</th></tr></thead>
          <tbody>{my.map(b => (
             <tr key={b.id}>
                <td>{cars.find(c => c.id === b.carId)?.model}</td>
                <td>{b.date.length} days</td>
                <td><span className={`badge badge-${b.status}`}>{b.status.replace('_', ' ')}</span></td>
                <td>
                   {b.status === 'accepted' && (
                      <button className="btn-danger" style={{ padding: '6px 15px', fontSize: '0.75rem', borderRadius: '50px' }} onClick={() => { setCustCancel(b); setCustReason(''); }}>Cancel Trip</button>
                   )}
                </td>
             </tr>
          ))}</tbody>
       </table>
    </div>
  );
}

function CustomerNotifications({ bookings, setBookings, cars, currentUser, setCustCancel, setCustReason }) {
  const alerts = useMemo(() => bookings.filter(b => b.customerId === currentUser.id && (b.status === 'rejected' || b.status === 'customer_canceled')), [bookings, currentUser.id]);
  
  return (
    <div style={{ animation: 'fadeUp 0.8s' }}>
       <h2 className="brand-font" style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Alert Center</h2>
       {alerts.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No notifications at this time.</div>
       ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             {alerts.map(b => (
                <div key={b.id} className="glass-card" style={{ padding: '30px', borderLeft: b.status === 'rejected' ? '4px solid #ef4444' : '4px solid #f59e0b', animation: 'slideRight 0.5s' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ fontWeight: 800, color: b.status === 'rejected' ? '#ef4444' : '#f59e0b', letterSpacing: '1px' }}>{b.status === 'rejected' ? 'RESERVATION REJECTED' : 'TRIP CANCELED BY YOU'}</div>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                         <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(parseInt(b.id.substring(1))).toLocaleDateString()}</div>
                         <button 
                            onClick={(e) => { 
                               e.stopPropagation();
                               if(window.confirm('Remove this alert?')) {
                                  fetch(`${API_URL}/bookings/delete/${b.id}`, { method: 'POST' })
                                    .then(res => {
                                      if (res.ok) {
                                        setBookings(prev => prev.filter(x => x.id !== b.id));
                                      }
                                    });
                               }
                            }} 
                            style={{ 
                               width: '32px', 
                               height: '32px', 
                               borderRadius: '50%', 
                               background: 'rgba(239, 68, 68, 0.1)', 
                               border: '1px solid rgba(239, 68, 68, 0.2)', 
                               color: '#ef4444', 
                               cursor: 'pointer', 
                               display: 'flex', 
                               alignItems: 'center', 
                               justifyContent: 'center',
                               transition: 'all 0.3s',
                               fontWeight: 900
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                         >✕</button>
                      </div>
                   </div>
                   <h3 className="brand-font" style={{ fontSize: '1.4rem', margin: '0 0 10px 0' }}>{cars.find(c => c.id === b.carId)?.model}</h3>
                   <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: b.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 800, marginBottom: '5px' }}>FEEDBACK LOG:</div>
                      <div style={{ color: '#fff', fontStyle: 'italic', fontSize: '1.1rem' }}>"{b.status === 'rejected' ? b.cancelReason : b.custCancelReason}"</div>
                   </div>
                   <div style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.6 }}>Stay duration: {b.date.length} days</div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}

function AdminNotifications({ bookings, cars, users }) {
  const customerCanceled = useMemo(() => bookings.filter(b => b.status === 'customer_canceled'), [bookings]);
  
  return (
    <div style={{ animation: 'fadeUp 0.8s' }}>
       <h2 className="brand-font" style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Customer Alerts</h2>
       {customerCanceled.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No customer cancellations at this time.</div>
       ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             {customerCanceled.map(b => {
                const u = users.find(x => x.id === b.customerId);
                return (
                   <div key={b.id} className="glass-card" style={{ padding: '30px', borderLeft: '4px solid #f59e0b', animation: 'slideRight 0.5s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                         <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <img src={u?.selfie} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="U" />
                            <div>
                               <div style={{ fontWeight: 900, color: '#fff' }}>{u?.name}</div>
                               <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{u?.whatsapp}</div>
                            </div>
                         </div>
                         <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(parseInt(b.id.substring(1))).toLocaleDateString()}</div>
                      </div>
                      <h3 className="brand-font" style={{ fontSize: '1.4rem', margin: '0 0 10px 0' }}>{cars.find(c => c.id === b.carId)?.model}</h3>
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                         <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800, marginBottom: '5px' }}>CUSTOMER REASON:</div>
                         <div style={{ color: '#fff', fontStyle: 'italic', fontSize: '1.1rem' }}>"{b.custCancelReason}"</div>
                      </div>
                   </div>
                );
             })}
          </div>
       )}
    </div>
  );
}

function CustomerProfile({ currentUser, setCurrentUser, setUsers, users, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [wa, setWa] = useState(currentUser.whatsapp);
  const save = () => { const up = { ...currentUser, name, whatsapp: wa }; setUsers(prev => prev.map(u => u.id === currentUser.id ? up : u)); setCurrentUser(up); setEditing(false); };
  return (
    <div style={{ animation: 'fadeUp 0.8s' }}>
       <div className="glass-card" style={{ maxWidth: '450px', margin: '0 auto', textAlign: 'center', padding: '0', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ height: '120px', background: 'linear-gradient(45deg, #0f0f0f, #1a1a1a)' }}></div>
          <div style={{ padding: '0 40px 40px', marginTop: '-60px' }}>
             <div style={{ width: '130px', height: '130px', margin: '0 auto 20px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', background: 'var(--primary)', opacity: 0.3, filter: 'blur(8px)' }}></div>
                <img src={currentUser.selfie} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #0a0a0a', position: 'relative' }} alt="Profile" />
             </div>
             {!editing ? (
                <>
                   <h2 className="brand-font" style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>{currentUser.name}</h2>
                   <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '20px', opacity: 0.8 }}>EXCLUSIVE MEMBER</div>
                   <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '5px' }}>WHATSAPP CONNECT</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{currentUser.whatsapp}</div>
                   </div>
                   <button className="btn-primary" style={{ width: '100%', borderRadius: '50px', marginBottom: '10px' }} onClick={() => setEditing(true)}>EDIT PROFILE</button>
                </>
             ) : (
                <div style={{ textAlign: 'left', marginTop: '20px' }}>
                   <div style={{ marginBottom: '15px' }}><label>MEMBER NAME</label><input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px' }} /></div>
                   <div style={{ marginBottom: '30px' }}><label>WHATSAPP</label><input value={wa} onChange={e => setWa(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px' }} /></div>
                   <button className="btn-success" style={{ width: '100%', borderRadius: '50px', marginBottom: '10px' }} onClick={save}>SAVE CHANGES</button>
                   <button className="btn-secondary" style={{ width: '100%', borderRadius: '50px', marginBottom: '10px' }} onClick={() => setEditing(false)}>CANCEL</button>
                </div>
             )}
             <button className="btn-danger" style={{ width: '100%', borderRadius: '50px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={onLogout}>LOGOUT SYSTEM</button>
          </div>
       </div>
    </div>
  );
}

function ChatWidget({ currentUser, users, messages, setMessages }) {
  const [open, setOpen] = useState(false); const [selectedPartner, setSelectedPartner] = useState(null); const [text, setText] = useState('');
  const partnerId = currentUser.role === 'admin' ? selectedPartner?.id : users.find(u => u.role === 'admin')?.id;
  const filtered = useMemo(() => messages.filter(m => (m.from === currentUser.id && m.to === partnerId) || (m.from === partnerId && m.to === currentUser.id)), [messages, currentUser.id, partnerId]);
  
  const unreadCount = useMemo(() => messages.filter(m => m.to === currentUser.id && !m.seen).length, [messages, currentUser.id]);

  useEffect(() => {
    if (open) {
      if (messages.some(m => m.to === currentUser.id && !m.seen)) {
        fetch(`${API_URL}/messages/seen/${currentUser.id}`, { method: 'PUT' })
          .then(res => { if (res.ok) console.log('Admin: Messages marked read in DB'); });
        setMessages(prev => prev.map(m => m.to === currentUser.id ? { ...m, seen: true } : m));
      }
    }
  }, [open, currentUser.id, messages]);

  const handleSend = () => { if (!text || !partnerId) return; 
    const msg = { id: 'm' + Date.now() + Math.random().toString(36).substr(2, 5), from: currentUser.id, to: partnerId, text, image: null, seen: false };
    fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    }).then(() => {
      setMessages(prev => [...prev, msg]); setText(''); 
    });
  };
  const handleImage = (e) => { const f = e.target.files?.[0]; if (f && partnerId) { const r = new FileReader(); r.onloadend = () => {
    const msg = { id: 'm' + Date.now() + Math.random().toString(36).substr(2, 5), from: currentUser.id, to: partnerId, text: '', image: r.result, seen: false };
    fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    }).then(() => {
      setMessages(prev => [...prev, msg]); 
    });
  }; r.readAsDataURL(f); } };
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000 }}>
       <button 
         className="chat-trigger-btn" 
         onClick={() => setOpen(!open)} 
         style={{ 
           width: '70px', 
           height: '70px', 
           borderRadius: '50%', 
           background: 'linear-gradient(135deg, var(--primary), #b45309)', 
           border: 'none', 
           cursor: 'pointer', 
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center', 
           boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)', 
           animation: 'float 3s ease-in-out infinite', 
           transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
           position: 'relative'
         }}
         onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(245, 158, 11, 0.6)'; }}
         onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 158, 11, 0.4)'; }}
       >
         {!open && unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 900, minWidth: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)', border: '2px solid #000', zIndex: 10 }}>
               {unreadCount}
            </span>
         )}
         {open ? (
            <span style={{ fontSize: '1.5rem', color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</span>
         ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <circle cx="8" cy="9" r="0.5" fill="#000"></circle>
                  <circle cx="12" cy="9" r="0.5" fill="#000"></circle>
                  <circle cx="16" cy="9" r="0.5" fill="#000"></circle>
               </svg>
            </div>
         )}
       </button>
       {open && (
          <div className="glass-card" style={{ position: 'absolute', bottom: '90px', right: '0', width: '360px', height: '540px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.2)', animation: 'fadeUp 0.4s' }}>
             {currentUser.role === 'admin' && !selectedPartner ? (
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                   <h3 className="brand-font">Messages</h3>
                   {users.filter(u => u.role === 'customer').map(u => (
                      <div key={u.id} className="glass-card" style={{ padding: '15px', marginBottom: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setSelectedPartner(u)}>
                         <img src={u.selfie || 'https://i.pravatar.cc/100'} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" /><div><div style={{ fontWeight: 800 }}>{u.name}</div></div>
                      </div>
                   ))}
                </div>
             ) : (
                <>
                   <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(245, 158, 11, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {currentUser.role === 'admin' && <button onClick={() => setSelectedPartner(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}>←</button>}
                      <img src={selectedPartner?.selfie || 'https://i.pravatar.cc/100?u=admin'} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="Avatar" /><div style={{ fontWeight: 800 }}>{selectedPartner?.name || 'Ready Support'}</div>
                   </div>
                   <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>{filtered.map(m => (<div key={m.id} style={{ alignSelf: m.from === currentUser.id ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: '12px' }}><div style={{ background: m.from === currentUser.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: m.from === currentUser.id ? '#000' : '#fff', padding: '12px 16px', borderRadius: '15px' }}>{m.text && <div style={{ wordBreak: 'break-word' }}>{m.text}</div>}{m.image && <img src={m.image} style={{ width: '100%', borderRadius: '12px', marginTop: '8px' }} />}</div></div>))}</div>
                   <div style={{ padding: '15px 20px', display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', gap: '12px', background: 'rgba(0,0,0,0.3)', alignItems: 'center' }}><label>📷<input type="file" hidden onChange={handleImage} /></label><input style={{ flex: 1, borderRadius: '25px', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }} placeholder="Type message..." value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} /><button onClick={handleSend} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', fontSize: '1.4rem' }}>➤</button></div>
                </>
             )}
          </div>
       )}
    </div>
  );
}
function AdminAddMember({ setUsers, setActiveTab }) {
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '', whatsapp: '', selfie: '' });
  const [error, setError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
       if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (e) { setError("Camera access denied."); setIsCameraActive(false); }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas'); canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setFormData({ ...formData, selfie: canvas.toDataURL('image/jpeg') });
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setIsCameraActive(false);
  };

  const handleFile = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setFormData({ ...formData, selfie: r.result }); r.readAsDataURL(f); } };

  const submit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.name || !formData.email || !formData.whatsapp || !formData.selfie) return setError('Please fill all required fields');
    const newUser = { id: 'u' + Date.now() + Math.random().toString(36).substr(2, 5), ...formData, role: 'customer' };
    fetch(`${API_URL}/users`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(newUser)
    }).then(() => {
       setUsers(prev => [...prev, newUser]);
       alert('New Member Registered Successfully!');
       setActiveTab('customers');
    }).catch(err => setError('Database connection error'));
  };

  return (
    <div style={{ animation: 'fadeUp 0.8s', maxWidth: '600px', margin: '0 auto' }}>
       <h2 className="brand-font" style={{ fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>New Registration</h2>
       <div className="glass-card" style={{ padding: '40px' }}>
          {error && <div className="badge badge-rejected" style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}>{error}</div>}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label>FULL NAME</label><input placeholder="Ex: John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><label>EMAIL ADDRESS</label><input placeholder="Ex: john@mail.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label>WHATSAPP NUMBER</label><input placeholder="Ex: +94..." value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <label>MEMBER SELFIE</label>
                   {!formData.selfie ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <button type="button" className="btn-primary" onClick={startCamera} style={{ fontSize: '0.7rem' }}>LENS</button>
                         <label className="btn-secondary" style={{ flex: 1, margin: 0, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FILE<input type="file" hidden accept="image/*" onChange={handleFile} /></label>
                      </div>
                   ) : (
                      <div style={{ position: 'relative' }}><img src={formData.selfie} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} /><button type="button" onClick={() => setFormData({ ...formData, selfie: '' })} style={{ position: 'absolute', top: 0, left: '50px', background: '#ef4444', borderRadius: '50%', border: 'none', color: '#fff', width: '20px', height: '20px' }}>✕</button></div>
                   )}
                </div>
             </div>
             {isCameraActive && (
                <div style={{ position: 'relative', background: '#000', borderRadius: '15px', padding: '10px' }}>
                   <video ref={videoRef} style={{ width: '100%', borderRadius: '10px' }} />
                   <button type="button" className="btn-success" onClick={capture} style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', borderRadius: '50px' }}>CAPTURE NOW</button>
                </div>
             )}
             <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }}></div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label>USERNAME</label><input placeholder="Ex: john123" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} /></div>
                <div><label>SYSTEM PASSWORD</label><input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
             </div>
             <button className="btn-primary" style={{ height: '60px', borderRadius: '50px', marginTop: '20px', fontWeight: 900, fontSize: '1rem' }}>REGISTER MEMBER</button>
          </form>
       </div>
    </div>
  );
}
