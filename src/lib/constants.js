// Mirrors supabase/migrations/*_seed_data.sql so the site looks complete before data loads.
export const DEFAULT_CATEGORIES = [
  { name: 'Artificial Intelligence', slug: 'ai', description: 'Use AI tools, prompt engineering and automation to work smarter.', icon: 'Sparkles', color: 'violet' },
  { name: 'Graphic Design', slug: 'graphic-design', description: 'Design logos, social posts and brand identities with professional tools.', icon: 'Palette', color: 'pink' },
  { name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, social media ads, email marketing and analytics.', icon: 'Megaphone', color: 'orange' },
  { name: 'Content Creation', slug: 'content-creation', description: 'Create engaging video, audio and written content for any platform.', icon: 'Clapperboard', color: 'red' },
  { name: 'Journalism', slug: 'journalism', description: 'Reporting, writing, fact-checking and digital storytelling.', icon: 'Newspaper', color: 'slate' },
  { name: 'Computer Skills', slug: 'computer-skills', description: 'From computer basics to Microsoft Office and Google Workspace.', icon: 'Monitor', color: 'blue' },
  { name: 'English Language', slug: 'english', description: 'Speak, write and present with confidence in English.', icon: 'Languages', color: 'emerald' },
  { name: 'Amazon & E-commerce', slug: 'amazon', description: 'Start and grow an online store on Amazon and beyond.', icon: 'ShoppingCart', color: 'amber' },
  { name: 'Painting & Art', slug: 'painting', description: 'Drawing, painting and fine-art fundamentals for every age.', icon: 'Brush', color: 'teal' },
  { name: 'Freelancing', slug: 'freelancing', description: 'Win clients and build an independent career online.', icon: 'Briefcase', color: 'cyan' },
]
