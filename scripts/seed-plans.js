/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

// Try loading .env.local manually if MONGODB_URI is not in process.env
if (!process.env.MONGODB_URI) {
  try {
    const envLocalPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envLocal = fs.readFileSync(envLocalPath, 'utf8');
      envLocal.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      });
    }
  } catch (e) {
    console.error('Error reading .env.local file:', e);
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

// Minimal Schema representation for Plan seeding
const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    billingInterval: { type: String, required: true },
    features: [{ type: String }],
    limits: {
      maxMembers: { type: Number, required: true },
      maxProjects: { type: Number, required: true },
      maxTasksPerProject: { type: Number, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const plans = [
    {
      name: 'Free Plan',
      code: 'FREE',
      price: 0,
      currency: 'USD',
      billingInterval: 'NONE',
      features: ['Basic Workspace Dashboard', 'Project Boards', 'Basic Member Invitations'],
      limits: {
        maxMembers: 3,
        maxProjects: 2,
        maxTasksPerProject: 10,
      },
      isActive: true,
    },
    {
      name: 'Pro Plan',
      code: 'PRO',
      price: 15,
      currency: 'USD',
      billingInterval: 'MONTHLY',
      features: ['Full Workspace Dashboard', 'Unlimited Projects', 'Unlimited Tasks', 'Up to 10 Workspace Members'],
      limits: {
        maxMembers: 10,
        maxProjects: -1, // -1 represents unlimited
        maxTasksPerProject: -1, // -1 represents unlimited
      },
      isActive: true,
    },
  ];

  console.log('Seeding plans collection...');
  for (const plan of plans) {
    await Plan.findOneAndUpdate(
      { code: plan.code },
      plan,
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`Plan ${plan.code} seeded successfully.`);
  }

  console.log('Plan seeding completed!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Plan seeding failed with error:', err);
  process.exit(1);
});
