import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

import api from '../utils/api';
import { formatPrice, formatArea, propertyTypeLabel, timeAgo } from '../utils/format';
import { useCompare } from '../context/CompareContext';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600';

// Rows to compare — [label, accessor fn, formatter?, highlight? (higher=better / lower=better)]
const ROWS = [
  { section: 'Pricing', rows: [
    { label: 'Price',          key: 'price',       fmt: (v, p) => formatPrice(v, p.listing_type), highlight: 'lower' },
    { label: 'Listing Type',   key: 'listing_type', fmt: v => v === 'sale' ? 'For Sale' : 'For Rent' },
    { label: 'Price / sqft',   key: '_price_sqft',  fmt: v => v ? `$${v}` : '—', highlight: 'lower' },
  ]},
  { section: 'Size & Layout', rows: [
    { label: 'Bedrooms',   key: 'bedrooms',   fmt: v => v ?? '—', highlight: 'higher' },
    { label: 'Bathrooms',  key: 'bathrooms',  fmt: v => v ?? '—', highlight: 'higher' },
    { label: 'Living Area',key: 'area_sqft',  fmt: v => v ? formatArea(v) : '—', highlight: 'higher' },
    { label: 'Lot Size',   key: 'lot_size',   fmt: v => v ? formatArea(v) : '—', highlight: 'higher' },
  ]},
  { section: 'Property Details', rows: [
    { label: 'Type',       key: 'property_type', fmt: v => propertyTypeLabel(v) },
    { label: 'Year Built', key: 'year_built',    fmt: v => v ?? '—', highlight: 'higher' },
    { label: 'Status',     key: 'status',        fmt: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—' },
  ]},
  { section: 'Location', rows: [
    { label: 'Address',    key: 'address', fmt: v => v ?? '—' },
    { label: 'City',       key: 'city',    fmt: v => v ?? '—' },
    { label: 'State',      key: 'state',   fmt: v => v ?? '—' },
    { label: 'ZIP Code',   key: 'zip_code',fmt: v => v ?? '—' },
  ]},
  { section: 'Agent', rows: [
    { label: 'Agent Name',  key: 'agent_name',  fmt: v => v ?? '—' },
    { label: 'Agent Phone', key: 'agent_phone', fmt: v => v ?? '—' },
  ]},
  { section: 'Activity', rows: [
    { label: 'Views',      key: 'views',      fmt: v => v?.toLocaleString() ?? '—', highlight: 'higher' },
    { label: 'Listed',     key: 'created_at', fmt: v => v ? timeAgo(v) : '—' },
  ]},
];

function getVal(property, key) {
  if (key === '_price_sqft') {
    if (!property.price || !property.area_sqft) return null;
    return Math.round(parseFloat(property.price) / parseFloat(property.area_sqft));
  }
  return property[key] ?? null;
}

function highlightClass(properties, key, direction) {
  if (!direction) return properties.map(() => '');
  const vals = properties.map(p => {
    const v = getVal(p, key);
    return v !== null && v !== undefined ? parseFloat(v) : null;
  });
  const valid = vals.filter(v => v !== null);
  if (valid.length < 2) return properties.map(() => '');
  const best = direction === 'higher' ? Math.max(...valid) : Math.min(...valid);
  const worst = direction === 'higher' ? Math.min(...valid) : Math.max(...valid);
  return vals.map(v => {
    if (v === null) return '';
    if (v === best) return 'compare-cell--best';
    if (v === worst && valid.length > 1) return 'compare-cell--worst';
    return '';
  });
}

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImgs, setActiveImgs] = useState({});

  const ids = searchParams.get('ids') || '';

  useEffect(() => {
    if (!ids) { setLoading(false); return; }
    setLoading(true);
    api.get(`/properties/compare?ids=${ids}`)
      .then(res => {
        setProperties(res.data);
        const initImgs = {};
        res.data.forEach(p => { initImgs[p.id] = 0; });
        setActiveImgs(initImgs);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load properties.'))
      .finally(() => setLoading(false));
  }, [ids]);

  const getImgs = (p) => Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
  const getFeatures = (p) => Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');

  if (loading) return (
    <div className="compare-page">
      <div className="loading"><div className="spinner" /></div>
    </div>
  );

  if (error) return (
    <div className="compare-page">
      <div className="compare-header">
        <Link to="/listings" className="btn btn-ghost btn-sm">← Back to listings</Link>
      </div>
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">{error}</div>
      </div>
    </div>
  );

  if (!ids || properties.length === 0) return (
    <div className="compare-page">
      <div className="compare-header">
        <Link to="/listings" className="btn btn-ghost btn-sm">← Back to listings</Link>
      </div>
      <div className="empty-state">
        <div className="empty-icon">⚖️</div>
        <div className="empty-title">No properties selected</div>
        <p style={{ marginBottom: 24 }}>Browse listings and use the Compare button to add up to 4 properties.</p>
        <Link to="/listings" className="btn btn-gold">Browse Properties</Link>
      </div>
    </div>
  );

  const colCount = properties.length;

  return (
    <div className="compare-page">
      {/* ── Header ── */}
      <div className="compare-header">
        <div className="compare-header-left">
          <Link to="/listings" className="compare-back-link">← Back to listings</Link>
          <h1 className="compare-title">Compare Properties</h1>
          <p className="compare-subtitle">Side-by-side breakdown of {colCount} {colCount === 1 ? 'property' : 'properties'}</p>
        </div>
        <div className="compare-header-actions">
          {colCount < 4 && (
            <Link to="/listings" className="btn btn-ghost btn-sm">+ Add another</Link>
          )}
        </div>
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table" style={{ '--col-count': colCount }}>

          {/* ── Property photos & titles ── */}
          <thead>
            <tr className="compare-hero-row">
              <th className="compare-label-col" />
              {properties.map(p => {
                const imgs = getImgs(p);
                const activeIdx = activeImgs[p.id] || 0;
                return (
                  <th key={p.id} className="compare-prop-col">
                    <div className="compare-prop-header">
                      {/* Gallery */}
                      <div className="compare-prop-gallery">
                        <img
                          src={imgs[activeIdx] || FALLBACK_IMG}
                          alt={p.title}
                          onError={e => { e.target.src = FALLBACK_IMG; }}
                        />
                        {imgs.length > 1 && (
                          <div className="compare-gallery-dots">
                            {imgs.slice(0, 5).map((_, i) => (
                              <button
                                key={i}
                                className={`compare-gallery-dot ${i === activeIdx ? 'active' : ''}`}
                                onClick={() => setActiveImgs(a => ({ ...a, [p.id]: i }))}
                              />
                            ))}
                          </div>
                        )}
                        <span className={`compare-prop-badge ${p.listing_type === 'rent' ? 'badge-rent' : 'badge-sale'}`}>
                          {p.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                        </span>
                      </div>

                      {/* Title block */}
                      <div className="compare-prop-meta">
                        <div className="compare-prop-price">{formatPrice(p.price, p.listing_type)}</div>
                        <div className="compare-prop-title">{p.title}</div>
                        <div className="compare-prop-addr">📍 {p.city}, {p.state}</div>
                        <div className="compare-prop-ctas">
                          <Link to={`/property/${p.id}`} className="btn btn-primary btn-sm">View Listing</Link>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => removeFromCompare(p.id)}
                            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                          >Remove</button>
                        </div>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Data rows ── */}
          <tbody>
            {ROWS.map(({ section, rows }) => (
              <>
                <tr key={`section-${section}`} className="compare-section-row">
                  <td colSpan={colCount + 1} className="compare-section-label">{section}</td>
                </tr>
                {rows.map(({ label, key, fmt, highlight }) => {
                  const classes = highlightClass(properties, key, highlight);
                  return (
                    <tr key={key} className="compare-data-row">
                      <td className="compare-row-label">{label}</td>
                      {properties.map((p, i) => {
                        const raw = getVal(p, key);
                        const display = fmt ? fmt(raw, p) : (raw ?? '—');
                        return (
                          <td key={p.id} className={`compare-cell ${classes[i]}`}>
                            {classes[i] === 'compare-cell--best' && highlight && (
                              <span className="compare-best-badge" title="Best value">✓</span>
                            )}
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            ))}

            {/* ── Features row ── */}
            <tr className="compare-section-row">
              <td colSpan={colCount + 1} className="compare-section-label">Features & Amenities</td>
            </tr>
            <tr className="compare-data-row compare-features-row">
              <td className="compare-row-label">Amenities</td>
              {properties.map(p => {
                const feats = getFeatures(p);
                return (
                  <td key={p.id} className="compare-cell compare-cell--features">
                    {feats.length > 0
                      ? feats.map(f => <span key={f} className="compare-feature-tag">{f}</span>)
                      : <span style={{ color: 'var(--stone)', fontSize: 13 }}>None listed</span>
                    }
                  </td>
                );
              })}
            </tr>

            {/* ── Description row ── */}
            <tr className="compare-section-row">
              <td colSpan={colCount + 1} className="compare-section-label">Description</td>
            </tr>
            <tr className="compare-data-row">
              <td className="compare-row-label">About</td>
              {properties.map(p => (
                <td key={p.id} className="compare-cell compare-cell--desc">
                  {p.description
                    ? p.description.length > 200 ? p.description.slice(0, 200) + '…' : p.description
                    : <span style={{ color: 'var(--stone)' }}>No description.</span>
                  }
                </td>
              ))}
            </tr>
          </tbody>

          {/* ── Footer CTA row ── */}
          <tfoot>
            <tr className="compare-footer-row">
              <td className="compare-label-col" />
              {properties.map(p => (
                <td key={p.id} className="compare-footer-cell">
                  <Link to={`/property/${p.id}`} className="btn btn-gold btn-block">
                    View Full Listing
                  </Link>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
