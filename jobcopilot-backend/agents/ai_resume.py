import requests
import json
import os
import sys
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
TODAY = date.today().strftime('%Y-%m-%d')

def call_ai(prompt):
    r = requests.post('https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': f'Bearer {GROQ_API_KEY}',
                 'Content-Type': 'application/json'},
        json={'model': 'llama-3.3-70b-versatile',
              'messages': [{'role': 'user', 'content': prompt}],
              'max_tokens': 2000, 'temperature': 0.7})
    return r.json()['choices'][0]['message']['content']

def generate_resume_content(job_title, company, job_desc, user_profile):
    prompt = f"""You are an expert resume writer. Return ONLY valid JSON, no markdown.

JOB: {job_title} at {company}
JOB DESCRIPTION: {job_desc[:800]}
CANDIDATE PROFILE: {json.dumps(user_profile)}

Return this exact JSON structure:
{{"match_score": 85, "key_skills": ["skill1","skill2","skill3","skill4","skill5","skill6"], "summary": "2 line professional summary tailored to this job", "internship_bullets": ["bullet 1 tailored to JD", "bullet 2 tailored to JD"], "project1_bullets": ["Job Hiring Platform bullet 1", "bullet 2"], "project2_bullets": ["Data Warehouse bullet 1", "bullet 2"]}}"""

    response = call_ai(prompt)
    response = response.strip()
    start = response.find('{')
    end = response.rfind('}') + 1
    return json.loads(response[start:end])

def generate_cover_letter(job_title, company, job_desc, user_profile):
    name = user_profile.get('name', 'Candidate')
    skills = ', '.join(user_profile.get('skills', [])[:6])
    prompt = f"""Write a professional 3-paragraph cover letter.
JOB: {job_title} at {company}
JOB DESCRIPTION: {job_desc[:500]}
CANDIDATE: {name}, skills: {skills}
Start: "Dear Hiring Team at {company},"
End: "Best regards, {name}"
Under 200 words. Specific to this job."""
    return call_ai(prompt)

def create_resume_pdf(output_path, job_title, company, ai_content, user_profile):
    doc = SimpleDocTemplate(output_path, pagesize=A4,
        rightMargin=0.6*inch, leftMargin=0.6*inch,
        topMargin=0.6*inch, bottomMargin=0.6*inch)

    styles = getSampleStyleSheet()
    name_s = ParagraphStyle('n', fontSize=20, fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a1a2e'), spaceAfter=4)
    contact_s = ParagraphStyle('c', fontSize=9,
        textColor=colors.HexColor('#444444'), spaceAfter=2)
    section_s = ParagraphStyle('s', fontSize=11, fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a1a2e'), spaceBefore=10, spaceAfter=4)
    body_s = ParagraphStyle('b', fontSize=9.5,
        textColor=colors.HexColor('#222222'), spaceAfter=3, leading=14)
    bold_s = ParagraphStyle('bo', fontSize=9.5, fontName='Helvetica-Bold',
        textColor=colors.HexColor('#222222'), spaceAfter=2)
    summary_s = ParagraphStyle('su', fontSize=10, fontName='Helvetica-Oblique',
        textColor=colors.HexColor('#333333'), spaceAfter=6, leading=15)

    name = user_profile.get('name', 'Candidate')
    email = user_profile.get('email', '')

    story = []
    story.append(Paragraph(name.upper(), name_s))
    story.append(Paragraph(f"{email} | GitHub: github.com/{email.split('@')[0]} | LinkedIn: linkedin.com/in/{email.split('@')[0]}", contact_s))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1a1a2e')))
    story.append(Spacer(1, 4))

    story.append(Paragraph("PROFESSIONAL SUMMARY", section_s))
    story.append(Paragraph(ai_content.get('summary', ''), summary_s))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')))

    edu = user_profile.get('education', 'B.Tech Computer Engineering')
    story.append(Paragraph("EDUCATION", section_s))
    story.append(Paragraph(f"<b>{edu}</b>", body_s))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')))

    story.append(Paragraph("TECHNICAL SKILLS", section_s))
    skills = ai_content.get('key_skills', user_profile.get('skills', []))
    story.append(Paragraph(f"<b>Core Skills:</b> {', '.join(skills)}", body_s))
    story.append(Paragraph("<b>Tools:</b> Git, GitHub, VS Code, Postman, Vercel, AWS", body_s))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')))

    story.append(Paragraph("INTERNSHIP EXPERIENCE", section_s))
    internship = user_profile.get('internship', 'Software Development Intern')
    story.append(Paragraph(f"<b>{internship}</b>", bold_s))
    for b in ai_content.get('internship_bullets', []):
        story.append(Paragraph(f"• {b}", body_s))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')))

    story.append(Paragraph("PROJECTS", section_s))
    projects = user_profile.get('projects', [])
    if len(projects) > 0:
        story.append(Paragraph(f"<b>{projects[0]}</b>", bold_s))
    for b in ai_content.get('project1_bullets', []):
        story.append(Paragraph(f"• {b}", body_s))
    story.append(Spacer(1, 4))
    if len(projects) > 1:
        story.append(Paragraph(f"<b>{projects[1]}</b>", bold_s))
    for b in ai_content.get('project2_bullets', []):
        story.append(Paragraph(f"• {b}", body_s))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')))

    achievements = user_profile.get('achievements', [])
    if achievements:
        story.append(Paragraph("ACHIEVEMENTS & CERTIFICATES", section_s))
        for a in achievements:
            story.append(Paragraph(f"• {a}", body_s))

    doc.build(story)
    return output_path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    input_data = json.loads(sys.argv[1])
    job_title = input_data.get('job_title', 'Developer Intern')
    company = input_data.get('company', 'Company')
    job_desc = input_data.get('job_desc', '')
    user_profile = input_data.get('user_profile', {})
    output_path = input_data.get('output_path', f'/tmp/resume-{TODAY}.pdf')

    ai_content = generate_resume_content(job_title, company, job_desc, user_profile)
    cover_letter = generate_cover_letter(job_title, company, job_desc, user_profile)
    create_resume_pdf(output_path, job_title, company, ai_content, user_profile)

    result = {
        'match_score': ai_content.get('match_score', 0),
        'key_skills': ai_content.get('key_skills', []),
        'cover_letter': cover_letter,
        'resume_path': output_path
    }
    print(json.dumps(result))