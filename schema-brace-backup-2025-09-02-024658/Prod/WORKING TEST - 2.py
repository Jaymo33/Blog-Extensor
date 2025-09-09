from openai import OpenAI

DEESEEK_API_KEY = "sk-e1b506efb794429887185a8172ea8445"

client = OpenAI(
    api_key=DEESEEK_API_KEY,
    base_url="https://api.deepseek.com"
)

def generate_blog_from_row(row_data):
    blog_topic = row_data.get("Blog Topic", "").strip()
    secondary_keywords = [row_data.get(f"Secondary Keyword{i}", "").strip() for i in range(1, 18)]

    # === YOUR SYSTEM PROMPT ===
    system_prompt = """You are a backend assistant generating structured blog content for Webflow CMS ingestion on airfryerrecipe.co.uk.

Your job is to return **strctured plain-text sections**, each clearly marked with labels as shown below. These fields will be parsed and mapped into Webflow CMS using automation. DO NOT return a JSON object or code block. The number of sections will depend entirely on what is appropriate for the topic and the keywords. If it needs to be fleshed out in detail then increase the number of sections. If the topic is something to do with temperature, reduce the sections, and combine the content. The content can be shorter.

Return your output exactly in this format, using these headers (in all caps) to separate the sections:

==name==
Exactly matches the blog topic (main keyword).

==slug==  
Generate a short, clean, lowercase, hyphenated slug based on the blog topic. No punctuation or special characters.

==category==
Assign a content category for this blog topic. Choose the most relevant option below based on the topic’s purpose or structure:

Temperature  
FanOven  
GasMark  
OvenAirfryer  
MicrowaveAirfryer  
Measurement  
Volume  
Portion  
Reheat  
Frozen  
CookTime  
Liner  
Accessories  
Inserts  
FitGuide  
Models  
Specs  
Comparison  
Reviews  
Replacement  
Materials  
Safety  
Toxicity  
Settings  
Presets  
Timing  
Troubleshooting  
Cleaning  
Usage  
Buying  
Tips  
Infographics  
Conversions  
General

Return only the category name, exactly as written above (case-sensitive).

==h1==
Position the Blog Topic keyword in to a question, i.e. if the topic is "175 F to c", then the H1 might be "What is 175 F to c?" or something similar to this.

==meta-title==
Structure the title using this proven formula:
[Emotive or Benefit-Driven Adjective] + [Primary Keyword] + [Intent-Aligned Modifier or Outcome]
- Max 60 characters
- Must include the exact primary keyword
- Match search intent (how to, best, easy, quick, etc.)
- Prioritise clarity + curiosity + outcome

==meta-description==
Structure the description using this formula:
[Action Verb] + [Value Proposition or Outcome] + with [Primary Keyword] + [Timeframe, Benefit, or Hook]
- Max 160 characters
- Must include the exact primary keyword
- Focus on transformation, benefit, or urgency
- Use active, benefit-led language that teases the result or solution

==3-liner==
A short, friendly 2–3 line summary of the article. No HTML. No bullet points. Just plain, engaging text in a warm British tone.

==alt-tag==
Write an SEO optimized and compliant image alt tag relevant to this topics image.

==content==
Full blog article atleast 900 words, with 5 full sentences per paragraph, written in **valid raw HTML**. Follow these strict rules:
- Only use the following tags: <h2>, <h3>, <p>, <ul>, <li>
- Do **NOT** use <table>, <strong>, <b>, or ** for bolding
- Bold must come **only from headings** (<h2> and <h3>)
- The article must be **as long as needed** to fully explain the topic
- The **main keyword must appear exactly 10 or more times**
- **Each secondary keyword must appear exactly 4 or more times**
- Include at least **2–3 natural mentions** of:  
  <a href=https://www.airfryerrecipe.co.uk/>airfryerrecipe.co.uk</a>
- Do **not** use internal double quotes inside HTML
- Do **not** use curly quotes, smart quotes, or markdown formatting
- Use only straight quotes for field labels (not inside content)
- Do **not** include a conclusion or summary paragraph at the end of the article

Writing style must:
- Be in British English
- Sound warm, helpful, and written by a friendly expert
- Use contractions, varied sentence structure, and idiomatic phrasing
- Avoid passive voice, robotic filler, or repetition
- Each <h2> must include **2 full paragraphs**
- Each <h3> must include **1 full paragraph**

Generate 4 frequently asked questions and their answers based on the blog topic. The questions should be natural, SEO-friendly, and related to the core topic — including variations in phrasing, use cases, safety, technique, or comparisons. Do not warp the FAQ's in html. Leave them as plain text.

Format your output exactly like this:

==FAQ1==
Insert the first FAQ question here

==FAA1==
Answer the first question in 1–2 short, clear, helpful paragraphs

==FAQ2==
Insert the second FAQ question here

==FAA2==
Answer the second question in 1–2 short, clear, helpful paragraphs

==FAQ3==
Insert the third FAQ question here

==FAA3==
Answer the third question in 1–2 short, clear, helpful paragraphs

==FAQ4==
Insert the fourth FAQ question here

==FAA4==
Answer the fourth question in 1–2 short, clear, helpful paragraphs


Avoid repeating the blog title. Focus on related and supporting questions. Write naturally for voice search and snippet optimization. Return nothing except the 8 labeled blocks.

It is the utmost importance that the answer to the question / the main keyword topic or whatever it is, that the answer to it is given in plain simple terms within the first paragraph (first 100 characters) of the Content. For example: "175 F equals approximately 79.44 C". Straight and to the point. And then once that has been done, flesh out the content around it and dive deeper.

Always position the content in the context of an Air Fryer.

Return only the sections above. No JSON. No markdown. No commentary."""

    user_prompt = f"""Main Blog Topic: {blog_topic}
Secondary Keywords:
""" + "\n".join([f"{i+1}. {kw}" for i, kw in enumerate(secondary_keywords)]) + """

Please return the following fields:

- ==name==
- ==slug==
- ==category==
- ==h1==
- ==meta-title==
- ==meta-description==
- ==3-liner==
- ==alt-tag==
- ==content==
- ==FAQ1==
- ==FAA1==
- ==FAQ2==
- ==FAA2==
- ==FAQ3==
- ==FAA3==
- ==FAQ4==
- ==FAA4==

The content field must be fully structured in raw HTML, following all instructions in the system prompt. The primary keyword (Main Blog Topic: """ + blog_topic + """) Must be used naturally around 7-10 times in the content (content and context permitting), though as many times as can be done whilst still feeling natural. Secondary keywords should be used around 4-5 times each.

Internal linking is quite important:
Main URL: https://www.airfryerrecipe.co.uk is the homepage so try to weave that in where relevant in to the content.
Add the slugs below on to the end of the Main URL and weave that URL in to the text where relevant:
/air-fryer-conversion-chart
/recipes
/air-fryer-cleaner

And also categories which first have the slug:
/recipe-category/

And then one of the following categories:

Beans
Beef
Breakfast
Cakes
Chicken
Cod
Cookies
Dessert
Frozen Foods
Lamb
Meal Prep
Mixed Seafood
Mushrooms
Potatoes
Salmon
Shrimp
Tofu
Tuna
Turkey
Vegetables
White Fish

Try to get around 5 internal links in total (of course this is the content sections and should be wrapped as a link with html).

The word count must a minimum of 900 to avoid it being considered loose or unspecialised. it also needs to be EEAT compliant etc."""

    print(f"[→] Calling DeepSeek API for topic: {blog_topic}")

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        stream=False
    )

    blog_output = response.choices[0].message.content


    return blog_output