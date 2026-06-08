import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatArea, propertyTypeLabel } from '../utils/format';
import api from '../utils/api';
import { useState } from 'react';

export default function PropertyCard({ property, onSaveToggle }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(property.is_saved || false);
  const [saving, setSaving] = useState(false);

  const imgs = Array.isArray(property.images)
    ? property.images
    : (typeof property.images === 'string' ? JSON.parse(property.images || '[]') : []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return (window.location.href = '/login');
    setSaving(true);
    try {
      const res = await api.post(`/properties/${property.id}/save`);
      setSaved(res.data.saved);
      onSaveToggle && onSaveToggle(property.id, res.data.saved);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const statusBadge = () => {
    if (property.status === 'sold') return <span className="property-card-badge badge-sold">Sold</span>;
    if (property.status === 'pending') return <span className="property-card-badge badge-pending">Pending</span>;
    return <span className={`property-card-badge ${property.listing_type === 'rent' ? 'badge-rent' : 'badge-sale'}`}>
      {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
    </span>;
  };

  return (
    <Link to={`/property/${property.id}`} style={{ textDecoration: 'none' }}>
      <div className="property-card">
        <div className="property-card-img">
          <img
            src={imgs[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600'}
            alt={property.title}
            loading="lazy"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600'; }}
          />
          {statusBadge()}
          <button className={`property-card-save ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={saving} title={saved ? 'Remove from saved' : 'Save property'}>
            {saved ? '♥' : '♡'}
          </button>
        </div>
        <div className="property-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div className="property-card-price">{formatPrice(property.price, property.listing_type)}</div>
            <span className="property-card-type">{propertyTypeLabel(property.property_type)}</span>
          </div>
          <div className="property-card-title">{property.title}</div>
          <div className="property-card-address">
            <span>📍</span> {property.city}, {property.state}
          </div>
          <div className="property-card-specs">
            {property.bedrooms && <div className="spec"><span className="spec-icon">🛏</span> {property.bedrooms} bd</div>}
            {property.bathrooms && <div className="spec"><span className="spec-icon">🚿</span> {property.bathrooms} ba</div>}
            {property.area_sqft && <div className="spec"><span className="spec-icon">⬜</span> {formatArea(property.area_sqft)}</div>}
          </div>
        </div>
      </div>
    </Link>
  );
}
