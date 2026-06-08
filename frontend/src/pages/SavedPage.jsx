import { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

export default function SavedPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties/saved');
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnsave = (id, saved) => {
    if (!saved) setProperties(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="container section">
      <div className="section-header">
        <span className="section-label">✦ Your Collection</span>
        <h2 className="section-title">Saved Properties</h2>
        <p className="section-desc">{properties.length} saved {properties.length === 1 ? 'property' : 'properties'}</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♡</div>
          <div className="empty-title">No saved properties yet</div>
          <p style={{ marginBottom: 24 }}>Browse properties and click the heart to save your favorites.</p>
          <a href="/listings" className="btn btn-primary">Browse Properties</a>
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map(p => (
            <PropertyCard key={p.id} property={{ ...p, is_saved: true }} onSaveToggle={handleUnsave} />
          ))}
        </div>
      )}
    </div>
  );
}
