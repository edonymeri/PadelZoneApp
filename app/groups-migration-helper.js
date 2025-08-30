// Player Groups migration helper
// Run this in the browser console to add the player groups system

const addPlayerGroupsSystem = async () => {
  console.log("🔧 Adding Player Groups system to database...");
  
  try {
    // Check if we have supabase available
    if (typeof supabase === 'undefined') {
      console.error("❌ Supabase not available. Make sure you're on the app page.");
      return;
    }

    // Try to create the player_groups table and update existing tables
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create player_groups table
        CREATE TABLE IF NOT EXISTS player_groups (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
          name text NOT NULL,
          description text,
          color text DEFAULT '#6B7280',
          sort_order int DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          UNIQUE(club_id, name)
        );

        -- Add group_id to players table
        ALTER TABLE players 
        ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES player_groups(id) ON DELETE SET NULL;

        -- Add target_groups to events table
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS target_groups jsonb;

        -- Create default groups for existing clubs
        INSERT INTO player_groups (club_id, name, description, color, sort_order)
        SELECT 
          c.id,
          'General',
          'Default group for all players',
          '#0172fb',
          1
        FROM clubs c
        WHERE NOT EXISTS (SELECT 1 FROM player_groups pg WHERE pg.club_id = c.id)
        ON CONFLICT (club_id, name) DO NOTHING;

        -- Create common skill-based groups
        INSERT INTO player_groups (club_id, name, description, color, sort_order)
        SELECT 
          c.id,
          grp.name,
          grp.description,
          grp.color,
          grp.sort_order
        FROM clubs c
        CROSS JOIN (
          VALUES 
            ('Beginners', 'New to padel, learning basics', '#10B981', 2),
            ('Intermediate', 'Comfortable with basic skills', '#F59E0B', 3),
            ('Advanced', 'Experienced players with strong technique', '#EF4444', 4),
            ('Competitive', 'Tournament-level players', '#8B5CF6', 5)
        ) AS grp(name, description, color, sort_order)
        WHERE NOT EXISTS (SELECT 1 FROM player_groups pg WHERE pg.club_id = c.id AND pg.name = grp.name)
        ON CONFLICT (club_id, name) DO NOTHING;
      `
    });

    if (error) {
      console.error("❌ Migration failed:", error);
      console.log("💡 You may need to run this migration manually in your Supabase dashboard.");
      console.log("📄 Check supabase/migrations/20240830_add_player_groups.sql for the complete migration.");
    } else {
      console.log("✅ Player Groups migration completed successfully!");
      console.log("🎯 Default groups created: General, Beginners, Intermediate, Advanced, Competitive");
      console.log("🔄 Please refresh the page to see the changes.");
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    console.log("💡 Manual migration required. Run the SQL from: supabase/migrations/20240830_add_player_groups.sql");
  }
};

// Export for manual use
window.addPlayerGroupsSystem = addPlayerGroupsSystem;

console.log("🎯 Player Groups migration helper loaded!");
console.log("📝 Run: addPlayerGroupsSystem() to add the groups system to your database");
