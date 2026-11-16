"""Generates demo_catalog.sql: fictional instructors, a fuller course catalog and blog posts.

Run: python3 supabase/demo/build_demo_catalog.py  (writes demo_catalog.sql next to this file)
Everything it creates belongs to instructors whose email ends in @demo.skillriseacademy.org,
so demo_catalog_cleanup.sql can remove it all again.
"""
import json
from pathlib import Path

DOMAIN = 'demo.skillriseacademy.org'

INSTRUCTORS = [
    ('sara.ahmadi', 'Sara Ahmadi', 'AI product lead and prompt engineering trainer', 'Sara has spent eight years building AI-powered products and now teaches teams how to work alongside AI assistants safely and productively.'),
    ('daniel.okafor', 'Daniel Okafor', 'Brand designer, 10+ years in agencies', 'Daniel has designed identities for startups, NGOs and global brands. He loves turning design theory into simple habits anyone can learn.'),
    ('maryam.karimi', 'Maryam Karimi', 'Growth marketer and Meta-certified trainer', 'Maryam has run campaigns for e-commerce brands across the Middle East and Europe and mentors small businesses on digital growth.'),
    ('lucas.moreau', 'Lucas Moreau', 'Video producer and YouTube educator', 'Lucas produces documentary and educational video. His own channel teaches mobile filmmaking to over 200,000 subscribers.'),
    ('amina.yusuf', 'Amina Yusuf', 'Investigative journalist and media trainer', 'Amina has reported for international outlets for 12 years and trains newsrooms in verification and digital storytelling.'),
    ('omid.rahimi', 'Omid Rahimi', 'IT instructor and Microsoft Certified Trainer', 'Omid has taught computer skills to thousands of adult learners and helps people move into office and remote jobs with confidence.'),
]

