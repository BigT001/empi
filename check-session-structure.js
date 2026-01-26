const mongoose = require('mongoose');

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
  sessionToken: String,  // Legacy field for backward compatibility
  sessionExpiry: Date,   // Legacy field for backward compatibility
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
    
    const superAdmin = await Admin.findOne({ role: 'super_admin' });
    console.log('\n📋 Super Admin Structure:');
    console.log('Email:', superAdmin.email);
    console.log('Role:', superAdmin.role);
    console.log('sessionToken (legacy):', superAdmin.sessionToken ? superAdmin.sessionToken.substring(0, 20) + '...' : 'NOT SET');
    console.log('sessionExpiry (legacy):', superAdmin.sessionExpiry);
    console.log('sessions array length:', superAdmin.sessions?.length || 0);
    if (superAdmin.sessions && superAdmin.sessions.length > 0) {
      console.log('\nSessions in array:');
      superAdmin.sessions.forEach((s, i) => {
        console.log(`  [${i}] Token: ${s.token.substring(0, 20)}... | Expires: ${s.expiresAt}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

connectDB();
