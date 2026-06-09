import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState({ query: '', listing_type: 'sale', property_type: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [propsRes, statsRes] = await Promise.all([
          api.get('/properties?limit=6&sort=views&order=DESC'),
          api.get('/properties/stats')
        ]);
        setFeatured(propsRes.data.properties || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.query) params.set('search', search.query);
    if (search.listing_type) params.set('listing_type', search.listing_type);
    if (search.property_type) params.set('property_type', search.property_type);
    if (search.bedrooms) params.set('bedrooms', search.bedrooms);
    navigate(`/listings?${params.toString()}`);
  };

  const heroCards = featured.slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-texture" />
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-tag">✦ Premium Real Estate</div>
            <h1 className="hero-title">
              Find Your<br /><em>Perfect Home</em><br />Today
            </h1>
            <p className="hero-desc">
              Discover exceptional properties with Estatly — where luxury meets simplicity. Browse thousands of listings, connect with expert agents, and find your dream home.
            </p>
            <div className="hero-ctas">
              <Link to="/listings?listing_type=sale" className="btn btn-gold btn-lg">Browse For Sale</Link>
              <Link to="/listings?listing_type=rent" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>For Rent</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">{stats.active_listings || '—'}</div>
                <div className="hero-stat-label">Active Listings</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{stats.cities_covered || '—'}</div>
                <div className="hero-stat-label">Cities</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">{stats.sold || '—'}</div>
                <div className="hero-stat-label">Homes Sold</div>
              </div>
            </div>
          </div>

          <div className="hero-cards">
            {heroCards.map(p => {
              const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
              return (
                <div className="hero-card" key={p.id} onClick={() => navigate(`/property/${p.id}`)}>
                  <img src={imgs[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'} alt={p.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'; }} />
                  <div className="hero-card-info">
                    <div className="hero-card-price">${parseFloat(p.price).toLocaleString()}</div>
                    <div className="hero-card-loc">{p.city}, {p.state}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="search-section">
        <div className="search-box">
          <div className="search-box-title">Search Properties</div>
          <div className="search-tabs">
            {['sale', 'rent'].map(t => (
              <button key={t} className={`search-tab ${search.listing_type === t ? 'active' : ''}`}
                onClick={() => setSearch(s => ({ ...s, listing_type: t }))}>
                {t === 'sale' ? 'Buy' : 'Rent'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch}>
            <div className="search-fields">
              <div className="search-field">
                <label>Location or Keyword</label>
                <input placeholder="City, neighborhood, or address..."
                  value={search.query}
                  onChange={e => setSearch(s => ({ ...s, query: e.target.value }))} />
              </div>
              <div className="search-field">
                <label>Property Type</label>
                <select value={search.property_type} onChange={e => setSearch(s => ({ ...s, property_type: e.target.value }))}>
                  <option value="">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className="search-field">
                <label>Bedrooms</label>
                <select value={search.bedrooms || ''} onChange={e => setSearch(s => ({ ...s, bedrooms: e.target.value }))}>
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div className="search-field">
                <label>&nbsp;</label>
                <button type="submit" className="btn btn-primary">Search</button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">✦ Featured</span>
            <h2 className="section-title">Most Viewed Properties</h2>
            <p className="section-desc">Hand-picked properties that have caught the attention of thousands of buyers and renters.</p>
          </div>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <div className="properties-grid">
              {featured.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/listings" className="btn btn-outline btn-lg">View All Properties →</Link>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <span className="section-label">✦ Why Estatly</span>
            <h2 className="section-title">The smarter way to find a home</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { icon: '🔍', title: 'Smart Search', desc: 'Filter by price, location, type, size and dozens of other criteria to find exactly what you want.' },
              { icon: '🤝', title: 'Expert Agents', desc: 'Connect directly with licensed agents who specialize in your target neighborhoods.' },
              { icon: '🔔', title: 'Save & Track', desc: 'Save your favorite properties, track price changes, and get notified of new listings.' },
            ].map(f => (
              <div key={f.title} style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 12 }}>{f.title}</h3>
                <p style={{ color: 'var(--stone)', lineHeight: 1.8, fontSize: 14 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
