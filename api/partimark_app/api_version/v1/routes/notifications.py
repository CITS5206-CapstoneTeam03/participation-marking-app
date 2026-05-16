from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....core.deps import get_current_user
from ....models.users import User, UserRole #type: ignore
from ....db.db import get_db
from ....services.email.mark_publish import draft_and_send_emails

router = APIRouter()


@router.post(
    "/publish",
    summary="Publish participation scores to all students via email",
    response_description="Number of emails successfully sent",
)
def publish_scores(
    final: bool = True,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Triggers an email dispatch to all students with their participation mark code.

    - **final=true** (default): sends Final Semester marks
    - **final=false**: sends Mid-Semester marks

    Returns the count of successfully delivered emails.
    Only accessible by authenticated admins (enforced via router dependencies in api.py).
    """
    if user.role != UserRole.UC:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only UC can publish mark",
        )

    try:
        sent_count = draft_and_send_emails(db=db, final=final)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email dispatch failed: {str(e)}",
        )

    if sent_count == 0:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Email dispatch completed but 0 emails were sent. Check SMTP configuration and student email data.",
        )

    return {
        "status": "success",
        "period": "Final Semester" if final else "Mid-Semester",
        "emails_sent": sent_count,
    }
