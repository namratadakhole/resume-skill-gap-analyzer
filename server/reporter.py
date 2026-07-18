import io
import time
import traceback
from datetime import datetime
from fpdf import FPDF
from typing import Dict, Any

def sanitize_text_for_pdf(text: str) -> str:
    """
    Sanitizes a string to ensure all characters are compatible with standard FPDF Latin-1 fonts.
    Replaces common non-Latin1 unicode characters with ASCII equivalents and strips remaining invalid characters.
    """
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text)
        
    replacements = {
        '\u2014': '-',   # em dash
        '\u2013': '-',   # en dash
        '\u2018': "'",   # left single quote
        '\u2019': "'",   # right single quote
        '\u201c': '"',   # left double quote
        '\u201d': '"',   # right double quote
        '\u2022': '*',   # bullet
        '\u2026': '...', # ellipsis
        '\u00a0': ' ',   # non-breaking space
        '\u200b': '',    # zero-width space
        '–': '-',
        '—': '-',
        '“': '"',
        '”': '"',
        '‘': "'",
        '’': "'",
        '•': '*',
        '…': '...',
        '™': '(TM)',
        '®': '(R)',
        '©': '(C)',
    }
    
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)
        
    return text.encode('latin-1', 'ignore').decode('latin-1')

class ResumeReportPDF(FPDF):
    def __init__(self, resume_name: str, job_title: str):
        super().__init__()
        self.resume_name = sanitize_text_for_pdf(resume_name)
        self.job_title = sanitize_text_for_pdf(job_title)
        self.set_margins(15, 20, 15)
        self.alias_nb_pages()
        
    def header(self):
        # We only want the branding banner on the first page, or clean headers on other pages
        if self.page_no() == 1:
            # First page branding banner
            self.set_fill_color(24, 30, 41)  # Premium Dark Gray-Blue
            self.rect(0, 0, 210, 45, 'F')
            
            self.set_y(10)
            self.set_text_color(255, 255, 255)
            self.set_font('Helvetica', 'B', 20)
            self.cell(0, 10, 'AI Resume Skill Gap Analyzer', border=0, align='L')
            self.ln(9)
            
            self.set_font('Helvetica', 'B', 11)
            self.set_text_color(173, 181, 189) # Silver text
            self.cell(0, 6, f'EVALUATION REPORT FOR: {self.resume_name.upper()}', border=0, align='L')
            self.ln(6)
            self.cell(0, 6, f'TARGET ROLE: {self.job_title.upper()}', border=0, align='L')
            
            # Print timestamp on top right
            self.set_y(12)
            self.set_x(-75)
            self.set_font('Helvetica', 'I', 9)
            self.set_text_color(206, 212, 218)
            now_str = datetime.now().strftime("%B %d, %Y - %H:%M")
            self.cell(60, 5, f'Generated: {now_str}', border=0, align='R')
            
            self.set_y(50)  # Move content below the header banner
        else:
            # Header for subsequent pages
            self.set_text_color(100, 100, 100)
            self.set_font('Helvetica', 'I', 8)
            self.cell(0, 5, f'Skill Gap Analysis: {self.resume_name} vs {self.job_title}', border=0, align='L')
            # Line below header
            self.set_draw_color(200, 200, 200)
            self.line(15, 12, 195, 12)
            self.set_y(18)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}} | Confidential Resume Evaluation Report', 0, 0, 'C')