# (slug, title, subtitle, category, level, featured, instructor index, days since published, language,
#  description, outcomes, requirements, modules[(title, [(lesson, minutes)])], quiz or None, assignment or None)
COURSES = [
    ('generative-ai-for-everyone', 'Generative AI for Everyone', 'Understand what generative AI can and cannot do, and use it at work this week.', 'ai', 'beginner', True, 0, 4, 'English',
     'A friendly, non-technical introduction to generative AI. You will learn how tools like ChatGPT, Claude and Gemini work, where they help most, and how to use them responsibly in your job, studies or business.',
     ['Explain how generative AI works in plain language', 'Choose the right AI tool for writing, images and research', 'Use AI to save hours on everyday work tasks', 'Recognise risks such as bias, privacy leaks and made-up facts'],
     ['No technical background needed', 'A computer or phone with internet access'],
     [('What is generative AI?', [('A short history of AI', 9), ('How large language models work', 12), ('Text, image and audio generators', 10)]),
      ('Using AI at work', [('Writing and editing with AI', 14), ('Research and summarising', 11), ('Planning and brainstorming', 8)]),
      ('Responsible AI', [('Bias and fairness', 10), ('Privacy and confidential data', 9), ('Checking facts before you share', 7)])],
     ('Generative AI basics', [('What does a large language model predict?', ['The next word', 'The weather', 'Stock prices', 'Your password'], 0), ('Which output should you always verify?', ['A brainstormed list', 'Statistics and quotes', 'A headline idea', 'An email greeting'], 1)]),
     None),
    ('ai-automation-no-code', 'AI Automation with No-Code Tools', 'Connect AI to your apps and automate repetitive work without writing code.', 'ai', 'intermediate', False, 0, 18, 'English',
     'Build real automations that draft replies, sort documents and update spreadsheets using no-code platforms and AI models.',
     ['Map a manual process into automatable steps', 'Build multi-step automations with triggers and actions', 'Add AI steps for classifying and drafting text', 'Monitor and fix automations when they fail'],
     ['Comfort using web apps and spreadsheets', 'Completion of an AI basics course is helpful'],
     [('Thinking in workflows', [('Finding tasks worth automating', 10), ('Triggers, actions and filters', 13)]),
      ('Your first automations', [('Email to spreadsheet', 15), ('Auto-sorting form responses', 14), ('Scheduled reports', 12)]),
      ('Adding AI', [('Classifying messages with AI', 16), ('Drafting replies for review', 13), ('Keeping a human in the loop', 9)])],
     None,
     ('Automate one real task', 'Pick a repetitive task from your work or studies, build an automation for it and share a screenshot of each step with a short explanation.')),
    ('brand-identity-design', 'Brand Identity Design', 'Create a logo, colour palette and style guide for a real brand.', 'graphic-design', 'intermediate', True, 1, 9, 'English',
     'Go from a client brief to a complete visual identity. You will research, sketch, refine a logo and package everything into a professional brand guide.',
     ['Run a discovery session and write a creative brief', 'Design logo concepts and refine the strongest one', 'Build colour and typography systems', 'Present a brand guide to a client'],
     ['Basic familiarity with any design tool', 'A notebook for sketching'],
     [('Research and strategy', [('Reading a client brief', 10), ('Moodboards and competitor research', 12)]),
      ('Logo design', [('Sketching 20 ideas fast', 14), ('From sketch to vector', 18), ('Testing at small sizes', 9)]),
      ('The brand system', [('Colour palettes that work', 12), ('Choosing typefaces', 11), ('Building the brand guide', 16)])],
     ('Identity check', [('What should come before sketching a logo?', ['Picking colours', 'Research and a brief', 'Printing business cards', 'Choosing a font'], 1), ('Why test a logo at small sizes?', ['To save ink', 'It must stay readable as an app icon or favicon', 'Clients prefer small logos', 'It is not needed'], 1)]),
     ('Design a mini brand', 'Create a logo, a 4-colour palette and a one-page style guide for a fictional café. Upload a PDF or image link.')),
    ('photoshop-fundamentals', 'Adobe Photoshop Fundamentals', 'Edit photos, remove backgrounds and design social graphics.', 'graphic-design', 'beginner', False, 1, 30, 'English',
     'Learn the Photoshop workspace step by step: layers, masks, selections and adjustments, then put them together in practical projects.',
     ['Navigate the Photoshop interface confidently', 'Use layers and masks non-destructively', 'Retouch and colour-correct photos', 'Export images for web and print'],
     ['Adobe Photoshop (free trial works)', 'A computer with at least 8 GB RAM'],
     [('Getting started', [('The workspace tour', 8), ('Layers explained', 12)]),
      ('Core editing', [('Selections and masks', 15), ('Adjustment layers', 13), ('Retouching basics', 14)]),
      ('Projects', [('Background removal', 11), ('Social media post', 13), ('Exporting correctly', 7)])],
     None, None),
    ('social-media-ads-meta', 'Social Media Advertising with Meta', 'Plan, launch and optimise Facebook and Instagram ad campaigns.', 'digital-marketing', 'intermediate', True, 2, 6, 'English',
     'Learn how to set up Meta Business Suite, define audiences, create ads that convert and read the results so every dollar works harder.',
     ['Set up Business Manager, pixels and ad accounts', 'Target the right audience with custom and lookalike audiences', 'Write ad copy and creatives that convert', 'Read reports and optimise campaigns'],
     ['A Facebook account', 'Basic social media knowledge'],
     [('Foundations', [('How the ad auction works', 10), ('Setting up Business Manager', 12)]),
      ('Building campaigns', [('Objectives and budgets', 11), ('Audiences that convert', 15), ('Creative that stops the scroll', 13)]),
      ('Optimising', [('Reading the reports', 12), ('A/B testing', 10), ('Scaling winners', 9)])],
     ('Ads check-in', [('Which audience type finds people similar to your customers?', ['Saved audience', 'Lookalike audience', 'Broad audience', 'Page likes'], 1), ('What is an A/B test?', ['Running two versions to compare results', 'Paying twice', 'Boosting a post', 'Deleting old ads'], 0)]),
     ('Plan a campaign', 'Write a one-page campaign plan for a local business: objective, audience, budget, two ad variations and how you will measure success.')),
    ('seo-fundamentals', 'SEO Fundamentals', 'Help your website rank on Google with keyword research and on-page SEO.', 'digital-marketing', 'beginner', False, 2, 25, 'English',
     'Learn how search engines work and how to make your pages easy to find, from keyword research to technical basics and link building.',
     ['Explain how search engines crawl and rank pages', 'Find keywords people actually search for', 'Optimise titles, headings and content', 'Track rankings with free tools'],
     ['A website or blog is helpful but not required'],
     [('How search works', [('Crawling, indexing, ranking', 10), ('Search intent', 9)]),
      ('Keyword research', [('Finding keyword ideas', 13), ('Judging difficulty', 11)]),
      ('On-page and technical SEO', [('Titles and meta descriptions', 10), ('Content that ranks', 14), ('Site speed and mobile', 9), ('Google Search Console', 12)])],
     None, None),
    ('email-marketing-masterclass', 'Email Marketing That Converts', 'Grow a list and write emails people actually open.', 'digital-marketing', 'all_levels', False, 2, 52, 'English',
     'Build an email list from zero, write welcome sequences and newsletters, and use automation to turn subscribers into customers.',
     ['Create lead magnets and sign-up forms', 'Write subject lines with high open rates', 'Build automated welcome sequences', 'Measure opens, clicks and revenue'],
     ['A free account on any email platform'],
     [('Growing your list', [('Lead magnets', 10), ('Forms and landing pages', 11)]),
      ('Writing emails', [('Subject lines', 9), ('Newsletter structure', 12)]),
      ('Automation', [('Welcome sequences', 13), ('Segmentation', 10)])],
     None, None),
    ('youtube-content-creation', 'YouTube Content Creation', 'Plan, film and edit videos that grow a channel.', 'content-creation', 'beginner', True, 3, 2, 'English',
     'From channel idea to published video: learn scripting, filming with a phone, editing and the YouTube algorithm basics that help new creators get discovered.',
     ['Find a channel niche and plan a content calendar', 'Script and film videos with a smartphone', 'Edit with free software', 'Write titles and thumbnails that get clicks'],
     ['A smartphone', 'A free video editor such as CapCut or DaVinci Resolve'],
     [('Planning', [('Finding your niche', 9), ('Scripting a video', 12)]),
      ('Filming', [('Light and sound on a budget', 14), ('Framing and b-roll', 11)]),
      ('Publishing', [('Editing workflow', 16), ('Titles and thumbnails', 10), ('Understanding analytics', 12)])],
     ('Creator quiz', [('What usually matters most for a click?', ['Video length', 'Title and thumbnail', 'Upload time', 'Number of tags'], 1), ('What is b-roll?', ['Background music', 'Extra footage that supports the story', 'A camera brand', 'The final export'], 1)]),
     ('Publish your first short', 'Film and edit a 60-second video on a topic you know well. Share the link and one thing you would improve next time.')),
    ('podcasting-from-scratch', 'Podcasting from Scratch', 'Launch a podcast with simple gear and a clear format.', 'content-creation', 'beginner', False, 3, 40, 'English',
     'Everything you need to launch a podcast: format, gear, recording, editing and distribution to Spotify and Apple Podcasts.',
     ['Choose a podcast format and audience', 'Record clean audio at home', 'Edit episodes with free tools', 'Publish to major platforms'],
     ['A USB microphone or a good headset'],
     [('Planning a show', [('Formats that work', 9), ('Naming and artwork', 8)]),
      ('Recording and editing', [('Room setup', 10), ('Recording remote guests', 12), ('Editing in Audacity', 15)]),
      ('Launch', [('Hosting and RSS', 9), ('Growing listeners', 11)])],
     None, None),
    ('fact-checking-verification', 'Fact-Checking and Digital Verification', 'Verify images, videos and claims before you publish.', 'journalism', 'intermediate', True, 4, 12, 'English',
     'Learn the techniques professional fact-checkers use: reverse image search, geolocation, source tracing and spotting manipulated media.',
     ['Trace a claim back to its original source', 'Use reverse image and video search', 'Geolocate photos with maps and landmarks', 'Write clear, fair fact-check reports'],
     ['Basic web browsing skills'],
     [('The verification mindset', [('Why misinformation spreads', 9), ('Lateral reading', 11)]),
      ('Tools and techniques', [('Reverse image search', 13), ('Geolocation basics', 15), ('Spotting AI-generated media', 12)]),
      ('Publishing', [('Rating claims fairly', 10), ('Writing the fact-check', 12)])],
     ('Verification quiz', [('What is lateral reading?', ['Reading a page very slowly', 'Checking what other sources say about a source', 'Reading only headlines', 'Translating an article'], 1), ('A viral photo claims to show today\'s flood. First step?', ['Share it with a warning', 'Run a reverse image search', 'Ask the poster', 'Ignore it'], 1)]),
     None),
    ('mobile-journalism', 'Mobile Journalism (MoJo)', 'Report, film and publish news stories with just a smartphone.', 'journalism', 'beginner', False, 4, 60, 'English',
     'Learn to tell compelling news stories entirely on your phone: interviews, sequences, editing and publishing for social platforms.',
     ['Plan a news story for mobile', 'Film interviews and sequences', 'Edit on your phone', 'Publish for social audiences'],
     ['A smartphone with at least 10 GB free space'],
     [('Story planning', [('What makes news', 9), ('Planning shots', 10)]),
      ('Filming', [('Interviews', 13), ('Five-shot sequences', 11)]),
      ('Editing and publishing', [('Mobile editing apps', 14), ('Captions and formats', 9)])],
     None, None),
    ('excel-for-beginners', 'Microsoft Excel for Beginners', 'Build spreadsheets, formulas and charts with confidence.', 'computer-skills', 'beginner', True, 5, 7, 'English',
     'Start from a blank sheet and finish able to organise data, write formulas, create charts and build simple reports used in almost every office job.',
     ['Enter, format and organise data', 'Write formulas with SUM, AVERAGE, IF and VLOOKUP', 'Create clear charts', 'Sort, filter and summarise with PivotTables'],
     ['Microsoft Excel or Google Sheets'],
     [('Spreadsheet basics', [('The Excel interface', 8), ('Entering and formatting data', 12)]),
      ('Formulas', [('Your first formulas', 13), ('IF and logical tests', 14), ('VLOOKUP and XLOOKUP', 16)]),
      ('Analysing data', [('Sorting and filtering', 10), ('Charts', 12), ('PivotTables', 17)])],
     ('Excel quiz', [('Which function adds a range of cells?', ['COUNT', 'SUM', 'IF', 'LOOKUP'], 1), ('What does a PivotTable do?', ['Rotates a chart', 'Summarises data by groups', 'Protects a sheet', 'Prints a report'], 1)]),
     ('Build a monthly budget', 'Create a budget sheet with income, expenses, totals using formulas and one chart. Share the file link.')),
    ('digital-literacy-essentials', 'Digital Literacy Essentials', 'Use computers, email and the internet safely and confidently.', 'computer-skills', 'beginner', False, 5, 70, 'English',
     'A patient, step-by-step course for anyone new to computers: files and folders, email, video calls and staying safe online.',
     ['Manage files and folders', 'Send emails with attachments', 'Join and host video calls', 'Protect yourself from scams'],
     ['Access to a computer'],
     [('Computer basics', [('Mouse, keyboard and windows', 10), ('Files and folders', 12)]),
      ('Communication', [('Email essentials', 11), ('Video calls', 9)]),
      ('Online safety', [('Strong passwords', 8), ('Spotting scams', 10)])],
     None, None),
    ('ielts-preparation', 'IELTS Preparation: Band 7 Strategies', 'Strategies for all four IELTS sections with practice tasks.', 'english', 'advanced', True, 5, 15, 'English',
     'A focused programme for the Academic and General IELTS exam: question types, time management and model answers for Listening, Reading, Writing and Speaking.',
     ['Understand every IELTS question type', 'Manage time in Reading and Listening', 'Write Task 1 and Task 2 essays that score well', 'Speak fluently in all three Speaking parts'],
     ['Upper-intermediate English (B2) or above'],
     [('Listening and Reading', [('Question types', 12), ('Skimming and scanning', 13), ('Time management', 9)]),
      ('Writing', [('Task 1 reports', 16), ('Task 2 essays', 18)]),
      ('Speaking', [('Parts 1 and 2', 12), ('Part 3 discussion', 11)])],
     ('IELTS strategy check', [('What is scanning?', ['Reading every word', 'Looking quickly for specific information', 'Reading the conclusion only', 'Translating the text'], 1), ('How long should a Task 2 essay be?', ['At least 150 words', 'At least 250 words', 'Exactly 100 words', 'No limit'], 1)]),
     ('Write a Task 2 essay', 'Write a 250-word essay on: "Some people think university should be free for everyone. To what extent do you agree?"')),
    ('business-english-communication', 'Business English Communication', 'Write emails, lead meetings and present in English at work.', 'english', 'intermediate', False, 0, 35, 'English',
     'Practical English for the workplace: professional emails, meetings, negotiations and presentations, with useful phrases and real examples.',
     ['Write clear, polite business emails', 'Participate confidently in meetings', 'Give structured presentations', 'Negotiate with useful phrases'],
     ['Intermediate English (B1) or above'],
     [('Writing at work', [('Email structure and tone', 11), ('Requests and follow-ups', 10)]),
      ('Speaking at work', [('Meetings', 12), ('Small talk', 8)]),
      ('Presenting', [('Structuring a presentation', 13), ('Handling questions', 10)])],
     None, None),
    ('amazon-fba-launch', 'Launch Your Amazon FBA Business', 'Find a product, source it and launch your first listing.', 'amazon', 'beginner', True, 2, 10, 'English',
     'A step-by-step guide to starting on Amazon FBA: product research, supplier sourcing, listing optimisation and your first launch campaign.',
     ['Research profitable product ideas', 'Find and vet suppliers', 'Create an optimised product listing', 'Plan a launch with Amazon PPC'],
     ['A starting budget for inventory is required to launch'],
     [('Product research', [('How FBA works', 10), ('Finding product ideas', 14), ('Calculating profit', 12)]),
      ('Sourcing', [('Working with suppliers', 13), ('Samples and quality', 10)]),
      ('Listing and launch', [('Writing the listing', 14), ('Photos that sell', 9), ('Amazon PPC basics', 15)])],
     ('FBA basics', [('What does FBA stand for?', ['Fast Buying Access', 'Fulfilled by Amazon', 'Free Business Account', 'Final Buyer Approval'], 1), ('Why order samples before bulk stock?', ['To check quality', 'They are free', 'Amazon requires it', 'To get reviews'], 0)]),
     None),
    ('shopify-store-setup', 'Build an Online Store with Shopify', 'Set up, design and launch an online shop in a weekend.', 'amazon', 'beginner', False, 2, 45, 'English',
     'Create a professional online store: themes, products, payments, shipping and the marketing basics that bring your first customers.',
     ['Set up a Shopify store and theme', 'Add products with great descriptions', 'Configure payments and shipping', 'Get your first sales'],
     ['A Shopify free trial'],
     [('Store setup', [('Choosing a theme', 9), ('Pages and navigation', 11)]),
      ('Products', [('Product pages that sell', 13), ('Collections', 8)]),
      ('Launch', [('Payments and shipping', 12), ('Your first marketing push', 11)])],
     None, None),
    ('watercolour-painting-basics', 'Watercolour Painting for Beginners', 'Learn washes, colour mixing and simple landscapes.', 'painting', 'beginner', False, 1, 20, 'English',
     'A relaxing introduction to watercolour: materials, brush control, washes and colour mixing, building up to your first landscape paintings.',
     ['Choose affordable materials', 'Control water and pigment', 'Mix a harmonious palette', 'Paint simple landscapes'],
     ['Watercolour paints, brushes and paper (a starter set is fine)'],
     [('Materials and techniques', [('Paper, paint and brushes', 9), ('Flat and graded washes', 13)]),
      ('Colour', [('Colour mixing', 12), ('Light and shadow', 11)]),
      ('Projects', [('Sky and sea', 15), ('A tree-lined path', 16)])],
     None,
     ('Paint a landscape', 'Paint a small landscape using at least two washes. Upload a photo and describe the colours you mixed.')),
    ('upwork-freelancing-success', 'Freelancing Success on Upwork and Fiverr', 'Create a winning profile and land your first paying clients.', 'freelancing', 'beginner', True, 3, 1, 'English',
     'Turn a skill into income: choose a niche, build a profile that converts, write proposals clients reply to and deliver work that earns 5-star reviews.',
     ['Pick a profitable freelance niche', 'Build a high-converting profile and portfolio', 'Write proposals that win jobs', 'Manage clients and get repeat work'],
     ['A skill you can offer (writing, design, data entry, etc.)'],
     [('Getting started', [('Choosing your niche', 10), ('Profile and portfolio', 14)]),
      ('Winning work', [('Writing proposals', 13), ('Pricing your services', 11)]),
      ('Growing', [('Delivering and reviews', 10), ('Turning clients into repeat clients', 9)])],
     ('Freelancing check', [('What should a proposal open with?', ['Your hourly rate', 'Proof you understood the job', 'Your life story', 'A discount'], 1), ('Where should payments stay?', ['Outside the platform', 'On the platform', 'In cash', 'Gift cards'], 1)]),
     None),
    ('fa-intro-ai-tools', 'آشنایی با ابزارهای هوش مصنوعی', 'از ابزارهای هوش مصنوعی برای نوشتن، تحقیق و کارهای روزمره استفاده کنید.', 'ai', 'beginner', False, 0, 3, 'فارسی',
     'در این دوره با ابزارهای پرکاربرد هوش مصنوعی آشنا می‌شوید و یاد می‌گیرید چگونه از آن‌ها برای نوشتن متن، خلاصه‌سازی و برنامه‌ریزی کارها استفاده کنید.',
     ['شناخت ابزارهای اصلی هوش مصنوعی', 'نوشتن پرامپت‌های دقیق', 'استفادهٔ امن از هوش مصنوعی', 'صرفه‌جویی در زمان کارهای روزانه'],
     ['بدون نیاز به دانش فنی'],
     [('مبانی', [('هوش مصنوعی چیست؟', 9), ('ابزارهای محبوب', 11)]),
      ('کاربردها', [('نوشتن و ویرایش', 12), ('خلاصه‌سازی و تحقیق', 10)]),
      ('استفادهٔ مسئولانه', [('حریم خصوصی', 8), ('بررسی درستی اطلاعات', 9)])],
     None, None),
    ('fa-canva-design', 'طراحی پست‌های شبکه‌های اجتماعی با Canva', 'پست و استوری حرفه‌ای برای اینستاگرام طراحی کنید.', 'graphic-design', 'beginner', False, 1, 14, 'فارسی',
     'با اصول ساده‌ی طراحی و ابزار رایگان Canva، پست‌ها و استوری‌هایی جذاب برای کسب‌وکار یا صفحه‌ی شخصی خود بسازید.',
     ['آشنایی با محیط Canva', 'اصول رنگ و تایپوگرافی', 'طراحی پست و استوری', 'خروجی گرفتن با کیفیت مناسب'],
     ['یک حساب رایگان Canva'],
     [('شروع کار', [('آشنایی با Canva', 8), ('قالب‌ها', 9)]),
      ('اصول طراحی', [('رنگ', 10), ('فونت فارسی', 11)]),
      ('پروژه', [('طراحی پست', 13), ('طراحی استوری', 12)])],
     None, None),
]

