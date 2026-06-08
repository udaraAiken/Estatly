const pool = require('../config/db');

const createInquiry = async (req, res) => {
  const { property_id } = req.params;
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email and message are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inquiries (property_id, user_id, name, email, phone, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [property_id, req.user?.id || null, name, email, phone, message]
    );
    res.status(201).json({ message: 'Inquiry sent successfully.', inquiry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending inquiry.' });
  }
};

const getInquiries = async (req, res) => {
  try {
    let query, values;
    if (req.user.role === 'admin') {
      query = `SELECT i.*, p.title as property_title, p.address FROM inquiries i
               JOIN properties p ON i.property_id = p.id ORDER BY i.created_at DESC`;
      values = [];
    } else {
      query = `SELECT i.*, p.title as property_title, p.address FROM inquiries i
               JOIN properties p ON i.property_id = p.id
               WHERE p.agent_id = $1 ORDER BY i.created_at DESC`;
      values = [req.user.id];
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inquiries.' });
  }
};

const updateInquiryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = req.user.role === 'admin'
      ? await pool.query(
        `UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      )
      : await pool.query(
        `UPDATE inquiries i
         SET status = $1
         FROM properties p
         WHERE i.id = $2
           AND i.property_id = p.id
           AND p.agent_id = $3
         RETURNING i.*`,
        [status, id, req.user.id]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found or not authorized.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating inquiry.' });
  }
};

module.exports = { createInquiry, getInquiries, updateInquiryStatus };
