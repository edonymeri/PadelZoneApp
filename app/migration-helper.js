// Quick migration helper to add missing columns to clubs table
// Run this in the browser console on the settings page if you get database errors

const addClubSettingsColumns = async () => {
  console.log("🔧 Adding missing columns to clubs table...");
  
  try {
    // Check if we have supabase available
    if (typeof supabase === 'undefined') {
      console.error("❌ Supabase not available. Make sure you're on the app page.");
      return;
    }

    // Try to add the missing columns
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE clubs 
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS contact_email TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS website TEXT,
        ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
        ADD COLUMN IF NOT EXISTS default_round_minutes INTEGER DEFAULT 12,
        ADD COLUMN IF NOT EXISTS default_courts INTEGER DEFAULT 4,
        ADD COLUMN IF NOT EXISTS default_points_per_game INTEGER,
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0172fb',
        ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#01CBFC';
      `
    });

    if (error) {
      console.error("❌ Migration failed:", error);
      console.log("💡 You may need to run this migration manually in your Supabase dashboard.");
    } else {
      console.log("✅ Migration completed successfully!");
      console.log("🔄 Please refresh the page to see the changes.");
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    console.log("💡 Manual migration required. Add these columns to your clubs table:");
    console.log(`
      description TEXT,
      contact_email TEXT,
      phone TEXT,
      address TEXT,
      website TEXT,
      timezone TEXT DEFAULT 'UTC',
      default_round_minutes INTEGER DEFAULT 12,
      default_courts INTEGER DEFAULT 4,
      default_points_per_game INTEGER,
      logo_url TEXT,
      primary_color TEXT DEFAULT '#0172fb',
      secondary_color TEXT DEFAULT '#01CBFC'
    `);
  }
};

// Auto-run if in development
if (window.location.hostname === 'localhost') {
  console.log("🚀 Development environment detected. Running migration...");
  addClubSettingsColumns();
}

// Export for manual use
window.addClubSettingsColumns = addClubSettingsColumns;
