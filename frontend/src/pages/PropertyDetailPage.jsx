import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import api from '../utils/api';
import { formatPrice, formatArea, propertyTypeLabel, timeAgo } from '../utils/format';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare, canAdd } = useCompare();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [inquiry, setInquiry] = useState({ name: user?.name || '', email: user?.email || '', phone: '', message: "Hi, I'm interested in this property and would love to learn more. Could we arrange a viewing?" });
  const [inquiryStatus, setInquiryStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        if (err.response?.status === 404) navigate('/listings');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!property) return null;

  const imgs = Array.isArray(property.images) ? property.images : JSON.parse(property.images || '[]');
  const features = Array.isArray(property.features) ? property.features : JSON.parse(property.features || '[]');

  const handleSave = async () => {
    if (!user) return navigate('/login');
    const res = await api.post(`/properties/${id}/save`);
    setSaved(res.data.saved);
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    setSending(true);
    setInquiryStatus(null);
    try {
      await api.post(`/inquiries/property/${id}`, inquiry);
      setInquiryStatus('success');
    } catch (err) {
      setInquiryStatus('error');
    }
    setSending(false);
  };

  return (
    <div className="property-detail">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, fontSize: 13, color: 'var(--stone)' }}>
        <a href="/listings" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Properties</a>
        {' / '}{property.city}{' / '}{property.title}
      </div>

      {/* Gallery */}
      <div className="property-gallery">
        <div className="gallery-main">
          <img src={imgs[activeImg] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200'} alt={property.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200'; }} />
        </div>
        {imgs.length > 1 && (
          <div className="gallery-thumbs">
            {imgs.map((img, i) => (
              <div key={i} className="gallery-thumb" onClick={() => setActiveImg(i)} style={{ opacity: activeImg === i ? 1 : 0.6 }}>
                <img src={img} alt="" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'; }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="property-detail-grid">
        {/* Left */}
        <div>
          <div className="property-info-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`property-card-badge ${property.listing_type === 'rent' ? 'badge-rent' : 'badge-sale'}`} style={{ position: 'static', marginBottom: 12, display: 'inline-block' }}>
                  {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                </span>
                <div className="property-info-price">{formatPrice(property.price, property.listing_type)}</div>
                <h1 className="property-info-title">{property.title}</h1>
                <div className="property-info-address">📍 {property.address}, {property.city}, {property.state} {property.zip_code}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className={`btn btn-ghost btn-sm ${isInCompare(property.id) ? 'compare-detail-btn--active' : ''}`}
                  onClick={() => isInCompare(property.id) ? removeFromCompare(property.id) : addToCompare(property)}
                  disabled={!isInCompare(property.id) && !canAdd}
                  title={!isInCompare(property.id) && !canAdd ? 'Max 4 properties in compare' : ''}
                >
                  {isInCompare(property.id) ? '⊖ Remove compare' : '⊕ Compare'}
                </button>
                <button className="btn btn-ghost" onClick={handleSave} style={{ fontSize: 20, padding: '8px 16px' }}>
                  {saved ? '♥ Saved' : '♡ Save'}
                </button>
              </div>
            </div>
          </div>

          <div className="property-specs-row">
            {property.bedrooms && <div className="property-spec-item"><div className="spec-value">{property.bedrooms}</div><div className="spec-label">Bedrooms</div></div>}
            {property.bathrooms && <div className="property-spec-item"><div className="spec-value">{property.bathrooms}</div><div className="spec-label">Bathrooms</div></div>}
            {property.area_sqft && <div className="property-spec-item"><div className="spec-value">{parseFloat(property.area_sqft).toLocaleString()}</div><div className="spec-label">Sq Feet</div></div>}
            {property.year_built && <div className="property-spec-item"><div className="spec-value">{property.year_built}</div><div className="spec-label">Year Built</div></div>}
          </div>

          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 12 }}>About This Property</h3>
            <p style={{ color: 'var(--stone)', lineHeight: 1.9, fontSize: 15 }}>{property.description || 'No description available.'}</p>
          </div>

          {features.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>Features & Amenities</h3>
              <div className="features-list">
                {features.map(f => <span key={f} className="feature-tag">✓ {f}</span>)}
              </div>
            </div>
          )}

          <div style={{ marginTop: 32, padding: 20, background: 'var(--cream)', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, color: 'var(--stone)' }}>
              <span>🏠 {propertyTypeLabel(property.property_type)}</span>
              <span>👁 {property.views} views</span>
              <span>📅 Listed {timeAgo(property.created_at)}</span>
              {property.lot_size && <span>📐 Lot: {formatArea(property.lot_size)}</span>}
            </div>
          </div>
        </div>

        {/* Right: Inquiry */}
        <div>
          <div className="inquiry-card">
            <div className="inquiry-card-title">Contact Agent</div>

            {inquiryStatus === 'success' && (
              <div className="alert alert-success">✓ Your inquiry was sent! The agent will contact you soon.</div>
            )}
            {inquiryStatus === 'error' && (
              <div className="alert alert-error">Something went wrong. Please try again.</div>
            )}

            <form onSubmit={handleInquiry}>
              <div className="form-group">
                <label>Your Name</label>
                <input required value={inquiry.name} onChange={e => setInquiry(i => ({ ...i, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={inquiry.email} onChange={e => setInquiry(i => ({ ...i, email: e.target.value }))} placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label>Phone (optional)</label>
                <input value={inquiry.phone} onChange={e => setInquiry(i => ({ ...i, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea rows={4} required value={inquiry.message} onChange={e => setInquiry(i => ({ ...i, message: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-gold btn-block" disabled={sending}>
                {sending ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>

            {property.agent_name && (
              <div className="agent-mini">
                <div className="agent-avatar">{property.agent_name[0]}</div>
                <div>
                  <div className="agent-name">{property.agent_name}</div>
                  <div className="agent-label">Licensed Agent · {property.agent_phone}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