def generate_pdf_report(analysis: Dict[str, Any], resume_name: str, job_title: str) -> bytes:
    """
    Generates a professionally styled PDF report and returns it as a bytes object.
    Includes full timing logs, defensive key checking, and unicode text sanitization.
    """
    start_time = time.time()
    clean_resume_name = sanitize_text_for_pdf(resume_name)
    clean_job_title = sanitize_text_for_pdf(job_title)
    print(f"[{datetime.now().isoformat()}] [REPORTER] Starting PDF report generation for '{clean_resume_name}' against '{clean_job_title}'")
    
    try:
        pdf = ResumeReportPDF(clean_resume_name, clean_job_title)
        pdf.add_page()
        
        # 1. Executive Summary / Overview Box
        pdf.set_y(52)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(24, 30, 41)
        pdf.cell(0, 8, '1. Executive Match Overview', border=0)
        pdf.ln(10)
        
        # Color coding based on score
        ats_score = analysis.get('ats_score', 0.0)
        tier = sanitize_text_for_pdf(analysis.get('tier', 'Medium Match'))
        summary_text = sanitize_text_for_pdf(analysis.get('summary', ''))
        
        if tier == "High Match":
            bg_color = (220, 245, 230)  # Soft green
            border_color = (40, 167, 69)
            text_color = (21, 87, 36)
        elif tier == "Medium Match":
            bg_color = (255, 243, 205)  # Soft orange
            border_color = (255, 193, 7)
            text_color = (133, 100, 4)
        else:
            bg_color = (248, 215, 218)  # Soft red
            border_color = (220, 53, 69)
            text_color = (114, 28, 36)
            
        # Draw colored callout box
        pdf.set_fill_color(*bg_color)
        pdf.set_draw_color(*border_color)
        pdf.set_line_width(0.5)
        
        # Position box coordinates
        x_pos = pdf.get_x()
        y_pos = pdf.get_y()
        
        # Inner text in box
        pdf.rect(x_pos, y_pos, 180, 24, 'FD')
        
        # Score details
        pdf.set_y(y_pos + 3)
        pdf.set_x(x_pos + 5)
        pdf.set_font('Helvetica', 'B', 24)
        pdf.set_text_color(*text_color)
        pdf.cell(30, 18, f"{ats_score}%", border=0, align='C')
        
        pdf.set_y(y_pos + 3)
        pdf.set_x(x_pos + 38)
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 6, f"ATS Compatibility Level: {tier}", border=0)
        
        pdf.set_y(y_pos + 9)
        pdf.set_x(x_pos + 38)
        pdf.set_font('Helvetica', 'I', 9)
        pdf.set_text_color(60, 60, 60)
        # Print short summary wrapped
        pdf.multi_cell(135, 4.5, summary_text, border=0)
        
        pdf.set_y(y_pos + 28)
        pdf.ln(5)
        
        # 2. Detailed Metric Breakdowns
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(24, 30, 41)
        pdf.cell(0, 6, 'Metric Score Breakdown:', border=0)
        pdf.ln(8)
        
        # Tables/Bars for metrics
        metrics = [
            ("Semantic Similarity (Transformer Match)", analysis.get('semantic_score', 0.0)),
            ("Keyword Match (TF-IDF Cosine Similarity)", analysis.get('keyword_score', 0.0)),
            ("Required Keyword/Skill Presence", analysis.get('skills_match_score', 0.0)),
            ("Resume Layout & Formatting Score", analysis.get('formatting_score', 0.0)),
            ("Experience Requirements Match", analysis.get('experience_score', 0.0))
        ]
        
        for label, val in metrics:
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(100, 6, sanitize_text_for_pdf(label), border=0)
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(24, 30, 41)
            pdf.cell(30, 6, f"{val}%", border=0, align='R')
            pdf.ln(8)
            
        pdf.ln(4)
        
        # 3. Skills Analysis Section
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 8, '2. Detailed Skill Gap Analysis', border=0)
        pdf.ln(10)
        
        skills_dict = analysis.get('skills', {})
        matched_list = skills_dict.get('matched', [])
        missing_list = skills_dict.get('missing', [])
        cat_matched = skills_dict.get('categorized_matched', {})
        cat_missing = skills_dict.get('categorized_missing', {})
        
        # Matched Skills & Missing Skills
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(40, 167, 69) # Green
        pdf.cell(0, 6, f"Matched Skills ({len(matched_list)}):", border=0)
        pdf.ln(6)
        
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(80, 80, 80)
        if cat_matched:
            for cat, skills in cat_matched.items():
                pdf.set_font('Helvetica', 'B', 9)
                pdf.set_text_color(60, 60, 60)
                pdf.cell(0, 5, f"{sanitize_text_for_pdf(cat)}:", border=0)
                pdf.ln(5)
                
                pdf.set_font('Helvetica', '', 9.5)
                pdf.set_text_color(100, 100, 100)
                skill_str = sanitize_text_for_pdf(", ".join(skills))
                pdf.multi_cell(180, 5, skill_str, border=0)
                pdf.ln(2)
        else:
            pdf.cell(0, 6, 'None detected.', border=0)
            pdf.ln(6)
            
        pdf.ln(4)
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(220, 53, 69) # Red
        pdf.cell(0, 6, f"Missing Skills ({len(missing_list)}):", border=0)
        pdf.ln(6)
        
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(80, 80, 80)
        if cat_missing:
            for cat, skills in cat_missing.items():
                pdf.set_font('Helvetica', 'B', 9)
                pdf.set_text_color(60, 60, 60)
                pdf.cell(0, 5, f"{sanitize_text_for_pdf(cat)}:", border=0)
                pdf.ln(5)
                
                pdf.set_font('Helvetica', '', 9.5)
                pdf.set_text_color(100, 100, 100)
                skill_str = sanitize_text_for_pdf(", ".join(skills))
                pdf.multi_cell(180, 5, skill_str, border=0)
                pdf.ln(2)
        else:
            pdf.set_text_color(40, 167, 69)
            pdf.cell(0, 6, 'No missing skills detected. Perfect skill overlap.', border=0)
            pdf.ln(6)
            
        pdf.ln(5)
        
        # Check if page break is needed before recommendations
        if pdf.get_y() > 220:
            pdf.add_page()
            pdf.set_y(25)
            
        # 4. Actionable Recommendations
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(24, 30, 41)
        pdf.cell(0, 8, '3. Actionable Career & Resume Recommendations', border=0)
        pdf.ln(10)
        
        recs = analysis.get('recommendations', [])
        for i, rec in enumerate(recs, 1):
            rec_skill = sanitize_text_for_pdf(rec.get('skill', 'Skill'))
            rec_type = sanitize_text_for_pdf(rec.get('type', 'Action'))
            rec_action = sanitize_text_for_pdf(rec.get('action', ''))
            
            # Header for recommendation
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(24, 30, 41)
            pdf.cell(10, 5, f"{i}.", border=0)
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(10, 80, 150)
            pdf.cell(100, 5, f"{rec_skill} ({rec_type})", border=0)
            pdf.ln(5.5)
            
            # Recommendation body
            pdf.set_x(25)
            pdf.set_font('Helvetica', '', 9.5)
            pdf.set_text_color(80, 80, 80)
            pdf.multi_cell(170, 4.5, rec_action, border=0)
            pdf.ln(4)
            
        pdf.ln(4)
        
        # 5. Formatting Check Results
        if pdf.get_y() > 220:
            pdf.add_page()
            pdf.set_y(25)
            
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(24, 30, 41)
        pdf.cell(0, 8, '4. Layout, Formatting & ATS Parser Checks', border=0)
        pdf.ln(10)
        
        checks = analysis.get('formatting_checks', [])
        for check in checks:
            name = sanitize_text_for_pdf(check.get('name', 'Check'))
            status = check.get('status', 'Pass')
            message = sanitize_text_for_pdf(check.get('message', ''))
            
            # Choose status sign and color
            if status == "Pass":
                status_text = "[PASS]"
                text_col = (40, 167, 69)
            elif status == "Warning":
                status_text = "[WARN]"
                text_col = (255, 150, 0)
            else:
                status_text = "[FAIL]"
                text_col = (220, 53, 69)
                
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(*text_col)
            pdf.cell(20, 5, status_text, border=0)
            
            pdf.set_text_color(50, 50, 50)
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(50, 5, name, border=0)
            pdf.set_font('Helvetica', '', 9.5)
            pdf.cell(0, 5, f"- {message}", border=0)
            pdf.ln(6)
            
        # Standard disclaimer on bottom of last page
        pdf.ln(10)
        pdf.set_font('Helvetica', 'I', 8)
        pdf.set_text_color(150, 150, 150)
        pdf.multi_cell(180, 4, "Disclaimer: This automated parser analysis is based on textual heuristic algorithms and statistical alignment. It simulates standard ATS behavior, but actual results may vary based on specific corporate ATS parsing configurations and HR screening criteria.", border=0, align='C')
        
        # Output PDF as bytearray / bytes
        pdf_bytes = pdf.output()
        if isinstance(pdf_bytes, str):
            pdf_bytes = pdf_bytes.encode('latin-1')
            
        elapsed = time.time() - start_time
        print(f"[{datetime.now().isoformat()}] [REPORTER] PDF report generated successfully in {elapsed:.3f}s ({len(pdf_bytes)} bytes)")
        return pdf_bytes
        
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] [REPORTER ERROR] PDF generation failed for '{clean_resume_name}': {str(e)}")
        traceback.print_exc()
        raise e
