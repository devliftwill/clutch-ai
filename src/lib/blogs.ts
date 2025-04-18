import { supabase } from './auth';

export interface Blog {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  published: boolean;
}

export async function getBlogs() {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Blog[];
}

export async function getBlogBySlug(slug: string) {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) throw error;
  return data as Blog;
}