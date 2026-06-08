export const formatPrice = (price, listingType = 'sale') => {
  const num = parseFloat(price);
  if (listingType === 'rent') {
    return `$${num.toLocaleString()}/mo`;
  }
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  return `$${num.toLocaleString()}`;
};

export const formatArea = (sqft) => {
  if (!sqft) return 'N/A';
  return `${parseFloat(sqft).toLocaleString()} sqft`;
};

export const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const propertyTypeLabel = (type) => {
  const labels = { house: 'House', apartment: 'Apartment', condo: 'Condo', townhouse: 'Townhouse', land: 'Land', commercial: 'Commercial' };
  return labels[type] || type;
};
