/*
  # Seed employer profiles and jobs

  1. Changes
    - Add 5 new employer profiles and their jobs
    - Handle duplicate profiles with ON CONFLICT
    - Create auth users first
    - Create profiles after users
    - Add jobs for each company

  2. Security
    - Maintain existing RLS policies
    - Use proper data types and constraints
*/

DO $$
DECLARE
  employer3_id uuid := gen_random_uuid();
  employer4_id uuid := gen_random_uuid();
  employer5_id uuid := gen_random_uuid();
  employer6_id uuid := gen_random_uuid();
  employer7_id uuid := gen_random_uuid();
BEGIN
  -- Create auth users first
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_current,
    email_change_token_new,
    recovery_token
  ) VALUES 
    (
      employer3_id,
      '00000000-0000-0000-0000-000000000000',
      'will+employer3@clutchjobs.ca',
      crypt('temp-password', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'full_name', 'Sarah Chen',
        'account_type', 'employer',
        'company_name', 'TechVision Solutions',
        'website', 'https://techvision.com',
        'industry', 'Technology'
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      employer4_id,
      '00000000-0000-0000-0000-000000000000',
      'will+employer4@clutchjobs.ca',
      crypt('temp-password', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'full_name', 'Michael Rodriguez',
        'account_type', 'employer',
        'company_name', 'HealthCare Plus',
        'website', 'https://healthcareplus.com',
        'industry', 'Healthcare'
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      employer5_id,
      '00000000-0000-0000-0000-000000000000',
      'will+employer5@clutchjobs.ca',
      crypt('temp-password', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'full_name', 'Emily Thompson',
        'account_type', 'employer',
        'company_name', 'EduTech Innovations',
        'website', 'https://edutech.com',
        'industry', 'Education'
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      employer6_id,
      '00000000-0000-0000-0000-000000000000',
      'will+employer6@clutchjobs.ca',
      crypt('temp-password', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'full_name', 'David Kim',
        'account_type', 'employer',
        'company_name', 'FinServe Global',
        'website', 'https://finserve.com',
        'industry', 'Finance'
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      employer7_id,
      '00000000-0000-0000-0000-000000000000',
      'will+employer7@clutchjobs.ca',
      crypt('temp-password', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'full_name', 'Jessica Patel',
        'account_type', 'employer',
        'company_name', 'GreenEnergy Solutions',
        'website', 'https://greenenergy.com',
        'industry', 'Energy'
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

  -- Create profiles for the users
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    account_type,
    company_name,
    website,
    industry
  ) VALUES 
    (
      employer3_id,
      'will+employer3@clutchjobs.ca',
      'Sarah Chen',
      'employer',
      'TechVision Solutions',
      'https://techvision.com',
      'Technology'
    ),
    (
      employer4_id,
      'will+employer4@clutchjobs.ca',
      'Michael Rodriguez',
      'employer',
      'HealthCare Plus',
      'https://healthcareplus.com',
      'Healthcare'
    ),
    (
      employer5_id,
      'will+employer5@clutchjobs.ca',
      'Emily Thompson',
      'employer',
      'EduTech Innovations',
      'https://edutech.com',
      'Education'
    ),
    (
      employer6_id,
      'will+employer6@clutchjobs.ca',
      'David Kim',
      'employer',
      'FinServe Global',
      'https://finserve.com',
      'Finance'
    ),
    (
      employer7_id,
      'will+employer7@clutchjobs.ca',
      'Jessica Patel',
      'employer',
      'GreenEnergy Solutions',
      'https://greenenergy.com',
      'Energy'
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    account_type = EXCLUDED.account_type,
    company_name = EXCLUDED.company_name,
    website = EXCLUDED.website,
    industry = EXCLUDED.industry;

  -- Create jobs for TechVision Solutions
  INSERT INTO public.jobs (title, company_id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  SELECT
    title, profiles.id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule
  FROM (
    VALUES
      ('Senior Software Engineer', 'Full-time', 'Toronto, ON', 'Join our innovative team developing cutting-edge software solutions', ARRAY['5+ years experience in software development', 'Strong knowledge of React and Node.js', 'Experience with cloud platforms'], ARRAY['Lead development of new features', 'Mentor junior developers', 'Participate in architecture decisions'], 120000, 160000, 'Senior', ARRAY['Health Insurance', 'Remote Work', 'Stock Options'], 'Full-time'),
      ('DevOps Engineer', 'Full-time', 'Vancouver, BC', 'Help us build and maintain our cloud infrastructure', ARRAY['3+ years DevOps experience', 'AWS certification', 'CI/CD expertise'], ARRAY['Manage cloud infrastructure', 'Implement automation', 'Monitor system performance'], 90000, 130000, 'Mid Level', ARRAY['Dental Coverage', 'Flexible Hours', '401(k)'], 'Full-time'),
      ('Product Manager', 'Full-time', 'Toronto, ON', 'Drive product strategy and execution', ARRAY['4+ years product management experience', 'Technical background', 'Strong analytical skills'], ARRAY['Define product roadmap', 'Work with stakeholders', 'Analyze market trends'], 100000, 140000, 'Senior', ARRAY['Vision Insurance', 'Gym Membership', 'Professional Development'], 'Full-time'),
      ('UX Designer', 'Full-time', 'Montreal, QC', 'Create beautiful and intuitive user experiences', ARRAY['3+ years UX design experience', 'Proficiency in Figma', 'User research experience'], ARRAY['Design user interfaces', 'Conduct user research', 'Create prototypes'], 80000, 110000, 'Mid Level', ARRAY['Health Insurance', 'Remote Work', 'Stock Options'], 'Full-time'),
      ('QA Engineer', 'Full-time', 'Ottawa, ON', 'Ensure quality of our software products', ARRAY['2+ years QA experience', 'Automated testing experience', 'Agile methodology'], ARRAY['Develop test plans', 'Perform automated testing', 'Report bugs'], 70000, 90000, 'Mid Level', ARRAY['Dental Coverage', 'Flexible Hours', '401(k)'], 'Full-time')
  ) AS jobs(title, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  CROSS JOIN profiles WHERE profiles.email = 'will+employer3@clutchjobs.ca';

  -- Create jobs for HealthCare Plus
  INSERT INTO public.jobs (title, company_id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  SELECT
    title, profiles.id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule
  FROM (
    VALUES
      ('Medical Software Developer', 'Full-time', 'Toronto, ON', 'Develop software for healthcare applications', ARRAY['3+ years healthcare software experience', 'HIPAA compliance knowledge', 'Java expertise'], ARRAY['Develop medical software', 'Ensure compliance', 'Collaborate with healthcare professionals'], 90000, 130000, 'Mid Level', ARRAY['Health Insurance', 'Life Insurance', 'Performance Bonus'], 'Full-time'),
      ('Healthcare Data Analyst', 'Full-time', 'Vancouver, BC', 'Analyze healthcare data to improve patient outcomes', ARRAY['Statistics background', 'Healthcare experience', 'SQL proficiency'], ARRAY['Analyze patient data', 'Create reports', 'Make recommendations'], 75000, 95000, 'Mid Level', ARRAY['Dental Coverage', 'Vision Insurance', 'Remote Work'], 'Full-time'),
      ('Clinical Systems Manager', 'Full-time', 'Calgary, AB', 'Manage clinical information systems', ARRAY['5+ years healthcare IT experience', 'Project management skills', 'EMR knowledge'], ARRAY['Oversee system implementations', 'Train staff', 'Manage vendors'], 100000, 140000, 'Senior', ARRAY['Health Insurance', 'Stock Options', 'Professional Development'], 'Full-time'),
      ('Healthcare IT Support', 'Full-time', 'Edmonton, AB', 'Provide technical support for healthcare systems', ARRAY['2+ years IT support experience', 'Healthcare background', 'Customer service skills'], ARRAY['Resolve technical issues', 'Support medical staff', 'Maintain documentation'], 60000, 80000, 'Entry Level', ARRAY['Dental Coverage', 'Flexible Hours', '401(k)'], 'Full-time'),
      ('Medical Device Technician', 'Full-time', 'Winnipeg, MB', 'Maintain and repair medical devices', ARRAY['Medical device certification', 'Technical skills', 'Problem-solving ability'], ARRAY['Repair equipment', 'Perform maintenance', 'Train users'], 65000, 85000, 'Mid Level', ARRAY['Health Insurance', 'Life Insurance', 'Performance Bonus'], 'Full-time')
  ) AS jobs(title, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  CROSS JOIN profiles WHERE profiles.email = 'will+employer4@clutchjobs.ca';

  -- Create jobs for EduTech Innovations
  INSERT INTO public.jobs (title, company_id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  SELECT
    title, profiles.id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule
  FROM (
    VALUES
      ('Educational Content Developer', 'Full-time', 'Toronto, ON', 'Create engaging educational content', ARRAY['Teaching experience', 'Content creation skills', 'EdTech knowledge'], ARRAY['Develop curriculum', 'Create content', 'Assess learning outcomes'], 70000, 90000, 'Mid Level', ARRAY['Health Insurance', 'Remote Work', 'Professional Development'], 'Full-time'),
      ('Learning Platform Engineer', 'Full-time', 'Vancouver, BC', 'Build and maintain our learning management system', ARRAY['3+ years software development', 'EdTech experience', 'Full-stack skills'], ARRAY['Develop platform features', 'Optimize performance', 'Fix bugs'], 85000, 120000, 'Mid Level', ARRAY['Dental Coverage', 'Vision Insurance', 'Stock Options'], 'Full-time'),
      ('Instructional Designer', 'Full-time', 'Montreal, QC', 'Design effective learning experiences', ARRAY['Instructional design certification', 'E-learning experience', 'Creative skills'], ARRAY['Design courses', 'Create assessments', 'Evaluate effectiveness'], 75000, 95000, 'Mid Level', ARRAY['Health Insurance', 'Flexible Hours', '401(k)'], 'Full-time'),
      ('Education Technology Specialist', 'Full-time', 'Ottawa, ON', 'Support implementation of educational technology', ARRAY['EdTech experience', 'Teaching background', 'Technical skills'], ARRAY['Train teachers', 'Implement solutions', 'Provide support'], 65000, 85000, 'Entry Level', ARRAY['Dental Coverage', 'Professional Development', 'Remote Work'], 'Full-time'),
      ('Learning Analytics Manager', 'Full-time', 'Calgary, AB', 'Drive data-informed decisions in education', ARRAY['Data analysis skills', 'Education background', 'Leadership experience'], ARRAY['Analyze learning data', 'Create reports', 'Make recommendations'], 90000, 120000, 'Senior', ARRAY['Health Insurance', 'Stock Options', 'Performance Bonus'], 'Full-time')
  ) AS jobs(title, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  CROSS JOIN profiles WHERE profiles.email = 'will+employer5@clutchjobs.ca';

  -- Create jobs for FinServe Global
  INSERT INTO public.jobs (title, company_id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  SELECT
    title, profiles.id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule
  FROM (
    VALUES
      ('Financial Software Developer', 'Full-time', 'Toronto, ON', 'Build innovative financial software solutions', ARRAY['5+ years software development', 'Financial sector experience', 'Security expertise'], ARRAY['Develop trading platforms', 'Implement security measures', 'Optimize performance'], 110000, 150000, 'Senior', ARRAY['Health Insurance', 'Stock Options', 'Performance Bonus'], 'Full-time'),
      ('Risk Analyst', 'Full-time', 'Vancouver, BC', 'Analyze and manage financial risks', ARRAY['Risk management experience', 'Financial modeling skills', 'CFA preferred'], ARRAY['Assess risks', 'Create models', 'Make recommendations'], 85000, 120000, 'Mid Level', ARRAY['Dental Coverage', 'Life Insurance', '401(k)'], 'Full-time'),
      ('Compliance Officer', 'Full-time', 'Montreal, QC', 'Ensure regulatory compliance', ARRAY['3+ years compliance experience', 'Financial regulations knowledge', 'Attention to detail'], ARRAY['Monitor compliance', 'Conduct audits', 'Update policies'], 90000, 130000, 'Mid Level', ARRAY['Health Insurance', 'Professional Development', 'Remote Work'], 'Full-time'),
      ('Financial Data Engineer', 'Full-time', 'Ottawa, ON', 'Build and maintain financial data systems', ARRAY['Data engineering experience', 'Financial background', 'Python expertise'], ARRAY['Design data architecture', 'Implement pipelines', 'Ensure data quality'], 95000, 135000, 'Senior', ARRAY['Vision Insurance', 'Stock Options', 'Flexible Hours'], 'Full-time'),
      ('Investment Platform Manager', 'Full-time', 'Calgary, AB', 'Manage our investment platform', ARRAY['5+ years fintech experience', 'Product management skills', 'MBA preferred'], ARRAY['Define roadmap', 'Manage stakeholders', 'Drive growth'], 120000, 160000, 'Senior', ARRAY['Health Insurance', 'Performance Bonus', 'Professional Development'], 'Full-time')
  ) AS jobs(title, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  CROSS JOIN profiles WHERE profiles.email = 'will+employer6@clutchjobs.ca';

  -- Create jobs for GreenEnergy Solutions
  INSERT INTO public.jobs (title, company_id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  SELECT
    title, profiles.id, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule
  FROM (
    VALUES
      ('Renewable Energy Engineer', 'Full-time', 'Toronto, ON', 'Design renewable energy systems', ARRAY['Renewable energy experience', 'Engineering degree', 'Project management skills'], ARRAY['Design systems', 'Manage projects', 'Ensure compliance'], 95000, 135000, 'Senior', ARRAY['Health Insurance', 'Stock Options', 'Professional Development'], 'Full-time'),
      ('Energy Data Analyst', 'Full-time', 'Vancouver, BC', 'Analyze energy consumption data', ARRAY['Data analysis skills', 'Energy sector experience', 'Python proficiency'], ARRAY['Analyze data', 'Create reports', 'Make recommendations'], 75000, 95000, 'Mid Level', ARRAY['Dental Coverage', 'Remote Work', '401(k)'], 'Full-time'),
      ('Sustainability Consultant', 'Full-time', 'Montreal, QC', 'Help clients achieve sustainability goals', ARRAY['Sustainability certification', 'Consulting experience', 'Communication skills'], ARRAY['Advise clients', 'Develop strategies', 'Track progress'], 80000, 110000, 'Mid Level', ARRAY['Vision Insurance', 'Flexible Hours', 'Performance Bonus'], 'Full-time'),
      ('Solar Project Manager', 'Full-time', 'Calgary, AB', 'Manage solar energy projects', ARRAY['Solar industry experience', 'PMP certification', 'Technical background'], ARRAY['Manage installations', 'Coordinate teams', 'Ensure quality'], 90000, 120000, 'Senior', ARRAY['Health Insurance', 'Life Insurance', 'Stock Options'], 'Full-time'),
      ('Energy Software Developer', 'Full-time', 'Ottawa, ON', 'Develop energy management software', ARRAY['3+ years software development', 'Energy sector knowledge', 'Full-stack skills'], ARRAY['Develop applications', 'Implement features', 'Fix bugs'], 85000, 115000, 'Mid Level', ARRAY['Dental Coverage', 'Professional Development', 'Remote Work'], 'Full-time')
  ) AS jobs(title, type, location, overview, requirements, responsibilities, salary_min, salary_max, experience_level, benefits, work_schedule)
  CROSS JOIN profiles WHERE profiles.email = 'will+employer7@clutchjobs.ca';
END $$;