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
    const superAdmin = new Admin({
      email: 'sta99175@gmail.com',
      password: 'empi',
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
    console.log('Email: sta99175@gmail.com');
    console.log('Password: empi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin();
