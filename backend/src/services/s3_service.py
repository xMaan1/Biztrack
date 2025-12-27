import boto3
import uuid
import os
from pathlib import Path
from typing import Optional
import logging
from botocore.exceptions import ClientError, NoCredentialsError

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket_name = os.getenv('S3_BUCKET_NAME')
        self.region = os.getenv('AWS_REGION', 'eu-north-1')
        self.s3_client = None
        self.public_url_base = None
        self.enabled = False
        
        if not self.bucket_name:
            logger.warning("S3_BUCKET_NAME not configured. File upload functionality is disabled.")
            return
        
        try:
            self.public_url_base = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com"
            self.s3_client = boto3.client(
                's3',
                region_name=self.region,
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
            )
            self.enabled = True
            logger.info(f"S3 service initialized for bucket: {self.bucket_name}")
        except NoCredentialsError:
            logger.warning("AWS credentials not found. File upload functionality is disabled.")
        except Exception as e:
            logger.warning(f"Failed to initialize S3 client: {str(e)}. File upload functionality is disabled.")
    
    def _check_enabled(self):
        if not self.enabled:
            raise ValueError("S3 storage is not configured. Please set S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.")

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
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=self._get_content_type(file_extension),
                ACL='public-read'  # Make it publicly readable
            )
            
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
            logger.error(f"AWS S3 error uploading logo: {str(e)}")
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
            logger.error(f"AWS S3 error deleting logo: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error deleting logo: {str(e)}")
            return False

    def get_logo_url(self, s3_key: str) -> str:
        """Get public URL for a logo"""
        if not self.enabled:
            return ""
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
            logger.error(f"AWS S3 error listing logos: {str(e)}")
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
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'
            )
            
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
            logger.error(f"AWS S3 error uploading file: {str(e)}")
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
            logger.error(f"AWS S3 error deleting file: {str(e)}")
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

# Create singleton instance
s3_service = S3Service()
