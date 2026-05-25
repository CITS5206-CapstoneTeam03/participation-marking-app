import smtplib
from email.message import EmailMessage
import logging
from typing import List, Dict

from ...core.config import settings

logger = logging.getLogger(__name__)

class EmailSender:
    """
    A utility class to send emails via SMTP using credentials from environment variables.
    
    If using an organizational Outlook/Office365 account:
    1. Ensure "SMTP AUTH" is enabled for the account by your IT administrator.
    2. If MFA (Multi-Factor Authentication) is enforced, you MUST generate and use an "App Password" 
       instead of your regular password.
    """
    def __init__(self):
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.user = settings.smtp_user
        self.password = settings.smtp_pass
        self.from_email = settings.smtp_from_email

        self.is_configured = all([self.host, self.user, self.password, self.from_email])

    def send_emails_bulk(self, emails_data: List[Dict[str, str]]) -> int:
        """
        Sends multiple emails in a single SMTP session.
        emails_data should be a list of dictionaries:
        [
            {"to": "student@student.uwa.edu.au", "subject": "Your Mark", "body": "HTML/Text body"}
        ]
        Returns the number of successfully sent emails.
        """
        if not self.is_configured:
            logger.error("EmailSender is not fully configured. Please set SMTP variables in .env.")
            return 0

        successful_sends = 0
        try:
            # Start SMTP session (Office365 uses STARTTLS on port 587)
            server = smtplib.SMTP(self.host, self.port)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(self.user, self.password)

            for email_data in emails_data:
                msg = EmailMessage()
                msg['Subject'] = email_data['subject']
                msg['From'] = self.from_email
                msg['To'] = email_data['to']
                msg.set_content(email_data['body'])

                try:
                    server.send_message(msg)
                    successful_sends += 1
                except Exception as e:
                    logger.error(f"Failed to send email to {email_data['to']}: {e}")

            server.quit()
        except Exception as e:
            logger.error(f"SMTP session failed: {e}")

        return successful_sends