POSTS = [
    (0, 'how-to-write-better-ai-prompts', '5 Ways to Write Better AI Prompts Today', 'Small changes to how you ask can double the quality of what AI gives back.', ['AI', 'Productivity'], 3,
     'Most disappointing AI answers come from vague questions. Here are five habits that fix that.\n\n## 1. Give it a role\n\nTell the assistant who it should be: *"You are an experienced HR manager."*\n\n## 2. Share the context\n\nWho is the audience? What happened before? What constraints apply?\n\n## 3. Ask for a format\n\nBullet points, a table, under 100 words: say it.\n\n## 4. Iterate\n\nTreat the first answer as a draft and steer it.\n\n## 5. Verify\n\nCheck facts, numbers and quotes before you use them.'),
    (5, 'excel-skills-employers-want', 'The Excel Skills Employers Actually Look For', 'You do not need to know everything. These six skills cover most office jobs.', ['Careers', 'Excel'], 8,
     'Job ads often say "advanced Excel", but most roles need a short list of skills.\n\n- Clean data entry and formatting\n- SUM, AVERAGE, COUNTIF\n- IF statements\n- XLOOKUP or VLOOKUP\n- Charts\n- PivotTables\n\nLearn these well and you will handle the majority of spreadsheet tasks at work.'),
    (3, 'first-freelance-client-guide', 'How I Landed My First Freelance Client in 30 Days', 'A practical, honest plan for getting started on freelance platforms.', ['Freelancing'], 13,
     'Your first client is the hardest. Here is the plan that worked for me.\n\n## Week 1: pick a narrow niche\n\n"Instagram posts for cafés" beats "graphic design".\n\n## Week 2: build three portfolio pieces\n\nMake them for imaginary clients if you have to.\n\n## Weeks 3 and 4: send five tailored proposals a day\n\nOpen with the client\'s problem, not your biography.'),
    (4, 'spot-fake-images-online', 'How to Spot a Fake Image in Under a Minute', 'Three quick checks that catch most manipulated or recycled photos.', ['Journalism', 'Media literacy'], 21,
     'Before you share a dramatic photo, run these checks.\n\n1. **Reverse image search** it to see where it appeared first.\n2. **Look for clues**: signs, weather, shadows and language.\n3. **Check the source**: who posted it first, and are they reliable?\n\nMost viral fakes are real photos from a different time or place.'),
]


