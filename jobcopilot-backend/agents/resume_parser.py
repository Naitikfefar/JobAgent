import sys
import json
import os

def parse_resume(pdf_path):
    try:
        import pdfplumber
        
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
        # Extract skills using keyword matching
        ALL_SKILLS = [
            # Frontend
            'react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'vue', 'vue.js',
            'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind',
            'tailwindcss', 'bootstrap', 'sass', 'scss', 'jquery', 'redux',
            # Backend
            'node.js', 'nodejs', 'express', 'express.js', 'django', 'flask',
            'fastapi', 'spring', 'laravel', 'php', 'ruby', 'rails',
            # Languages
            'python', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'swift',
            'kotlin', 'scala', 'r', 'matlab',
            # Database
            'mongodb', 'mysql', 'postgresql', 'postgres', 'sqlite', 'redis',
            'firebase', 'supabase', 'cassandra', 'oracle', 'sql', 'nosql', 'ssms',
            # Cloud/DevOps
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes',
            'jenkins', 'ci/cd', 'github actions', 'terraform', 'linux',
            # AI/ML
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
            'scikit-learn', 'pandas', 'numpy', 'nlp', 'computer vision',
            'data science', 'data analysis', 'tableau', 'power bi',
            # Tools
            'git', 'github', 'gitlab', 'jira', 'figma', 'postman', 'vercel',
            'netlify', 'heroku', 'rest api', 'graphql', 'jwt', 'oauth',
            # Mobile
            'flutter', 'react native', 'android', 'ios', 'swift', 'kotlin',
            # Other
            'blockchain', 'web3', 'solidity', 'cybersecurity', 'networking'
        ]
        
        text_lower = text.lower()
        found_skills = []
        for skill in ALL_SKILLS:
            if skill in text_lower and skill not in found_skills:
                found_skills.append(skill)
        
        # Extract experience years
        import re
        exp_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*experience',
            r'experience\s*of\s*(\d+)\+?\s*years?',
        ]
        experience_years = 0
        for pattern in exp_patterns:
            match = re.search(pattern, text_lower)
            if match:
                experience_years = int(match.group(1))
                break
        
        # Extract education
        education = ""
        edu_keywords = ['b.tech', 'btech', 'b.e', 'mtech', 'm.tech', 'bca', 'mca',
                       'bachelor', 'master', 'phd', 'diploma', 'b.sc', 'mba']
        for keyword in edu_keywords:
            if keyword in text_lower:
                # Find the line containing it
                for line in text.split('\n'):
                    if keyword in line.lower():
                        education = line.strip()
                        break
                if education:
                    break
        
        # Extract name (usually first line)
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        name = lines[0] if lines else ""
        
        # Extract email
        email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', text)
        email = email_match.group(0) if email_match else ""
        
        # Detect job roles from resume
        role_keywords = {
            'frontend developer': ['react', 'html', 'css', 'javascript', 'frontend'],
            'backend developer': ['node', 'express', 'django', 'flask', 'backend', 'api'],
            'full stack developer': ['react', 'node', 'mongodb', 'fullstack', 'full stack', 'mern', 'mean'],
            'data engineer': ['sql', 'python', 'data warehouse', 'etl', 'data engineering'],
            'data analyst': ['tableau', 'power bi', 'excel', 'data analysis', 'pandas'],
            'mobile developer': ['flutter', 'react native', 'android', 'ios', 'kotlin', 'swift'],
            'devops engineer': ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform'],
            'ml engineer': ['machine learning', 'tensorflow', 'pytorch', 'deep learning'],
        }
        
        detected_roles = []
        for role, keywords in role_keywords.items():
            if any(kw in text_lower for kw in keywords):
                detected_roles.append(role)
        
        return {
            "success": True,
            "name": name,
            "email": email,
            "skills": found_skills,
            "experience_years": experience_years,
            "education": education,
            "detected_roles": detected_roles,
            "raw_text": text[:500]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "skills": [],
            "detected_roles": []
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file provided"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    result = parse_resume(pdf_path)
    print(json.dumps(result))
