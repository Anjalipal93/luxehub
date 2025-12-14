require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

async function migrateProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name');

    console.log('Connected to MongoDB');

    // Find products without userId
    const productsWithoutUserId = await Product.find({ userId: { $exists: false } });

    if (productsWithoutUserId.length === 0) {
      console.log('No products found without userId. Migration complete.');
      return;
    }

    console.log(`Found ${productsWithoutUserId.length} products without userId`);

    // Find the first admin user to assign products to
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`Assigning products to admin user: ${adminUser.name} (${adminUser._id})`);

    // Update all products without userId to belong to the admin user
    const result = await Product.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: adminUser._id } }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} products.`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateProducts();
}

module.exports = migrateProducts;