def lesson_md(lesson, module, course, outcomes, i, lang):
    if lang == 'فارسی':
        return f'## {lesson}\n\nاین درس بخشی از «{module}» در دورهٔ «{course}» است.\n\n### نکات کلیدی\n\n- {outcomes[i % len(outcomes)]}\n- تمرین کنید و سؤال‌هایتان را بپرسید.'
    return (f'## {lesson}\n\nThis lesson is part of **{module}** in *{course}*.\n\n### Key ideas\n\n'
            f'- {outcomes[i % len(outcomes)]}\n- Practical examples you can reuse straight away\n\n'
            f'> **Practice:** pause the lesson and try the technique on your own work before moving on.')


def build():
    data = []
    for (slug, title, subtitle, cat, level, featured, ins, days, lang, desc, outcomes, reqs, modules, quiz, assignment) in COURSES:
        n = 0
        mods = []
        for mi, (mtitle, lessons) in enumerate(modules):
            ls = []
            for (ltitle, minutes) in lessons:
                ls.append({'title': ltitle, 'minutes': minutes, 'preview': n == 0, 'content': lesson_md(ltitle, mtitle, title, outcomes, n, lang)})
                n += 1
            m = {'title': mtitle, 'lessons': ls}
            if quiz and mi == len(modules) - 1:
                m['quiz'] = {'title': quiz[0], 'questions': [{'q': q, 'options': o, 'correct': c} for q, o, c in quiz[1]]}
            mods.append(m)
        data.append({
            'slug': slug, 'title': title, 'subtitle': subtitle, 'description': desc, 'category': cat, 'level': level,
            'featured': featured, 'teacher': f'{INSTRUCTORS[ins][0]}@{DOMAIN}', 'days': days, 'language': lang,
            'outcomes': outcomes, 'requirements': reqs, 'modules': mods,
            'assignment': {'title': assignment[0], 'instructions': assignment[1]} if assignment else None,
        })
    posts = [{'author': f'{INSTRUCTORS[a][0]}@{DOMAIN}', 'slug': s, 'title': t, 'excerpt': e, 'tags': tags, 'days': d, 'content': c}
             for (a, s, t, e, tags, d, c) in POSTS]
    teachers = [{'email': f'{u}@{DOMAIN}', 'name': n, 'headline': h, 'bio': b} for (u, n, h, b) in INSTRUCTORS]
    return teachers, data, posts


