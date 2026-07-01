require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env.local") });

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        balance DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        google_id VARCHAR(255) UNIQUE,
        image TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Add columns if table already exists (for upgrades)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
        model VARCHAR(255) NOT NULL,
        tokens_in INTEGER NOT NULL DEFAULT 0,
        tokens_out INTEGER NOT NULL DEFAULT 0,
        cost DECIMAL(12,6) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);

      CREATE TABLE IF NOT EXISTS topups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_id VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_topups_user ON topups(user_id);

      CREATE TABLE IF NOT EXISTS custom_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        base_url VARCHAR(500) NOT NULL,
        api_key TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS custom_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID NOT NULL REFERENCES custom_providers(id) ON DELETE CASCADE,
        name VARCHAR(255) UNIQUE NOT NULL,
        upstream_model_name VARCHAR(255) NOT NULL,
        input_price DECIMAL(12,8) NOT NULL DEFAULT 0,
        output_price DECIMAL(12,8) NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_custom_models_name ON custom_models(name);
      CREATE INDEX IF NOT EXISTS idx_custom_models_provider ON custom_models(provider_id);

      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        credits DECIMAL(10,2) NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 30,
        features JSONB DEFAULT '[]',
        is_popular BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES plans(id),
        starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        auto_renew BOOLEAN DEFAULT false,
        status TEXT NOT NULL DEFAULT 'active',
        payment_method TEXT NOT NULL,
        payment_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      INSERT INTO plans (name, slug, price, credits, duration_days, features, is_popular, is_active)
      VALUES
        ('Starter', 'starter', 50000.00, 65000.00, 30, '["Akses semua model", "Support standar", "API docs lengkap"]', false, true),
        ('Pro', 'pro', 150000.00, 200000.00, 30, '["Akses semua model", "Priority support", "Bonus 33% credit", "Usage analytics"]', true, true),
        ('Business', 'business', 500000.00, 700000.00, 30, '["Akses semua model", "Dedicated support", "Bonus 40% credit", "Custom API keys", "SLA 99.9%"]', false, true)
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed default Groq provider & models
    const provRes = await client.query(`
      INSERT INTO custom_providers (name, slug, base_url, api_key)
      VALUES ('Groq Cloud', 'groq', 'https://api.groq.com/openai/v1', 'gsk_set_via_env')
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `);
    if (provRes.rows.length > 0) {
      const groqId = provRes.rows[0].id;
      const groqModels = [
        ['llama-3.3-70b-versatile', 'llama-3.3-70b-versatile', 0.0000005, 0.000002],
        ['llama-3.1-8b-instant', 'llama-3.1-8b-instant', 0.00000015, 0.0000006],
        ['llama-4-scout-17b', 'meta-llama/llama-4-scout-17b-16e-instruct', 0.0000003, 0.000001],
        ['qwen-qwen3-32b', 'qwen/qwen3-32b', 0.0000003, 0.000001],
        ['qwen-qwen3.6-27b', 'qwen/qwen3.6-27b', 0.0000003, 0.000001],
      ];
      for (const [name, upModel, inp, out] of groqModels) {
        await client.query(
          `INSERT INTO custom_models (provider_id, name, upstream_model_name, input_price, output_price)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING`,
          [groqId, name, upModel, inp, out]
        );
      }
    }

    console.log("Migration complete");
    await client.query(`
      INSERT INTO users (email, password_hash, name, balance)
      VALUES ('admin@nanaai.id', '$2a$10$apUmB8tAF3qsQQ3UgSPwY.CxHPheIdO24xaDZCEVWmOLAio6muDA2', 'Admin', 999999.00)
      ON CONFLICT (email) DO NOTHING;
    `);
  } finally {
    client.release();
  }
  await pool.end();
}

migrate().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
