const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'finance_admin', 'logistics_admin'], 
    default: 'admin',
    required: true,
  },
  permissions: {
    type: [String],
    default: ['view_dashboard', 'view_products', 'view_orders', 'view_finance', 'view_invoices', 'view_settings'],
  },
  isActive: { type: Boolean, default: true },
  department: { 
    type: String, 
    enum: ['general', 'finance', 'logistics'], 
    default: 'general' 
  },
  lastLogin: Date,
  lastLogout: Date,
  sessions: [{
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  }],
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

const connectDB = async () => {
  try {
    const uri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const admins = await Admin.find({}, '-password').lean();
    console.log('\n📋 All Admins in Database:');
    console.log('Total:', admins.length);
    console.log(JSON.stringify(admins, null, 2));
    
    const subAdmins = await Admin.find({ role: { $ne: 'super_admin' } }, '-password').lean();
    console.log('\n📋 Sub-Admins Only (excluding super_admin):');
    console.log('Total:', subAdmins.length);
    console.log(JSON.stringify(subAdmins, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

connectDB();