SQL = """-- GENERATED by build_demo_catalog.py; edit that file instead.
-- Demo catalog: fictional instructors (no password, cannot sign in), courses and blog posts.
-- Safe to re-run: existing instructors, course slugs and post slugs are skipped.
-- Remove everything again with demo_catalog_cleanup.sql.
do $$
declare
  v_t jsonb; v_c jsonb; v_m jsonb; v_l jsonb; v_q jsonb; v_p jsonb;
  v_uid uuid; v_course_id uuid; v_module_id uuid; v_quiz_id uuid; v_question_id uuid;
  m_pos int; l_pos int; q_pos int;
begin
  for v_t in select * from jsonb_array_elements($json${teachers}$json$::jsonb) loop
    if not exists (select 1 from auth.users where email = v_t->>'email') then
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_t->>'email', '',
              '{{"provider": "email", "providers": ["email"]}}', jsonb_build_object('full_name', v_t->>'name'), now(), now());
    end if;
    update public.profiles set role = 'teacher', headline = v_t->>'headline', bio = v_t->>'bio'
    where id = (select id from auth.users where email = v_t->>'email');
  end loop;

  for v_c in select * from jsonb_array_elements($json${courses}$json$::jsonb) loop
    insert into public.courses (title, slug, subtitle, description, category_id, teacher_id, level, language, outcomes, requirements, status, featured, published_at, created_at)
    values (
      v_c->>'title', v_c->>'slug', v_c->>'subtitle', v_c->>'description',
      (select id from public.categories where slug = v_c->>'category'),
      (select id from auth.users where email = v_c->>'teacher'),
      (v_c->>'level')::public.course_level, v_c->>'language',
      array(select jsonb_array_elements_text(v_c->'outcomes')),
      array(select jsonb_array_elements_text(v_c->'requirements')),
      'published', (v_c->>'featured')::boolean,
      now() - make_interval(days => (v_c->>'days')::int), now() - make_interval(days => (v_c->>'days')::int + 7)
    )
    on conflict (slug) do nothing
    returning id into v_course_id;
    continue when v_course_id is null;

    m_pos := 0;
    for v_m in select * from jsonb_array_elements(v_c->'modules') loop
      insert into public.modules (course_id, title, position) values (v_course_id, v_m->>'title', m_pos) returning id into v_module_id;
      l_pos := 0;
      for v_l in select * from jsonb_array_elements(v_m->'lessons') loop
        insert into public.lessons (course_id, module_id, title, content, duration_minutes, is_preview, position)
        values (v_course_id, v_module_id, v_l->>'title', v_l->>'content', (v_l->>'minutes')::int, (v_l->>'preview')::boolean, l_pos);
        l_pos := l_pos + 1;
      end loop;
      if v_m ? 'quiz' then
        insert into public.quizzes (course_id, module_id, title, position) values (v_course_id, v_module_id, v_m->'quiz'->>'title', m_pos) returning id into v_quiz_id;
        q_pos := 0;
        for v_q in select * from jsonb_array_elements(v_m->'quiz'->'questions') loop
          insert into public.quiz_questions (quiz_id, question, options, position)
          values (v_quiz_id, v_q->>'q', array(select jsonb_array_elements_text(v_q->'options')), q_pos) returning id into v_question_id;
          insert into public.quiz_answer_keys (question_id, correct_index) values (v_question_id, (v_q->>'correct')::int);
          q_pos := q_pos + 1;
        end loop;
      end if;
      m_pos := m_pos + 1;
    end loop;

    if jsonb_typeof(v_c->'assignment') = 'object' then
      insert into public.assignments (course_id, title, instructions) values (v_course_id, v_c->'assignment'->>'title', v_c->'assignment'->>'instructions');
    end if;
  end loop;

  for v_p in select * from jsonb_array_elements($json${posts}$json$::jsonb) loop
    insert into public.blog_posts (author_id, title, slug, excerpt, content, tags, status, published_at)
    values ((select id from auth.users where email = v_p->>'author'), v_p->>'title', v_p->>'slug', v_p->>'excerpt', v_p->>'content',
            array(select jsonb_array_elements_text(v_p->'tags')), 'published', now() - make_interval(days => (v_p->>'days')::int))
    on conflict (slug) do nothing;
  end loop;
end $$;
"""

CLEANUP = f"""-- Removes everything demo_catalog.sql created: its instructors and, through
-- foreign-key cascades, their courses, modules, lessons, quizzes, assignments,
-- enrollments on those courses and blog posts.
delete from public.courses where teacher_id in (select id from auth.users where email like '%@{DOMAIN}');
delete from auth.users where email like '%@{DOMAIN}';
"""

if __name__ == '__main__':
    teachers, courses, posts = build()
    here = Path(__file__).parent
    dump = lambda v: json.dumps(v, ensure_ascii=False, indent=1)
    (here / 'demo_catalog.sql').write_text(SQL.format(teachers=dump(teachers), courses=dump(courses), posts=dump(posts)))
    (here / 'demo_catalog_cleanup.sql').write_text(CLEANUP)
    print(f'{len(teachers)} instructors, {len(courses)} courses, {len(posts)} posts')
