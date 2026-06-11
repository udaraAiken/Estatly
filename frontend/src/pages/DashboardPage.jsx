import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatPrice, timeAgo } from '../utils/format';

const PROPERTY_FORM_INIT = {
  title: '', description: '', price: '', property_type: 'house', listing_type: 'sale',
  bedrooms: '', bathrooms: '', area_sqft: '', year_built: '', address: '', city: '',
  state: '', zip_code: '', features: '', images: ''
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [myProperties, setMyProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PROPERTY_FORM_INIT);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, inqRes, statsRes] = await Promise.all([
        api.get('/properties?limit=50'),
        api.get('/inquiries'),
        api.get('/properties/stats')
      ]);
      setMyProperties(propsRes.data.properties || []);
      setInquiries(inqRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const data = {
        ...form,
        features: form.features ? form.features.split(',').map(f => f.trim()) : [],
        images: form.images ? form.images.split('\n').map(u => u.trim()).filter(Boolean) : []
      };
      if (editingId) {
        await api.put(`/properties/${editingId}`, data);
      } else {
        await api.post('/properties', data);
      }
      setShowForm(false);
      setForm(PROPERTY_FORM_INIT);
      setEditingId(null);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving property.');
    }
    setFormLoading(false);
  };

  const handleEdit = (p) => {
    const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
    const feats = Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');
    setForm({ ...p, images: imgs.join('\n'), features: feats.join(', ') });
    setEditingId(p.id);
    setShowForm(true);
    setTab('properties');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    try {
      await api.delete(`/properties/${id}`);
      loadData();
    } catch (err) {
      alert('Error deleting property.');
    }
  };

  const handleInquiryStatus = async (id, status) => {
    try {
      await api.patch(`/inquiries/${id}/status`, { status });
      setInquiries(inqs => inqs.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Agent Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back, {user?.name} · {user?.role}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '🏠', value: stats.active_listings || 0, label: 'Active Listings' },
          { icon: '💰', value: stats.for_sale || 0, label: 'For Sale' },
          { icon: '🔑', value: stats.for_rent || 0, label: 'For Rent' },
          { icon: '✅', value: stats.sold || 0, label: 'Sold' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--cream)', marginBottom: 32 }}>
        {['overview', 'properties', 'inquiries'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--gold)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: tab === t ? 'var(--charcoal)' : 'var(--stone)', textTransform: 'capitalize', marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="table-card">
              <div className="table-header">
                <span className="table-title">Recent Inquiries</span>
              </div>
              <table className="data-table">
                <thead><tr><th>From</th><th>Property</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {inquiries.slice(0, 5).map(i => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.property_title}</td>
                      <td><span className={`status-badge status-${i.status}`}>{i.status}</span></td>
                      <td style={{ color: 'var(--stone)' }}>{timeAgo(i.created_at)}</td>
                    </tr>
                  ))}
                  {inquiries.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--stone)', padding: 32 }}>No inquiries yet</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-card">
              <div className="table-header">
                <span className="table-title">My Listings</span>
                <button className="btn btn-gold btn-sm" onClick={() => { setShowForm(true); setTab('properties'); }}>+ Add Listing</button>
              </div>
              <table className="data-table">
                <thead><tr><th>Title</th><th>Price</th><th>Status</th></tr></thead>
                <tbody>
                  {myProperties.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Link to={`/property/${p.id}`} style={{ color: 'var(--charcoal)', textDecoration: 'none' }}>{p.title}</Link>
                      </td>
                      <td>{formatPrice(p.price, p.listing_type)}</td>
                      <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
                  {myProperties.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--stone)', padding: 32 }}>No listings yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROPERTIES */}
      {tab === 'properties' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)' }}>My Listings ({myProperties.length})</h3>
            <button className="btn btn-gold" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(PROPERTY_FORM_INIT); }}>
              {showForm ? 'Cancel' : '+ New Listing'}
            </button>
          </div>

          {showForm && (
            <div className="table-card" style={{ padding: 32, marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 24 }}>{editingId ? 'Edit' : 'Add New'} Property</h3>
              {formError && <div className="alert alert-error">{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Title *</label>
                    <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Modern Downtown Loft" />
                  </div>
                  <div className="form-group">
                    <label>Price *</label>
                    <input required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500000" />
                  </div>
                  <div className="form-group">
                    <label>Listing Type</label>
                    <select value={form.listing_type} onChange={e => setForm(f => ({ ...f, listing_type: e.target.value }))}>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Property Type</label>
                    <select value={form.property_type} onChange={e => setForm(f => ({ ...f, property_type: e.target.value }))}>
                      {['house','apartment','condo','townhouse','land','commercial'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {['active','pending','sold','rented','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input type="number" step="0.5" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Area (sqft)</label>
                    <input type="number" value={form.area_sqft} onChange={e => setForm(f => ({ ...f, area_sqft: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Year Built</label>
                    <input required type="number" value={form.year_built} onChange={e => setForm(f => ({ ...f, year_built: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Address *</label>
                    <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Latitude *</label>
                    <input required value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Longitude *</label>
                    <input required value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input value={form.zip_code} onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))} />
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Features (comma-separated)</label>
                    <input value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Pool, Garage, Garden, Fireplace" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Image URLs (one per line)</label>
                    <textarea rows={3} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://example.com/image1.jpg" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Description</label>
                    <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the property..." />
                  </div>
                  
                </div>
                <button type="submit" className="btn btn-gold" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingId ? 'Update Listing' : 'Create Listing')}
                </button>
              </form>
            </div>
          )}

          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>Title</th><th>City</th><th>Price</th><th>Type</th><th>Status</th><th>Views</th><th>Actions</th></tr></thead>
              <tbody>
                {myProperties.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                    <td>{p.city}, {p.state}</td>
                    <td>{formatPrice(p.price, p.listing_type)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.property_type}</td>
                    <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--stone)' }}>{p.views}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/property/${p.id}`} className="btn btn-ghost btn-sm">View</Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {myProperties.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--stone)', padding: 40 }}>No listings yet. Add your first property above.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INQUIRIES */}
      {tab === 'inquiries' && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">All Inquiries ({inquiries.length})</span>
          </div>
          <table className="data-table">
            <thead><tr><th>From</th><th>Contact</th><th>Property</th><th>Message</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {inquiries.map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--stone)' }}>{i.email}<br />{i.phone}</td>
                  <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{i.property_title}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--stone)' }}>{i.message}</td>
                  <td><span className={`status-badge status-${i.status}`}>{i.status}</span></td>
                  <td style={{ color: 'var(--stone)', fontSize: 12 }}>{timeAgo(i.created_at)}</td>
                  <td>
                    <select className="filter-select" value={i.status} onChange={e => handleInquiryStatus(i.id, e.target.value)} style={{ fontSize: 12 }}>
                      {['new','read','replied','closed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--stone)', padding: 40 }}>No inquiries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
