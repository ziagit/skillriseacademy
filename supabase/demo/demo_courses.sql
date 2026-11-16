-- Demo courses for SkillRise Academy (not a migration; run by hand in the SQL editor).
-- Assigns every course to the first admin (or teacher) account and publishes it.
-- Safe to re-run: courses whose slug already exists are skipped.
do $$
declare
  v_teacher uuid;
  v_course jsonb;
  v_module jsonb;
  v_lesson jsonb;
  v_question jsonb;
  v_course_id uuid;
  v_module_id uuid;
  v_quiz_id uuid;
  v_question_id uuid;
  m_pos int;
  l_pos int;
  q_pos int;
begin
  select id into v_teacher from public.profiles where role = 'admin' order by created_at limit 1;
  if v_teacher is null then
    select id into v_teacher from public.profiles where role = 'teacher' order by created_at limit 1;
  end if;
  if v_teacher is null then
    raise exception 'Sign up and make yourself an admin or teacher before loading demo courses';
  end if;

  for v_course in select * from jsonb_array_elements($json$
[
  {
    "slug": "prompt-engineering-essentials",
    "title": "Prompt Engineering Essentials",
    "subtitle": "Get clear, useful answers from AI assistants every time.",
    "description": "AI assistants like ChatGPT, Claude and Gemini can draft emails, explain ideas and plan projects, but only if you ask well. This course teaches a simple, repeatable way to write prompts, check what comes back and fold AI into your daily work.",
    "category": "ai",
    "level": "beginner",
    "featured": true,
    "outcomes": ["Write clear prompts with role, task, context and format", "Improve weak answers by iterating instead of starting over", "Spot and check AI mistakes before you use the output", "Build reusable prompt templates for everyday tasks"],
    "requirements": ["A free account with any AI assistant", "No technical background needed"],
    "modules": [
      {
        "title": "How AI assistants think",
        "lessons": [
          {"title": "What a language model actually does", "minutes": 8, "preview": true, "content": "## Predicting the next word\n\nA language model is trained on a huge amount of text. When you type a prompt, it predicts the most likely helpful continuation, one word at a time.\n\nThat explains two things you will see often:\n\n- **It sounds confident even when it is wrong.** Fluent text is not the same as correct text.\n- **It follows your lead.** Vague questions get vague answers; specific questions get specific ones.\n\n> Treat the assistant like a fast, well-read intern: great at drafts, but you are the editor."},
          {"title": "Strengths, limits and safe use", "minutes": 7, "preview": false, "content": "## Where AI shines\n\n- Drafting and rewriting text\n- Summarising long documents\n- Brainstorming ideas and outlines\n- Explaining a topic at different levels\n\n## Where to be careful\n\n- Facts, numbers, dates and quotes: **always verify**\n- Legal, medical or financial decisions\n- Private data: never paste passwords, ID numbers or client secrets"}
        ]
      },
      {
        "title": "Writing better prompts",
        "lessons": [
          {"title": "The R-T-C-F formula", "minutes": 10, "preview": false, "content": "## Role, Task, Context, Format\n\n1. **Role**: who should the AI act as? *\"You are a friendly customer support agent.\"*\n2. **Task**: what exactly should it do? *\"Reply to this complaint.\"*\n3. **Context**: what does it need to know? *\"The order was 5 days late; we offer a 10% voucher.\"*\n4. **Format**: how should the answer look? *\"Under 120 words, warm tone, end with a question.\"*\n\n### Try it\n\nRewrite *\"write a post about our bakery\"* using all four parts and compare the results."},
          {"title": "Iterate, don't restart", "minutes": 8, "preview": false, "content": "## Treat it as a conversation\n\nThe first answer is a draft. Instead of deleting it, steer it:\n\n- *\"Make it shorter and more casual.\"*\n- *\"Give me three alternative headlines.\"*\n- *\"What assumptions did you make? List them.\"*\n\nAsking the model to **explain its reasoning** or **list its assumptions** is one of the quickest ways to catch mistakes."},
          {"title": "Building a prompt library", "minutes": 6, "preview": false, "content": "## Save what works\n\nKeep a simple document of prompts you reuse, with blanks to fill in:\n\n```\nYou are a [role]. Write a [type of text] for [audience]\nabout [topic]. Keep it under [N] words and use a [tone] tone.\n```\n\nA small library of 10 good templates will save you hours every month."}
        ],
        "quiz": {
          "title": "Prompting check-in",
          "questions": [
            {"q": "Which part of a prompt tells the AI how the answer should look?", "options": ["Role", "Task", "Context", "Format"], "correct": 3},
            {"q": "The AI gives a decent but too-long answer. What is the best next step?", "options": ["Start a brand new chat", "Ask it to shorten the answer", "Copy it as it is", "Switch to a different AI"], "correct": 1},
            {"q": "Which of these should you always verify yourself?", "options": ["Suggested headlines", "A brainstormed list of ideas", "Statistics and dates", "The tone of a draft"], "correct": 2}
          ]
        }
      }
    ]
  },
  {
    "slug": "canva-graphic-design-basics",
    "title": "Graphic Design Basics with Canva",
    "subtitle": "Design social posts, flyers and logos that look professional.",
    "description": "Learn the core rules of good design (contrast, alignment, spacing and colour) and put them into practice with Canva, a free browser-based tool. By the end you will have a small portfolio of real designs.",
    "category": "graphic-design",
    "level": "beginner",
    "featured": true,
    "outcomes": ["Apply contrast, alignment, repetition and proximity", "Pick fonts and colour palettes that work together", "Design a social post, a flyer and a simple logo", "Export files in the right format for print and web"],
    "requirements": ["A free Canva account", "A computer or tablet"],
    "modules": [
      {
        "title": "Design principles",
        "lessons": [
          {"title": "The four rules of good layout", "minutes": 9, "preview": true, "content": "## C.R.A.P. (yes, really)\n\n- **Contrast**: make important things look different (size, colour, weight).\n- **Repetition**: reuse colours, fonts and shapes so the design feels unified.\n- **Alignment**: every element should line up with something else.\n- **Proximity**: group related items; separate unrelated ones.\n\nLook at any poster you like and you will find all four at work."},
          {"title": "Fonts and colour", "minutes": 8, "preview": false, "content": "## Fonts\n\nUse **two fonts at most**: one for headings, one for body text. Pair a bold sans-serif heading with a simple, readable body font.\n\n## Colour\n\nStart with **one main colour, one accent and a neutral** (white, grey or near-black). Tools like Canva's palette generator can pull colours from a photo you like."}
        ]
      },
      {
        "title": "Hands-on with Canva",
        "lessons": [
          {"title": "Your first social media post", "minutes": 12, "preview": false, "content": "## Step by step\n\n1. Create a design and choose **Instagram Post (1080 × 1080)**.\n2. Pick a template, then **change at least the colours and fonts** so it is yours.\n3. Keep the headline under 8 words.\n4. Leave breathing room around the edges.\n5. Download as **PNG** for the sharpest result."},
          {"title": "Designing a simple logo", "minutes": 11, "preview": false, "content": "## Keep it simple\n\nA good logo works in **one colour** and at **small sizes**. Try this:\n\n- Write the brand name in a strong font.\n- Add one simple shape or icon.\n- Test it in black and white, then at 64 px wide.\n\nExport a transparent PNG (Canva Pro) or an SVG for the cleanest result."}
        ],
        "quiz": {
          "title": "Design principles quiz",
          "questions": [
            {"q": "Grouping related items close together is called…", "options": ["Contrast", "Proximity", "Repetition", "Alignment"], "correct": 1},
            {"q": "How many fonts should most designs use?", "options": ["One or two", "Three to four", "As many as you like", "Exactly five"], "correct": 0},
            {"q": "Which export format is best for a sharp social media graphic?", "options": ["JPG at low quality", "PNG", "DOCX", "MP3"], "correct": 1}
          ]
        }
      }
    ]
  },
  {
    "slug": "social-media-marketing-101",
    "title": "Social Media Marketing 101",
    "subtitle": "Grow an audience and turn followers into customers.",
    "description": "A practical introduction to marketing a small business or personal brand on Facebook, Instagram and TikTok. You will plan content, write captions that convert and read the numbers that matter.",
    "category": "digital-marketing",
    "level": "beginner",
    "featured": false,
    "outcomes": ["Define your audience and choose the right platforms", "Plan a month of content with a simple calendar", "Write captions with a clear call to action", "Read reach, engagement and click-through rates"],
    "requirements": ["A social media account for practice"],
    "modules": [
      {
        "title": "Strategy first",
        "lessons": [
          {"title": "Know your audience", "minutes": 8, "preview": true, "content": "## Build a simple persona\n\nAnswer these questions about your ideal customer:\n\n- How old are they, and where do they live?\n- What problem are they trying to solve?\n- Which apps do they open every day?\n- What would make them stop scrolling?\n\nEvery post you make should speak to this one person."},
          {"title": "A 30-day content calendar", "minutes": 10, "preview": false, "content": "## The 3-pillar method\n\nRotate between three types of posts:\n\n1. **Teach**: tips, how-tos, behind the scenes\n2. **Prove**: reviews, results, before-and-after\n3. **Sell**: offers, new products, clear calls to action\n\nAim for roughly 40% teach, 40% prove and 20% sell. Plan the month in a simple spreadsheet with columns for date, pillar, idea and status."}
        ]
      },
      {
        "title": "Creating and measuring",
        "lessons": [
          {"title": "Captions that convert", "minutes": 9, "preview": false, "content": "## Hook, value, action\n\n- **Hook**: the first line must earn the tap on *more*.\n- **Value**: one useful idea, story or tip.\n- **Action**: tell people exactly what to do next: *comment*, *save*, *click the link in bio*.\n\nKeep paragraphs to one or two lines; most people read on a phone."},
          {"title": "Metrics that matter", "minutes": 8, "preview": false, "content": "## Three numbers to watch\n\n| Metric | What it tells you |\n|---|---|\n| Reach | How many people saw the post |\n| Engagement rate | Likes, comments, shares and saves ÷ reach |\n| Click-through rate | Link clicks ÷ reach |\n\nCompare posts against **your own average**, not against big brands."}
        ],
        "quiz": {
          "title": "Marketing basics quiz",
          "questions": [
            {"q": "In the 3-pillar method, which pillar should get the smallest share of posts?", "options": ["Teach", "Prove", "Sell", "They should be equal"], "correct": 2},
            {"q": "Engagement rate is engagements divided by…", "options": ["Followers you gained", "Reach", "Money spent", "Number of posts"], "correct": 1},
            {"q": "What is the job of a caption's first line?", "options": ["List hashtags", "Hook the reader", "Show the price", "Thank followers"], "correct": 1}
          ]
        }
      }
    ]
  },
  {
    "slug": "everyday-english-conversation",
    "title": "Everyday English Conversation",
    "subtitle": "Speak naturally in daily situations, at work and online.",
    "description": "Build confidence speaking English in real situations: introducing yourself, small talk, asking for help and joining meetings. Each lesson gives you useful phrases and a short practice task.",
    "category": "english",
    "level": "beginner",
    "featured": true,
    "outcomes": ["Introduce yourself and make small talk", "Ask questions politely and ask people to repeat", "Take part in online meetings with confidence", "Write short, friendly messages and emails"],
    "requirements": ["Basic reading ability in English"],
    "modules": [
      {
        "title": "Meeting people",
        "lessons": [
          {"title": "Introducing yourself", "minutes": 7, "preview": true, "content": "## Useful phrases\n\n- *Hi, I'm Sara. Nice to meet you.*\n- *I'm from Kabul, but I live in Istanbul now.*\n- *I work as a designer. / I'm studying marketing.*\n- *What about you?*\n\n### Practice\n\nRecord a 30-second introduction on your phone. Listen back and note one thing to improve."},
          {"title": "Small talk that flows", "minutes": 8, "preview": false, "content": "## Keep the conversation going\n\nAsk **open questions** (they can't be answered with yes or no):\n\n- *How was your weekend?*\n- *What do you enjoy most about your job?*\n\nThen **react and follow up**: *Really? That sounds fun. How did you get into that?*"}
        ]
      },
      {
        "title": "English at work",
        "lessons": [
          {"title": "Polite requests and clarifying", "minutes": 8, "preview": false, "content": "## Softer is more polite\n\n| Direct | Polite |\n|---|---|\n| Send me the file. | Could you send me the file, please? |\n| What? | Sorry, could you say that again? |\n| I don't understand. | Could you explain that in another way? |\n\nIt is always fine to ask someone to repeat. Native speakers do it all the time."},
          {"title": "Speaking up in online meetings", "minutes": 9, "preview": false, "content": "## Phrases for meetings\n\n- **Joining in:** *Can I add something here?*\n- **Agreeing:** *I agree with Ali on that.*\n- **Disagreeing politely:** *I see your point, but I think…*\n- **Checking:** *Just to confirm, the deadline is Friday?*\n\nPrepare one point before every meeting so you have something ready to say."}
        ],
        "quiz": {
          "title": "Conversation quiz",
          "questions": [
            {"q": "Which question is open (not yes/no)?", "options": ["Do you like your job?", "Are you busy?", "What do you enjoy about your job?", "Is it raining?"], "correct": 2},
            {"q": "The most polite way to ask for a file is…", "options": ["Send me the file.", "File, please.", "Could you send me the file, please?", "I want the file now."], "correct": 2},
            {"q": "You didn't hear a colleague. What do you say?", "options": ["What?", "Sorry, could you say that again?", "Speak louder.", "Nothing"], "correct": 1}
          ]
        }
      }
    ]
  },
  {
    "slug": "computer-basics-and-office",
    "title": "Computer Basics & Microsoft Office",
    "subtitle": "From files and folders to Word and Excel with confidence.",
    "description": "Everything you need to use a computer comfortably for study and work: organising files, staying safe online, writing documents in Word and building simple spreadsheets in Excel.",
    "category": "computer-skills",
    "level": "beginner",
    "featured": false,
    "outcomes": ["Organise files and folders and find them again", "Recognise scams and keep your accounts safe", "Format a professional document in Word", "Use basic formulas and charts in Excel"],
    "requirements": ["Access to a Windows or Mac computer"],
    "modules": [
      {
        "title": "Getting comfortable",
        "lessons": [
          {"title": "Files, folders and shortcuts", "minutes": 9, "preview": true, "content": "## Stay organised\n\nCreate one main folder (for example **Documents/Work**) and sub-folders by project or year. Name files clearly: `2026-11-cv-sara.docx`, not `final final 2.docx`.\n\n## Shortcuts worth learning\n\n| Action | Windows | Mac |\n|---|---|---|\n| Copy | Ctrl + C | ⌘ + C |\n| Paste | Ctrl + V | ⌘ + V |\n| Undo | Ctrl + Z | ⌘ + Z |\n| Search | Win key | ⌘ + Space |"},
          {"title": "Staying safe online", "minutes": 8, "preview": false, "content": "## Five habits\n\n1. Use a **different password** for every important account (a password manager helps).\n2. Turn on **two-step verification**.\n3. Never click links in unexpected messages asking you to *log in* or *verify*.\n4. Keep your system and browser **updated**.\n5. Back up important files to the cloud or an external drive."}
        ]
      },
      {
        "title": "Word and Excel",
        "lessons": [
          {"title": "A clean document in Word", "minutes": 11, "preview": false, "content": "## Use styles, not manual formatting\n\nApply **Heading 1**, **Heading 2** and **Normal** from the Styles bar instead of changing font sizes by hand. You get:\n\n- consistent formatting\n- an automatic table of contents\n- easy changes later\n\nFinish by checking spelling (F7) and exporting to **PDF** before sending."},
          {"title": "Your first Excel spreadsheet", "minutes": 12, "preview": false, "content": "## A simple budget\n\n1. Column A: item. Column B: amount.\n2. Under the last amount type `=SUM(B2:B10)`.\n3. Average spending: `=AVERAGE(B2:B10)`.\n4. Select the data and choose **Insert → Chart** to visualise it.\n\nFormulas always start with `=`. If you change a number, the totals update automatically."}
        ],
        "quiz": {
          "title": "Computer skills quiz",
          "questions": [
            {"q": "Which formula adds up cells B2 to B10?", "options": ["=ADD(B2:B10)", "=SUM(B2:B10)", "SUM B2-B10", "=TOTAL(B2,B10)"], "correct": 1},
            {"q": "An email asks you to 'verify your account' via a link. You should…", "options": ["Click and log in quickly", "Reply with your password", "Go to the site yourself instead of using the link", "Forward it to friends"], "correct": 2},
            {"q": "Why use Heading styles in Word?", "options": ["They use less ink", "Consistent formatting and an automatic table of contents", "They make files smaller", "Word requires them"], "correct": 1}
          ]
        }
      }
    ]
  },
  {
    "slug": "freelancing-from-zero",
    "title": "Freelancing from Zero",
    "subtitle": "Find your first clients and build an online career.",
    "description": "A step-by-step guide to starting as a freelancer: choosing a service, building a profile and portfolio, writing proposals that win, and getting paid safely.",
    "category": "freelancing",
    "level": "all_levels",
    "featured": false,
    "outcomes": ["Choose a service you can sell today", "Build a profile and a small portfolio", "Write short proposals that stand out", "Price your work and get paid safely"],
    "requirements": ["One skill you can offer (writing, design, data entry, translation…)", "An internet connection"],
    "modules": [
      {
        "title": "Getting set up",
        "lessons": [
          {"title": "Choosing what to offer", "minutes": 8, "preview": true, "content": "## Start narrow\n\n*\"I do design\"* is hard to sell. *\"I design Instagram posts for small cafés\"* is easy to buy.\n\nList your skills, then ask:\n\n- Can I deliver this **today** with what I know?\n- Are people **already paying** for it on Upwork or Fiverr?\n- Can I show **two or three examples**?"},
          {"title": "A profile that gets clicks", "minutes": 9, "preview": false, "content": "## Profile checklist\n\n- A clear, friendly **photo**\n- A title that names the **result**, not just the skill: *\"Product descriptions that sell\"*\n- A short overview: who you help, how, and proof\n- **3 portfolio samples**; if you have no clients yet, create sample projects\n\nUpdate your profile after every finished job."}
        ]
      },
      {
        "title": "Winning and keeping clients",
        "lessons": [
          {"title": "Proposals that win", "minutes": 10, "preview": false, "content": "## Keep it short and specific\n\n1. **First line**: show you read the job (*\"You need 10 product descriptions for handmade soap…\"*).\n2. **One relevant example** with a link.\n3. **A quick plan**: how and when you'll deliver.\n4. **A question** to start a conversation.\n\nUnder 150 words. Never send the same copy-pasted proposal to every job."},
          {"title": "Pricing and getting paid", "minutes": 9, "preview": false, "content": "## Pricing\n\nStart a little below the market rate to get reviews, then **raise prices after every 3–5 good reviews**.\n\n## Getting paid safely\n\n- Keep payments **on the platform**; it protects you.\n- For large jobs, use **milestones**.\n- Never start work for a client who asks to move to email or chat before a contract exists."}
        ],
        "quiz": {
          "title": "Freelancing quiz",
          "questions": [
            {"q": "Which service description is easiest for a client to buy?", "options": ["I do design", "I can help with anything", "I design Instagram posts for small cafés", "Graphic stuff"], "correct": 2},
            {"q": "What should the first line of a proposal show?", "options": ["Your hourly rate", "That you read and understood the job", "Your life story", "A list of every skill you have"], "correct": 1},
            {"q": "A new client asks you to leave the platform before any contract. You should…", "options": ["Agree immediately", "Keep the work and payment on the platform", "Ask for half the payment in cash", "Ignore all their messages"], "correct": 1}
          ]
        }
      }
    ]
  }
]
$json$::jsonb)
  loop
    insert into public.courses (title, slug, subtitle, description, category_id, teacher_id, level, outcomes, requirements, status, featured)
    values (
      v_course->>'title',
      v_course->>'slug',
      v_course->>'subtitle',
      v_course->>'description',
      (select id from public.categories where slug = v_course->>'category'),
      v_teacher,
      (v_course->>'level')::public.course_level,
      array(select jsonb_array_elements_text(v_course->'outcomes')),
      array(select jsonb_array_elements_text(v_course->'requirements')),
      'published',
      (v_course->>'featured')::boolean
    )
    on conflict (slug) do nothing
    returning id into v_course_id;

    continue when v_course_id is null;

    m_pos := 0;
    for v_module in select * from jsonb_array_elements(v_course->'modules') loop
      insert into public.modules (course_id, title, position)
      values (v_course_id, v_module->>'title', m_pos)
      returning id into v_module_id;

      l_pos := 0;
      for v_lesson in select * from jsonb_array_elements(v_module->'lessons') loop
        insert into public.lessons (course_id, module_id, title, content, duration_minutes, is_preview, position)
        values (v_course_id, v_module_id, v_lesson->>'title', v_lesson->>'content',
                (v_lesson->>'minutes')::int, (v_lesson->>'preview')::boolean, l_pos);
        l_pos := l_pos + 1;
      end loop;

      if v_module ? 'quiz' then
        insert into public.quizzes (course_id, module_id, title, position)
        values (v_course_id, v_module_id, v_module->'quiz'->>'title', m_pos)
        returning id into v_quiz_id;

        q_pos := 0;
        for v_question in select * from jsonb_array_elements(v_module->'quiz'->'questions') loop
          insert into public.quiz_questions (quiz_id, question, options, position)
          values (v_quiz_id, v_question->>'q', array(select jsonb_array_elements_text(v_question->'options')), q_pos)
          returning id into v_question_id;
          insert into public.quiz_answer_keys (question_id, correct_index)
          values (v_question_id, (v_question->>'correct')::int);
          q_pos := q_pos + 1;
        end loop;
      end if;

      m_pos := m_pos + 1;
    end loop;
  end loop;
end $$;
