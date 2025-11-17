import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Email configuration from environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'BizTrack')
        
    def send_invoice_email(
        self, 
        to_email: str, 
        customer_name: str, 
        invoice_number: str, 
        invoice_total: float,
        currency: str = 'USD',
        due_date: str = None,
        invoice_pdf_path: Optional[str] = None,
        invoice_pdf_bytes: Optional[bytes] = None,
        custom_message: Optional[str] = None
    ) -> bool:
        """Send invoice email to customer"""
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
                
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"Invoice {invoice_number} - Payment Due"
            
            custom_message_section = ""
            if custom_message:
                custom_message_section = f"\n\n{custom_message}\n"
            
            body = f"""
Dear {customer_name},

Thank you for your business! Please find your invoice details below:

Invoice Number: {invoice_number}
Amount Due: {currency} {invoice_total:.2f}
Due Date: {due_date or 'As agreed'}
{custom_message_section}
Please find the invoice PDF attached to this email. Please make payment at your earliest convenience. If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your prompt payment.

Best regards,
{self.from_name}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            if invoice_pdf_bytes:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(invoice_pdf_bytes)
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename=invoice-{invoice_number}.pdf'
                )
                msg.attach(part)
            elif invoice_pdf_path and os.path.exists(invoice_pdf_path):
                with open(invoice_pdf_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename=invoice-{invoice_number}.pdf'
                    )
                    msg.attach(part)
            
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
                
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Invoice email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send invoice email to {to_email}: {str(e)}")
            return False
    
    def send_bulk_invoice_emails(
        self, 
        invoices_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send bulk invoice emails"""
        results = {
            'sent': 0,
            'failed': 0,
            'errors': []
        }
        
        for invoice_data in invoices_data:
            try:
                success = self.send_invoice_email(
                    to_email=invoice_data['customer_email'],
                    customer_name=invoice_data['customer_name'],
                    invoice_number=invoice_data['invoice_number'],
                    invoice_total=invoice_data['total'],
                    currency=invoice_data.get('currency', 'USD'),
                    due_date=invoice_data.get('due_date'),
                    invoice_pdf_path=invoice_data.get('pdf_path')
                )
                
                if success:
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to send email for invoice {invoice_data['invoice_number']}")
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error sending email for invoice {invoice_data['invoice_number']}: {str(e)}")
        
        return results
    
    def send_user_invitation_email(
        self,
        to_email: str,
        user_name: str,
        inviter_name: str,
        tenant_name: Optional[str] = None,
        role_name: Optional[str] = None,
        login_url: Optional[str] = None
    ) -> bool:
        """Send user invitation email"""
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
            
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"You've been invited to join {tenant_name or 'BizTrack'}"
            
            tenant_info = f" to {tenant_name}" if tenant_name else ""
            role_info = f" as {role_name}" if role_name else ""
            login_info = f"\n\nYou can log in at: {login_url}" if login_url else ""
            
            body = f"""
Dear {user_name},

You have been invited{tenant_info}{role_info} by {inviter_name}.

Welcome to {self.from_name}! We're excited to have you on board.

{login_info}

If you have any questions, please don't hesitate to reach out.

Best regards,
{self.from_name} Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Invitation email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            error_msg = str(e)
            if "535" in error_msg or "BadCredentials" in error_msg or "Username and Password not accepted" in error_msg:
                logger.error(f"Gmail authentication failed. Please use an App Password instead of your regular Gmail password. Error: {error_msg}")
            else:
                logger.error(f"SMTP authentication failed: {error_msg}")
            return False
        except Exception as e:
            logger.error(f"Failed to send invitation email to {to_email}: {str(e)}")
            return False
    
    def send_report_email(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> bool:
        """Send a general report email"""
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
            
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Report email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send report email to {to_email}: {str(e)}")
            return False
    
    def test_email_connection(self) -> bool:
        """Test email connection"""
        try:
            if not self.smtp_username or not self.smtp_password:
                return False
                
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Email connection test failed: {str(e)}")
            return False
