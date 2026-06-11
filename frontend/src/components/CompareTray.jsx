import { useNavigate } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { formatPrice } from '../utils/format';

export default function CompareTray() {
  const { compareList, removeFromCompare, clearCompare, count, MAX_COMPARE } = useCompare();
  const navigate = useNavigate();

  if (count === 0) return null;

  const imgs = (p) => {
    const arr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
    return arr[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200';
  };

  return (
    <div className="compare-tray">
      <div className="compare-tray-inner">
        <div className="compare-tray-label">
          <span className="compare-tray-icon">⚖️</span>
          <span>Compare <strong>{count}</strong> / {MAX_COMPARE}</span>
        </div>

        <div className="compare-tray-slots">
          {compareList.map(p => (
            <div key={p.id} className="compare-tray-slot">
              <img
                src={imgs(p)}
                alt={p.title}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'; }}
              />
              <div className="compare-tray-slot-info">
                <div className="compare-tray-slot-title">{p.title}</div>
                <div className="compare-tray-slot-price">{formatPrice(p.price, p.listing_type)}</div>
              </div>
              <button
                className="compare-tray-remove"
                onClick={() => removeFromCompare(p.id)}
                title="Remove from comparison"
              >×</button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: MAX_COMPARE - count }).map((_, i) => (
            <div key={`empty-${i}`} className="compare-tray-slot compare-tray-slot--empty">
              <div className="compare-tray-slot-placeholder">
                <span>+</span>
                <span className='compare-tray-slot-placeholder-text'>Add property</span>
              </div>
            </div>
          ))}
        </div>

        <div className="compare-tray-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearCompare}
          >Clear all</button>
          <button
            className="btn btn-gold"
            disabled={count < 2}
            onClick={() => navigate(`/compare?ids=${compareList.map(p => p.id).join(',')}`)}
          >
            Compare {count} homes →
          </button>
        </div>
      </div>
    </div>
  );
}
