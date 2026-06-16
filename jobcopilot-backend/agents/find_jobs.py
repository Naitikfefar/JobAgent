import requests
from bs4 import BeautifulSoup
import json
import os
import time
import sys
from datetime import date
from concurrent.futures import ThreadPoolExecutor

TODAY = date.today().strftime('%Y-%m-%d')
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

NAITIK_SKILLS = [
    'react', 'node', 'javascript', 'mongodb', 'mysql', 'sql',
    'html', 'css', 'tailwind', 'next', 'mern', 'rest api',
    'git', 'python', 'data', 'full stack', 'frontend', 'backend',
    'express', 'jwt', 'aws', 'vercel', 'web development', 'software'
]

TECH_TITLES = [
    'web development', 'react', 'node', 'javascript', 'frontend',
    'backend', 'full stack', 'fullstack', 'mern', 'software',
    'developer', 'engineer', 'python', 'data engineer', 'data analyst',
    'sql', 'database', 'ui/ux', 'flutter', 'android', 'ios',
    'mobile app', 'next.js', 'angular', 'devops', 'machine learning',
    'blockchain', 'cloud', 'qa', 'automation', 'mean stack', 'django'
]

EXCLUDE = [
    'hr ', 'civil ', 'mechanical', 'marketing', 'sales intern',
    'content writer', 'accounts', 'data entry', 'social media',
    'graphic design', 'video edit', 'nutrition', 'medical',
    'teaching', 'legal', 'logistics', 'fashion', 'business development'
]

def is_tech(title):
    t = title.lower()
    if any(ex in t for ex in EXCLUDE):
        return False
    return any(kw in t for kw in TECH_TITLES)

def calc_match(title, about, user_skills=None):
    import re
    skills = [s.lower() for s in (user_skills if user_skills else NAITIK_SKILLS)]
    text = (title + ' ' + about).lower()
    matched = []
    for s in skills:
        if len(s) <= 2:
            # require word boundary for very short tokens
            if re.search(rf"\b{re.escape(s)}\b", text):
                matched.append(s)
        else:
            if s in text:
                matched.append(s)
    score = min(100, int((len(matched) / max(1, len(skills))) * 100) + 30)
    return score, matched

def scrape_internshala():
    urls = [
        'https://internshala.com/internships/work-from-home-web-development-internship',
        'https://internshala.com/internships/work-from-home-reactjs-internship',
        'https://internshala.com/internships/work-from-home-nodejs-internship',
        'https://internshala.com/internships/work-from-home-full-stack-internship',
        'https://internshala.com/internships/work-from-home-software-development-internship',
        'https://internshala.com/internships/work-from-home-computer-science-internship',
        'https://internshala.com/internships/work-from-home-data-science-internship',
        'https://internshala.com/internships/work-from-home-python-internship',
    ]

    def fetch_one(url):
        page_jobs = []
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            soup = BeautifulSoup(r.text, 'html.parser')
            for card in soup.find_all('div', class_='internship_meta'):
                try:
                    title = card.find('h2', class_='job-internship-name')
                    title = title.text.strip() if title else None
                    if not title or not is_tech(title):
                        continue
                    company = card.find('p', class_='company-name')
                    company = company.text.strip() if company else None
                    if not company:
                        continue
                    link = card.find('a', class_='job-title-href')
                    link = 'https://internshala.com' + link['href'] if link else None
                    stipend = card.find('span', class_='stipend')
                    stipend = stipend.text.strip() if stipend else 'See listing'
                    duration_tags = card.find_all('div', class_='row-1-item')
                    duration = 'N/A'
                    for d in duration_tags:
                        if 'Month' in d.text or 'Week' in d.text:
                            duration = d.text.strip()
                            break
                    about = card.find('div', class_='about_job')
                    about = about.text.strip()[:500] if about else ''
                    score, matched = calc_match(title, about)
                    page_jobs.append({
                        'title': title, 'company': company,
                        'apply_link': link, 'stipend': stipend,
                        'duration': duration, 'about': about,
                        'match_score': score, 'matched_skills': matched,
                        'source': 'Internshala'
                    })
                except:
                    continue
        except Exception as e:
            sys.stderr.write(f'Internshala error: {e}\n')
        return page_jobs

    jobs = []
    seen = set()
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(fetch_one, urls)
        for page_jobs in results:
            for job in page_jobs:
                if job['company'] not in seen:
                    seen.add(job['company'])
                    jobs.append(job)
    return jobs

def search_jsearch():
    if not RAPIDAPI_KEY:
        return []
    queries = [
        'React developer intern remote',
        'Full stack developer intern India',
        'Frontend developer intern India remote',
        'Node.js developer intern India',
        'MERN stack developer intern',
        'Software developer intern India fresher',
    ]

    def fetch_one(query):
        page_jobs = []
        try:
            r = requests.get('https://jsearch.p.rapidapi.com/search',
                params={'query': query, 'page': '1', 'num_pages': '1'},
                headers={'X-RapidAPI-Key': RAPIDAPI_KEY,
                         'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'},
                timeout=10)
            if r.status_code != 200:
                return page_jobs
            for job in r.json().get('data', []):
                title = job.get('job_title', '')
                if not is_tech(title):
                    continue
                about = job.get('job_description', '')[:400]
                score, matched = calc_match(title, about)
                publisher = job.get('job_publisher', 'Job Board')
                page_jobs.append({
                    'title': title, 'company': job.get('employer_name', ''),
                    'apply_link': job.get('job_apply_link', ''),
                    'stipend': job.get('job_salary_string') or 'See listing',
                    'duration': 'See listing', 'about': about,
                    'match_score': score, 'matched_skills': matched,
                    'source': publisher,
                    '_jid': job.get('job_id')
                })
        except Exception as e:
            sys.stderr.write(f'JSearch error: {e}\n')
        return page_jobs

    jobs = []
    seen = set()
    with ThreadPoolExecutor(max_workers=6) as executor:
        results = executor.map(fetch_one, queries)
        for page_jobs in results:
            for job in page_jobs:
                jid = job.pop('_jid', None)
                if jid not in seen:
                    seen.add(jid)
                    jobs.append(job)
    return jobs

def find_all_jobs(user_skills=None, user_roles=None):
    india_jobs = scrape_internshala()
    global_jobs = search_jsearch()
    all_jobs = india_jobs + global_jobs

    seen_co = set()
    unique = []
    for job in all_jobs:
        key = job['company'].lower().strip()
        if key not in seen_co:
            seen_co.add(key)
            unique.append(job)

    unique.sort(key=lambda x: x['match_score'], reverse=True)

    india = [j for j in unique if j['source'] == 'Internshala'][:6]
    global_ = [j for j in unique if j['source'] != 'Internshala'][:4]
    return india + global_

if __name__ == '__main__':
    user_skills = None
    user_roles = None
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            user_skills = input_data.get('skills', [])
            user_roles = input_data.get('roles', [])
        except:
            pass
    
    # Use user skills for matching if provided
    if user_skills:
        # Override NAITIK_SKILLS with user's actual skills
        NAITIK_SKILLS = [s.lower() for s in user_skills]
    
    jobs = find_all_jobs(user_skills, user_roles)
    print(json.dumps(jobs))