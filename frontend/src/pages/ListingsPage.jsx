import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import api from "../utils/api";
import Map from "../components/Map";

const SORT_OPTIONS = [
  { value: "created_at-DESC", label: "Newest First" },
  { value: "price-ASC", label: "Price: Low to High" },
  { value: "price-DESC", label: "Price: High to Low" },
  { value: "area_sqft-DESC", label: "Largest First" },
  { value: "views-DESC", label: "Most Popular" },
];

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // 'grid' or 'map'

  const [filters, setFilters] = useState({
    listing_type: searchParams.get("listing_type") || "",
    property_type: searchParams.get("property_type") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    sort: "created_at",
    order: "DESC",
    search: searchParams.get("search") || "",
    page: 1,
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get("/properties", { params });
      setProperties(res.data.properties || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const handleSort = (val) => {
    const [sort, order] = val.split("-");
    setFilters((f) => ({ ...f, sort, order, page: 1 }));
  };

  const clearFilters = () =>
    setFilters({
      listing_type: "",
      property_type: "",
      min_price: "",
      max_price: "",
      bedrooms: "",
      sort: "created_at",
      order: "DESC",
      search: "",
      page: 1,
    });

  return (
    <div>
      {/* Search bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--cream)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            className="filter-select"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Search by city, address, keyword..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProperties()}
          />
          <select
            className="filter-select"
            value={filters.listing_type}
            onChange={(e) => updateFilter("listing_type", e.target.value)}
          >
            <option value="">Buy or Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <select
            className="filter-select"
            value={filters.property_type}
            onChange={(e) => updateFilter("property_type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
          </select>
          <select
            className="filter-select"
            value={filters.bedrooms}
            onChange={(e) => updateFilter("bedrooms", e.target.value)}
          >
            <option value="">Bedrooms</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          <select
            className="filter-select"
            value={`${filters.sort}-${filters.order}`}
            onChange={(e) => handleSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Clear
          </button>
          {view === "map" && (
            <button
              className={`btn btn-sm btn-ghost`}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
          )}
          {view === "grid" && (
            <button
              className={`btn btn-sm btn-ghost`}
              onClick={() => setView("map")}
            >
              Map
            </button>
          )}
          <span className="results-count">
            {pagination.total || 0} properties
          </span>
        </div>
      </div>

      <div className="listings-page">
        <div className="listings-content">
          {/* SIDEBAR */}
          <div>
            <div className="sidebar-filters">
              <div className="sidebar-title">Price Range</div>
              <div className="filter-section">
                <div className="price-range">
                  <div>
                    <label className="filter-section-title">Min ($)</label>
                    <input
                      className="filter-select"
                      style={{ width: "100%" }}
                      type="number"
                      placeholder="0"
                      value={filters.min_price}
                      onChange={(e) =>
                        updateFilter("min_price", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="filter-section-title">Max ($)</label>
                    <input
                      className="filter-select"
                      style={{ width: "100%" }}
                      type="number"
                      placeholder="Any"
                      value={filters.max_price}
                      onChange={(e) =>
                        updateFilter("max_price", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Listing Type</div>
                <div className="checkbox-group">
                  {[
                    ["", "All"],
                    ["sale", "For Sale"],
                    ["rent", "For Rent"],
                  ].map(([v, l]) => (
                    <label key={v} className="checkbox-item">
                      <input
                        type="radio"
                        name="listing_type"
                        checked={filters.listing_type === v}
                        onChange={() => updateFilter("listing_type", v)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Property Type</div>
                <div className="checkbox-group">
                  {[
                    ["", "All"],
                    ["house", "House"],
                    ["apartment", "Apartment"],
                    ["condo", "Condo"],
                    ["townhouse", "Townhouse"],
                    ["land", "Land"],
                  ].map(([v, l]) => (
                    <label key={v} className="checkbox-item">
                      <input
                        type="radio"
                        name="prop_type"
                        checked={filters.property_type === v}
                        onChange={() => updateFilter("property_type", v)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Min Bedrooms</div>
                <div className="checkbox-group">
                  {[
                    ["", "Any"],
                    ["1", "1+"],
                    ["2", "2+"],
                    ["3", "3+"],
                    ["4", "4+"],
                  ].map(([v, l]) => (
                    <label key={v} className="checkbox-item">
                      <input
                        type="radio"
                        name="beds"
                        checked={filters.bedrooms === v}
                        onChange={() => updateFilter("bedrooms", v)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GRID */}
          {view === "grid" && (
            <div>
              {loading ? (
                <div className="loading">
                  <div className="spinner" />
                </div>
              ) : properties.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏡</div>
                  <div className="empty-title">No properties found</div>
                  <p>Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="properties-grid">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="pagination">
                  {Array.from(
                    { length: pagination.pages },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${pagination.page === p ? "active" : ""}`}
                      onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {view === "map" && <Map properties={properties} />}
        </div>
      </div>
    </div>
  );
}
