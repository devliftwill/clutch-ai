/*
  # Add blogs table

  1. New Tables
    - `blogs`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `title` (text)
      - `content` (text)
      - `excerpt` (text)
      - `author` (text)
      - `category` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `published` (boolean)

  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for admin write access
*/

CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  author text NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view published blogs" 
  ON public.blogs
  FOR SELECT
  TO public
  USING (published = true);

-- Insert seed data
INSERT INTO public.blogs (slug, title, content, excerpt, author, category, image_url, published) VALUES
(
  'modern-web-development-trends',
  'Modern Web Development Trends in 2025',
  E'The landscape of web development continues to evolve at a rapid pace. In 2025, we''re seeing several emerging trends that are reshaping how we build and deploy web applications.\n\nFirst, the rise of AI-powered development tools has dramatically increased developer productivity. These tools can now understand context, suggest optimizations, and even write basic components with minimal human input.\n\nSecond, WebAssembly has become mainstream, enabling high-performance applications that were previously only possible in native environments. This has led to a new generation of browser-based applications that rival desktop software in terms of speed and capability.\n\nThird, edge computing has transformed how we think about deployment and data processing. With compute resources distributed globally, applications can now process data closer to users, resulting in significantly improved performance and reduced latency.\n\nLastly, the adoption of zero-trust security models has become standard practice, with organizations implementing comprehensive security measures at every layer of their applications.',
  'Explore the latest trends shaping web development in 2025, from AI-powered tools to edge computing and beyond.',
  'Sarah Chen',
  'Technology',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=2700&q=80',
  true
),
(
  'future-of-remote-work',
  'The Future of Remote Work: Beyond 2025',
  E'Remote work has evolved far beyond its initial adoption during the global pandemic. As we look beyond 2025, several key trends are emerging that will define the future of distributed teams.\n\nAI-powered collaboration tools have become essential, providing real-time translation, meeting summaries, and context-aware task management. Virtual reality offices are now commonplace, offering immersive spaces for team collaboration and informal interactions.\n\nThe concept of "work hours" has been redefined, with teams adopting asynchronous-first approaches that respect global time zones and personal productivity patterns. Companies are investing heavily in digital wellness programs and virtual team-building activities to maintain culture and prevent burnout.\n\nPerhaps most significantly, the rise of digital nomad hubs has created new opportunities for professional networking and community building, challenging traditional notions of workplace community.',
  'Discover how remote work continues to evolve and shape the future of professional collaboration.',
  'Marcus Rodriguez',
  'Business',
  'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?ixlib=rb-1.2.1&auto=format&fit=crop&w=2700&q=80',
  true
),
(
  'ai-recruitment-revolution',
  'The AI Recruitment Revolution',
  E'Artificial Intelligence is fundamentally changing how companies approach talent acquisition and recruitment. The traditional hiring process is being transformed by sophisticated AI algorithms that can identify potential candidates, assess skills, and predict job success with unprecedented accuracy.\n\nOne of the most significant advantages of AI in recruitment is its ability to eliminate unconscious bias. By focusing purely on skills, experience, and potential, AI systems are helping create more diverse and inclusive workplaces.\n\nHowever, the human element remains crucial. The most successful organizations are those that have found the right balance between AI efficiency and human judgment, using technology to augment rather than replace human decision-making in the hiring process.\n\nAs we look to the future, the integration of AI in recruitment will only deepen, with more sophisticated matching algorithms and predictive analytics becoming standard tools in every recruiter''s arsenal.',
  'Learn how AI is transforming the recruitment industry and creating more efficient, unbiased hiring processes.',
  'Dr. Emily Watson',
  'Technology',
  'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-1.2.1&auto=format&fit=crop&w=2700&q=80',
  true
);