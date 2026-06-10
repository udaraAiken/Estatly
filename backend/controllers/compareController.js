const pool = require('../config/db');

// GET /api/properties/compare?ids=1,2,3
const compareProperties = async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ message: 'Provide property IDs as ?ids=1,2,3' });
  }

  const idList = ids
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id) && id > 0);

  if (idList.length < 2) {
    return res.status(400).json({ message: 'Provide at least 2 valid property IDs to compare.' });
  }

  if (idList.length > 4) {
    return res.status(400).json({ message: 'You can compare up to 4 properties at a time.' });
  }

  try {
    const placeholders = idList.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `SELECT
        p.*,
        u.name  AS agent_name,
        u.phone AS agent_phone,
        u.email AS agent_email
       FROM properties p
       LEFT JOIN users u ON p.agent_id = u.id
       WHERE p.id IN (${placeholders})`,
      idList
    );

    // Return in the same order the caller requested
    const ordered = idList
      .map(id => result.rows.find(r => r.id === id))
      .filter(Boolean);

    res.json(ordered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching comparison data.' });
  }
};

module.exports = { compareProperties };
