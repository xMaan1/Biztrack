import boto3
import uuid
import os
from pathlib import Path
from typing import Optional
import logging
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.config import Config

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket_name = os.getenv('S3_BUCKET_NAME')
        self.access_key_id = os.getenv('S3_ACCESS_KEY_ID') or os.getenv('AWS_ACCESS_KEY_ID')
        self.secret_access_key = os.getenv('S3_SECRET_ACCESS_KEY') or os.getenv('AWS_SECRET_ACCESS_KEY')
        self.endpoint_url = os.getenv('S3_ENDPOINT_URL')
        self.region = os.getenv('S3_REGION') or os.getenv('AWS_REGION', 'eu-north-1')
        self.s3_client = None
        self.public_url_base = None
        self.enabled = False
        
        if not self.bucket_name:
            logger.warning("S3_BUCKET_NAME not configured. File upload functionality is disabled.")
            return
        
        if not self.access_key_id or not self.secret_access_key:
            logger.warning("S3 credentials not found. File upload functionality is disabled.")
            return
        
        try:
            client_config = {}
            boto3_config = {
                'aws_access_key_id': self.access_key_id,
                'aws_secret_access_key': self.secret_access_key,
            }
            
            if self.endpoint_url:
                boto3_config['endpoint_url'] = self.endpoint_url
                boto3_config['region_name'] = self.region
                if 'contabostorage.com' in self.endpoint_url:
                    client_config = Config(s3={'addressing_style': 'path'})
                self.public_url_base = f"{self.endpoint_url}/{self.bucket_name}"
                logger.info(f"Using S3-compatible storage (Contabo): {self.endpoint_url}")
            else:
                self.public_url_base = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com"
                boto3_config['region_name'] = self.region
                logger.info(f"Using AWS S3: {self.region}")
            
            if client_config:
                self.s3_client = boto3.client('s3', config=client_config, **boto3_config)
            else:
                self.s3_client = boto3.client('s3', **boto3_config)
            self.enabled = True
            logger.info(f"S3 service initialized for bucket: {self.bucket_name}")
        except NoCredentialsError:
            logger.warning("S3 credentials not found. File upload functionality is disabled.")
        except Exception as e:
            logger.warning(f"Failed to initialize S3 client: {str(e)}. File upload functionality is disabled.")
    
    def _check_enabled(self):
        if not self.enabled:
            raise ValueError("S3 storage is not configured. Please set S3_BUCKET_NAME, S3_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID), and S3_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY) environment variables.")
    
    def extract_s3_key_from_url(self, url: str) -> Optional[str]:
        """Extract S3 key from a full URL (works with both AWS and Contabo formats)"""
        if not url:
            return None
        
        try:
            if '/logos/' in url:
                s3_key = 'logos/' + url.split('/logos/')[-1].split('?')[0]
                return s3_key
            elif '/avatars/' in url:
                s3_key = 'avatars/' + url.split('/avatars/')[-1].split('?')[0]
                return s3_key
            elif '/documents/' in url:
                s3_key = 'documents/' + url.split('/documents/')[-1].split('?')[0]
                return s3_key
            elif '/employees/' in url:
                s3_key = 'employees/' + url.split('/employees/')[-1].split('?')[0]
                return s3_key
            else:
                if self.bucket_name and self.bucket_name in url:
                    parts = url.split(f'/{self.bucket_name}/')
                    if len(parts) > 1:
                        s3_key = parts[1].split('?')[0]
                        return s3_key
            return None
        except Exception as e:
            logger.error(f"Error extracting S3 key from URL {url}: {str(e)}")
            return None

    def upload_logo(self, file_content: bytes, tenant_id: str, original_filename: str) -> dict:
        """Upload logo to S3 and return file info"""
        self._check_enabled()
        try:
            # Generate unique filename
            file_extension = Path(original_filename).suffix.lower() if original_filename else ".png"
            unique_filename = f"logo_{uuid.uuid4().hex}{file_extension}"
            
            # S3 key (path in bucket)
            s3_key = f"logos/{tenant_id}/{unique_filename}"
            
            # Upload to S3
            put_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': self._get_content_type(file_extension),
            }
            
            # Only add ACL for AWS S3 (Contabo uses bucket-level public access)
            if not self.endpoint_url or 'contabostorage.com' not in self.endpoint_url:
                put_params['ACL'] = 'public-read'
            
            self.s3_client.put_object(**put_params)
            
            # Generate public URL
            public_url = f"{self.public_url_base}/{s3_key}"
            
            logger.info(f"Logo uploaded successfully: {s3_key}")
            
            return {
                "success": True,
                "file_url": public_url,
                "filename": unique_filename,
                "s3_key": s3_key,
                "original_filename": original_filename
            }
            
        except ClientError as e:
            logger.error(f"S3 error uploading logo: {str(e)}")
            raise Exception(f"Failed to upload logo: {str(e)}")
        except Exception as e:
            logger.error(f"Error uploading logo: {str(e)}")
            raise Exception(f"Failed to upload logo: {str(e)}")

    def delete_logo(self, s3_key: str) -> bool:
        """Delete logo from S3"""
        if not self.enabled:
            logger.warning("S3 storage not enabled, skipping logo deletion")
            return False
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Logo deleted successfully: {s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 error deleting logo: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error deleting logo: {str(e)}")
            return False

    def get_logo_url(self, s3_key: str) -> str:
        """Get public URL for a logo"""
        if not self.enabled:
            return ""
        return f"{self.public_url_base}/{s3_key}"
    
    def get_signed_url(self, s3_key: str, expiration: int = 3600) -> str:
        """Generate a signed URL for private access (valid for specified seconds)"""
        if not self.enabled:
            return ""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.error(f"Error generating signed URL: {str(e)}")
            return f"{self.public_url_base}/{s3_key}"

    def list_tenant_logos(self, tenant_id: str) -> list:
        """List all logos for a tenant"""
        if not self.enabled:
            return []
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"logos/{tenant_id}/"
            )
            
            logos = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    logos.append({
                        "s3_key": obj['Key'],
                        "filename": obj['Key'].split('/')[-1],
                        "size": obj['Size'],
                        "last_modified": obj['LastModified'],
                        "url": self.get_logo_url(obj['Key'])
                    })
            
            return logos
            
        except ClientError as e:
            logger.error(f"S3 error listing logos: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error listing logos: {str(e)}")
            return []

    def upload_file(self, file_content: bytes, tenant_id: str, folder: str, original_filename: str) -> dict:
        """Upload any file to S3 and return file info"""
        self._check_enabled()
        try:
            file_extension = Path(original_filename).suffix.lower() if original_filename else ""
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            s3_key = f"{folder}/{tenant_id}/{unique_filename}"
            
            content_type = self._get_content_type_for_all_files(file_extension)
            
            put_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': content_type,
            }
            
            # Only add ACL for AWS S3 (Contabo uses bucket-level public access)
            if not self.endpoint_url or 'contabostorage.com' not in self.endpoint_url:
                put_params['ACL'] = 'public-read'
            
            self.s3_client.put_object(**put_params)
            
            public_url = f"{self.public_url_base}/{s3_key}"
            
            logger.info(f"File uploaded successfully: {s3_key}")
            
            return {
                "success": True,
                "file_url": public_url,
                "filename": unique_filename,
                "s3_key": s3_key,
                "original_filename": original_filename,
                "content_type": content_type
            }
            
        except ClientError as e:
            logger.error(f"S3 error uploading file: {str(e)}")
            raise Exception(f"Failed to upload file: {str(e)}")
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def delete_file(self, s3_key: str) -> bool:
        """Delete any file from S3"""
        if not self.enabled:
            logger.warning("S3 storage not enabled, skipping file deletion")
            return False
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"File deleted successfully: {s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 error deleting file: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')
    
    def _get_content_type_for_all_files(self, file_extension: str) -> str:
        """Get content type for all file types"""
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')

    def test_connection(self) -> bool:
        """Test S3 connection"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info("S3 connection test successful")
            return True
        except ClientError as e:
            logger.error(f"S3 connection test failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"S3 connection test failed: {str(e)}")
            return False
    
    def verify_file_access(self, s3_key: str) -> bool:
        """Verify if a file is publicly accessible"""
        if not self.enabled:
            return False
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            logger.error(f"File access verification failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error verifying file access: {str(e)}")
            return False

# Create singleton instance
s3_service = S3Service()
