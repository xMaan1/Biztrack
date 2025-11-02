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
        invoice_pdf_path: Optional[str] = None
    ) -> bool:
        """Send invoice email to customer"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"Invoice {invoice_number} - Payment Due"
            
            # Create email body
            body = f"""
Dear {customer_name},

Thank you for your business! Please find your invoice details below:

Invoice Number: {invoice_number}
Amount Due: {currency} {invoice_total:.2f}
Due Date: {due_date or 'As agreed'}

Please make payment at your earliest convenience. If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your prompt payment.

Best regards,
{self.from_name}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach PDF if provided
            if invoice_pdf_path and os.path.exists(invoice_pdf_path):
                with open(invoice_pdf_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= invoice-{invoice_number}.pdf'
                    )
                    msg.attach(part)
            
            # Send email
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
