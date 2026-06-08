const pool = require('../config/db');

// Get all properties with filters
const getProperties = async (req, res) => {
  const {
    city, state, property_type, listing_type, status = 'active',
    min_price, max_price, bedrooms, bathrooms, min_area, max_area,
    sort = 'created_at', order = 'DESC', page = 1, limit = 12,
    search
  } = req.query;

  let conditions = ['p.status = $1'];
  let values = [status];
  let idx = 2;

  if (city) { conditions.push(`LOWER(p.city) LIKE LOWER($${idx})`); values.push(`%${city}%`); idx++; }
  if (state) { conditions.push(`LOWER(p.state) LIKE LOWER($${idx})`); values.push(`%${state}%`); idx++; }
  if (property_type) { conditions.push(`p.property_type = $${idx}`); values.push(property_type); idx++; }
  if (listing_type) { conditions.push(`p.listing_type = $${idx}`); values.push(listing_type); idx++; }
  if (min_price) { conditions.push(`p.price >= $${idx}`); values.push(min_price); idx++; }
  if (max_price) { conditions.push(`p.price <= $${idx}`); values.push(max_price); idx++; }
  if (bedrooms) { conditions.push(`p.bedrooms >= $${idx}`); values.push(bedrooms); idx++; }
  if (bathrooms) { conditions.push(`p.bathrooms >= $${idx}`); values.push(bathrooms); idx++; }
  if (min_area) { conditions.push(`p.area_sqft >= $${idx}`); values.push(min_area); idx++; }
  if (max_area) { conditions.push(`p.area_sqft <= $${idx}`); values.push(max_area); idx++; }
  if (search) {
    conditions.push(`(LOWER(p.title) LIKE LOWER($${idx}) OR LOWER(p.city) LIKE LOWER($${idx}) OR LOWER(p.address) LIKE LOWER($${idx}))`);
    values.push(`%${search}%`); idx++;
  }

  const allowedSorts = ['price', 'created_at', 'area_sqft', 'views', 'bedrooms'];
  const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM properties p WHERE ${conditions.join(' AND ')}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    values.push(parseInt(limit), offset);
    const result = await pool.query(
      `SELECT p.*, u.name as agent_name, u.phone as agent_phone, u.email as agent_email, u.avatar as agent_avatar
       FROM properties p
       LEFT JOIN users u ON p.agent_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.${sortField} ${sortOrder}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    res.json({
      properties: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching properties.' });
  }
};

// Get single property
const getProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as agent_name, u.phone as agent_phone, u.email as agent_email, u.avatar as agent_avatar
       FROM properties p
       LEFT JOIN users u ON p.agent_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Increment views
    await pool.query('UPDATE properties SET views = views + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching property.' });
  }
};

// Create property (agents/admins)
const createProperty = async (req, res) => {
  const {
    title, description, price, property_type, listing_type,
    bedrooms, bathrooms, area_sqft, lot_size, year_built,
    address, city, state, zip_code, country,
    latitude, longitude, features, images
  } = req.body;

  if (!title || !price || !address || !city || !state) {
    return res.status(400).json({ message: 'Title, price, address, city, state are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO properties
       (title, description, price, property_type, listing_type, bedrooms, bathrooms,
        area_sqft, lot_size, year_built, address, city, state, zip_code, country,
        latitude, longitude, agent_id, features, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [title, description, price, property_type, listing_type, bedrooms, bathrooms,
       area_sqft, lot_size, year_built, address, city, state, zip_code, country || 'USA',
       latitude, longitude, req.user.id,
       JSON.stringify(features || []), JSON.stringify(images || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating property.' });
  }
};

// Update property
const updateProperty = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Property not found.' });
    if (existing.rows[0].agent_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this property.' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = ['title','description','price','property_type','listing_type','status',
      'bedrooms','bathrooms','area_sqft','lot_size','year_built','address','city','state',
      'zip_code','features','images'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
        idx++;
      }
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No valid fields to update.' });

    fields.push(`updated_at = NOW()`);
    values.push(id);
    const result = await pool.query(
      `UPDATE properties SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating property.' });
  }
};

// Delete property
const deleteProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Property not found.' });
    if (existing.rows[0].agent_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    await pool.query('DELETE FROM properties WHERE id = $1', [id]);
    res.json({ message: 'Property deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting property.' });
  }
};

// Get saved properties for user
const getSavedProperties = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, sp.created_at as saved_at
       FROM saved_properties sp
       JOIN properties p ON sp.property_id = p.id
       WHERE sp.user_id = $1
       ORDER BY sp.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved properties.' });
  }
};

// Save / unsave property
const toggleSaveProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query(
      'SELECT id FROM saved_properties WHERE user_id = $1 AND property_id = $2',
      [req.user.id, id]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM saved_properties WHERE user_id = $1 AND property_id = $2', [req.user.id, id]);
      return res.json({ saved: false, message: 'Property removed from saved.' });
    } else {
      await pool.query('INSERT INTO saved_properties (user_id, property_id) VALUES ($1, $2)', [req.user.id, id]);
      return res.json({ saved: true, message: 'Property saved.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error toggling save.' });
  }
};

// Get featured/stats
const getStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_listings,
        COUNT(*) FILTER (WHERE listing_type = 'sale' AND status = 'active') as for_sale,
        COUNT(*) FILTER (WHERE listing_type = 'rent' AND status = 'active') as for_rent,
        COUNT(*) FILTER (WHERE status = 'sold') as sold,
        AVG(price) FILTER (WHERE listing_type = 'sale' AND status = 'active') as avg_sale_price,
        COUNT(DISTINCT city) as cities_covered
      FROM properties
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats.' });
  }
};

module.exports = { getProperties, getProperty, createProperty, updateProperty, deleteProperty, getSavedProperties, toggleSaveProperty, getStats };
