import mongoose from 'mongoose';
import path from 'path';
import connectDB from '../lib/mongodb';
import Admin from '../lib/models/Admin';

async function initializeAdmin() {
  try {
    await connectDB();

    // Check if super_admin already exists
    const existingAdmin = await Admin.findOne({ role: 'super_admin' });

    if (existingAdmin) {
      console.log('✅ Super admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@empicostumes.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Mastercode@empicostumes';
    const superAdmin = new Admin({
      email: adminEmail,
      password: adminPassword,
      fullName: 'Admin',
      role: 'super_admin',
      permissions: [
        'view_dashboard',
        'view_products',
        'view_orders',
        'view_finance',
        'view_invoices',
        'view_settings',
        'manage_admins',
        'manage_permissions',
      ],
      isActive: true,
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin();
