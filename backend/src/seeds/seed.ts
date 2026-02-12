// ============================================
// Database Seed Script
// ============================================

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { CafeTable } from '../models/CafeTable.js';
import { PoolTable } from '../models/PoolTable.js';
import { PoolPlayer } from '../models/PoolPlayer.js';
import { PoolTournament } from '../models/PoolTournament.js';
import { Order } from '../models/Order.js';
import { PoolSession } from '../models/PoolSession.js';

async function seed(): Promise<void> {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      CafeTable.deleteMany({}),
      PoolTable.deleteMany({}),
      PoolPlayer.deleteMany({}),
      PoolTournament.deleteMany({}),
      Order.deleteMany({}),
      PoolSession.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data (users, orders, sessions, products, tables)');

    // Create admin user
    await User.create({
      name: 'Nourdine',
      email: 'admin@nouryaak-pool.local',
      password: 'admin123',
      pin: '0000',
      role: 'admin',
      isActive: true,
    });
    console.log('👤 Created admin user (admin@nouryaak-pool.local / admin123)');

    // Create sample staff users
    const sampleUsers = [
      { name: 'Omar', email: 'omar@nouryaak-pool.local', password: 'omar123', pin: '1111', role: 'waiter' },
      { name: 'Nourdine', email: 'nordine@nouryaak-pool.local', password: 'nordine123', pin: '2222', role: 'bartender' },
      { name: 'Hicham', email: 'hicham@nouryaak-pool.local', password: 'hicham123', pin: '2222', role: 'bartender' },
      { name: 'Yassine', email: 'yassine@nouryaak-pool.local', password: 'yassine123', pin: '3333', role: 'pool_manager' },
      { name: 'Ali', email: 'ali@nouryaak-pool.local', password: 'ali123', pin: '4444', role: 'waiter' },
    ];

    for (const userData of sampleUsers) {
      await User.create(userData);
      console.log(`👤 Created user: ${userData.name} (${userData.role})`);
    }

    console.log('⚠️ Skipping product and table seeding as requested...');


    console.log('');
    console.log('✅ Database seed completed!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('   Admin: admin@nouryaak-pool.local / admin123 (PIN: 0000)');
    console.log('   Waiter: Omar@nouryaak-pool.local / omar123 (PIN: 1111)');
    console.log('   Bartender: Nourdine@nouryaak-pool.local / nordine123 (PIN: 2222)');
    console.log('   Pool Manager: Yassine@nouryaak-pool.local / yassine123 (PIN: 3333)');
    console.log('   Bartender: Hicham@nouryaak-pool.local / hicham123 (PIN: 2222)');
    console.log('   Waiter: Ali@nouryaak-pool.local / ali123 (PIN: 4444)');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run seed
seed();
