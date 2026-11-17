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

// Hero slide colour themes (home_slides.theme): card background plus the two decorative circles.
export const SLIDE_THEMES = {
  blue: { bg: 'bg-brand-600', a: 'bg-brand-500/60', b: 'bg-brand-800/60' },
  dark: { bg: 'bg-slate-950', a: 'bg-amber-400/15', b: 'bg-white/5' },
  green: { bg: 'bg-emerald-700', a: 'bg-emerald-500/50', b: 'bg-emerald-900/40' },
  violet: { bg: 'bg-violet-700', a: 'bg-violet-500/50', b: 'bg-violet-900/40' },
  orange: { bg: 'bg-orange-600', a: 'bg-orange-400/50', b: 'bg-orange-800/40' },
  rose: { bg: 'bg-rose-600', a: 'bg-rose-400/50', b: 'bg-rose-800/40' },
  teal: { bg: 'bg-teal-700', a: 'bg-teal-500/50', b: 'bg-teal-900/40' },
}

// Built-in artwork for hero slides (home_slides.art); an uploaded image replaces it.
export const SLIDE_ARTS = ['certificate', 'teacher', 'badge', 'heart', 'book', 'none']
