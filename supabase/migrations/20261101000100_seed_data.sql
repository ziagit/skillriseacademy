-- Default categories and site settings (safe to re-run).
insert into public.categories (name, slug, description, icon, color, sort_order) values
  ('Artificial Intelligence', 'ai', 'Use AI tools, prompt engineering and automation to work smarter.', 'Sparkles', 'violet', 1),
  ('Graphic Design', 'graphic-design', 'Design logos, social posts and brand identities with professional tools.', 'Palette', 'pink', 2),
  ('Digital Marketing', 'digital-marketing', 'SEO, social media ads, email marketing and analytics.', 'Megaphone', 'orange', 3),
  ('Content Creation', 'content-creation', 'Create engaging video, audio and written content for any platform.', 'Clapperboard', 'red', 4),
  ('Journalism', 'journalism', 'Reporting, writing, fact-checking and digital storytelling.', 'Newspaper', 'slate', 5),
  ('Computer Skills', 'computer-skills', 'From computer basics to Microsoft Office and Google Workspace.', 'Monitor', 'blue', 6),
  ('English Language', 'english', 'Speak, write and present with confidence in English.', 'Languages', 'emerald', 7),
  ('Amazon & E-commerce', 'amazon', 'Start and grow an online store on Amazon and beyond.', 'ShoppingCart', 'amber', 8),
  ('Painting & Art', 'painting', 'Drawing, painting and fine-art fundamentals for every age.', 'Brush', 'teal', 9),
  ('Freelancing', 'freelancing', 'Win clients and build an independent career online.', 'Briefcase', 'cyan', 10)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('site_name', 'SkillRise Academy'),
  ('tagline', 'Free skills for a better future'),
  ('contact_email', 'info@skillriseacademy.org'),
  ('contact_phone', ''),
  ('address', ''),
  ('donate_url', ''),
  ('donate_bank_details', ''),
  ('facebook_url', ''),
  ('instagram_url', ''),
  ('tiktok_url', ''),
  ('youtube_url', ''),
  ('linkedin_url', ''),
  ('x_url', ''),
  ('whatsapp_url', '')
on conflict (key) do nothing;
