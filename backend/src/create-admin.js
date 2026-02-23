// backend/create-admin.js
import bcrypt from 'bcrypt';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
  try {
    // Hash password - change 'admin123' to your desired password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    await pool.query(
      `INSERT INTO admin_users (username, password, email, role) 
       VALUES ($1, $2, $3, $4)`,
      ['admin', hashedPassword, 'admin@logicspark.com', 'admin']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123 (change this after first login)');
    
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    await pool.end();
  }
}

createAdmin();