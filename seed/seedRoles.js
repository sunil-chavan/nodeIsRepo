const mongoose = require('mongoose');
const Role = require('../models/Role');

mongoose.connect('mongodb+srv://sunilchavan017:ahkpcO4ef081aFxF@cluster0.cccuoqk.mongodb.net/dhruvsCloudKitchen?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedRoles = async () => {
  try {
    const roles = ['superadmin', 'admin', 'user'];
    for (const name of roles) {
      await Role.updateOne({ name }, { name }, { upsert: true });
    }
    console.log('✅ Roles seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed roles:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedRoles();
