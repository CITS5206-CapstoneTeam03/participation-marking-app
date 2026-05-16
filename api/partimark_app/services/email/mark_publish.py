from sqlalchemy.orm import Session #type: ignore
from ...crud.crud_marks import get_all_sum_marks, get_all_6w_sum_marks
from ...crud.crud_system_config import get_current_system_config
from ...crud.crud_enabled_weeks import get_max_score
from .email_sender import EmailSender

def parse_score(score: float) -> str:
    if score < 0 or score > 100:
        return "Invalid score"
    elif score < 44:
        return "N - Fail"
    elif score < 50:
        return "N+ - Fail"
    elif score < 60:
        return "P - Pass"
    elif score < 70:
        return "CR - Credit Pass"
    elif score < 80:
        return "D - Distinction"
    else:
        return "HD - Higher Distinction"
    

def parse_mark_code_all(db: Session, final: bool) -> list[tuple[str,str]]:
    """
    Parse mark code
    """
    if final:
        sum_marks = get_all_sum_marks(db)

        #Get max point whole sem
        config = get_current_system_config(db)
        max_points = config.total_participation_points if config and config.total_participation_points is not None and config.total_participation_points > 0 else 1
    else:
        sum_marks = get_all_6w_sum_marks(db)

        #Get max point mid sem
        mid_max = get_max_score(db, 6)
        max_points = mid_max if mid_max > 0 else 1

    return [
        (email, parse_score(round((total/max_points)*100,2)))
        for _, _, _, email, total in sum_marks
    ]

def get_mark_comment(mark_code: str) -> str:
    """
    Returns a short, generic comment tailored to the specific mark code.
    """
    if "N -" in mark_code or "N+ -" in mark_code:
        return "Unfortunately, you have not met the minimum participation requirements. Please review the course expectations and reach out if you need additional support."
    elif "P -" in mark_code:
        return "You have achieved a Pass in participation. Keep up the effort and try to engage more actively in future sessions."
    elif "CR -" in mark_code:
        return "Good effort! You have achieved a Credit Pass for your consistent participation."
    elif "D -" in mark_code:
        return "Excellent participation! You have achieved a Distinction through your strong engagement."
    elif "HD -" in mark_code:
        return "Outstanding participation! You have achieved a High Distinction for your exceptional contributions."
    else:
        return "Your participation score requires review. Please contact the coordinator for more information."

def draft_and_send_emails(db: Session, final: bool) -> int:
    """
    Retrieves all marks, drafts an email for each student based on their mark code,
    and dispatches them via SMTP.
    Returns the number of successfully sent emails.
    """
    mark_data = parse_mark_code_all(db, final)
    period = "Final Semester" if final else "Mid-Semester"
    
    drafts = []
    for email, mark_code in mark_data:
        if not email:
            continue
            
        comment = get_mark_comment(mark_code)
        subject = f"Your {period} Participation Mark"
        
        body = (
            f"Hello,\n\n"
            f"Your {period} participation mark code is: {mark_code}.\n\n"
            f"{comment}\n\n"
            f"Best regards,\n"
            f"The Teaching Team"
        )
        
        drafts.append({
            "to": email,
            "subject": subject,
            "body": body
        })
        
    sender = EmailSender()
    return sender.send_emails_bulk(drafts)

