import { supabase } from '@/lib/supabase';

export interface Club {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
}

export interface ClubMembership {
  club_id: string;
  user_id: string;
  role: 'owner' | 'organizer' | 'viewer';
}

export class ClubService {
  /**
   * Get club by ID
   */
  static async getClub(clubId: string): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (error) throw new Error(`Failed to load club: ${error.message}`);
    return data;
  }

  /**
   * Get all clubs the current user has access to
   */
  static async getClubs(): Promise<Club[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name, owner_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to load clubs: ${error.message}`);
  return (data || []) as Club[];
  }

  /**
   * Create a new club
   */
  static async createClub(name: string): Promise<Club> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('clubs')
      .insert({ name: name.trim(), owner_id: user.id })
      .select()
      .single();

    if (error) throw new Error(`Failed to create club: ${error.message}`);
    return data;
  }

  /**
   * Update a club
   */
  static async updateClub(clubId: string, updates: Partial<Pick<Club, 'name'>>): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update club: ${error.message}`);
    return data;
  }

  /**
   * Delete a club
   */
  static async deleteClub(clubId: string): Promise<void> {
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (error) throw new Error(`Failed to delete club: ${error.message}`);
  }

  /**
   * Get club memberships
   */
  static async getClubMemberships(clubId: string): Promise<ClubMembership[]> {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('*')
      .eq('club_id', clubId);

    if (error) throw new Error(`Failed to load club memberships: ${error.message}`);
    return data || [];
  }

  /**
   * Add user to club
   */
  static async addMember(
    clubId: string, 
    userId: string, 
    role: ClubMembership['role'] = 'organizer'
  ): Promise<void> {
    const { error } = await supabase
      .from('club_memberships')
      .insert({ club_id: clubId, user_id: userId, role });

    if (error) throw new Error(`Failed to add member: ${error.message}`);
  }

  /**
   * Remove user from club
   */
  static async removeMember(clubId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('club_memberships')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to remove member: ${error.message}`);
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    clubId: string, 
    userId: string, 
    role: ClubMembership['role']
  ): Promise<void> {
    const { error } = await supabase
      .from('club_memberships')
      .update({ role })
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to update member role: ${error.message}`);
  }
}
