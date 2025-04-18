import { supabase } from './auth';
import type { Database } from './database.types';

export type Company = Database['public']['Tables']['profiles']['Row'] & {
  _count?: {
    jobs: number;
  };
};

export async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        _count: jobs(count)
      `)
      .eq('account_type', 'employer')
      .order('company_name', { ascending: true });

    if (error) throw error;
    return data as Company[];
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}