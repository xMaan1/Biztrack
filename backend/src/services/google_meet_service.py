import os
import json
import uuid
import re
import logging
import base64
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ..config.database import get_oauth_token_decrypted, create_or_update_oauth_token, get_user_by_email

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']

EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email.strip())) if email else False

def filter_valid_emails(participants: List[str]) -> List[str]:
    valid_emails = []
    invalid_emails = []
    
    for participant in participants:
        if isinstance(participant, str):
            participant = participant.strip()
            if is_valid_email(participant):
                valid_emails.append(participant)
            else:
                invalid_emails.append(participant)
    
    if invalid_emails:
        logger.warning(f"Filtered out invalid email addresses: {invalid_emails}")
    
    return valid_emails

class GoogleMeetService:
    def __init__(self, user_email: Optional[str] = None, db: Optional[Session] = None):
        self.credentials = None
        self.service = None
        self.user_email = user_email
        self.db = db
        self.user_id = None
        
        if user_email and db:
            user = get_user_by_email(user_email, db)
            if user:
                self.user_id = str(user.id)
        
        if user_email and db:
            self._load_credentials()
        elif user_email:
            logger.warning("Database session is required for OAuth token management")
    
    def _load_credentials(self):
        if not self.db or not self.user_id:
            self.service = None
            return
            
        try:
            token_data = get_oauth_token_decrypted(self.user_id, "google", self.db)
            
            if not token_data:
                self.service = None
                return
            
            try:
                self.credentials = Credentials.from_authorized_user_info(token_data, SCOPES)
                
                if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                    self.credentials.refresh(Request())
                    expires_at = None
                    if self.credentials.expiry:
                        expires_at = self.credentials.expiry
                    create_or_update_oauth_token(
                        self.user_id,
                        "google",
                        json.loads(self.credentials.to_json()),
                        expires_at,
                        self.db
                    )
                
                self.service = build('calendar', 'v3', credentials=self.credentials)
            except Exception as e:
                logger.error(f"Failed to load OAuth2 token: {e}")
                self.service = None
                
        except Exception as e:
            logger.error(f"Failed to load OAuth2 credentials: {e}")
            self.service = None
    
    def get_authorization_url(self, redirect_uri: Optional[str] = None) -> str:
        client_secrets_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'client_secrets.json')
        if not os.path.exists(client_secrets_path):
            client_secrets_path = 'client_secrets.json'
        
        if not os.path.exists(client_secrets_path):
            raise FileNotFoundError("client_secrets.json not found. Please set up OAuth2 credentials.")
        
        with open(client_secrets_path, 'r') as f:
            client_config = json.load(f)
        
        if not redirect_uri:
            base_url = os.getenv("API_URL") or os.getenv("BASE_URL") or "https://www.biztrack.uk"
            if base_url.endswith('/'):
                base_url = base_url.rstrip('/')
            redirect_uri = f"{base_url}/events/google/callback"
        
        if 'web' in client_config:
            client_info = client_config['web']
            redirect_uris = client_info.get('redirect_uris', [])
            if redirect_uri not in redirect_uris:
                logger.warning(f"Redirect URI {redirect_uri} not in client_secrets.json redirect_uris. Make sure it's added to Google Cloud Console.")
        else:
            redirect_uri = redirect_uri or 'urn:ietf:wg:oauth:2.0:oob'
        
        flow = Flow.from_client_secrets_file(
            client_secrets_path,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        
        state = None
        if self.user_email:
            state_data = {"email": self.user_email}
            state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
        
        auth_url, _ = flow.authorization_url(
            prompt='consent',
            access_type='offline',
            state=state
        )
        return auth_url
    
    def authorize(self, authorization_code: str, redirect_uri: Optional[str] = None, db: Optional[Session] = None) -> bool:
        if not db:
            db = self.db
        if not db or not self.user_id:
            logger.error("Database session and user_id are required for authorization")
            return False
            
        try:
            client_secrets_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'client_secrets.json')
            if not os.path.exists(client_secrets_path):
                client_secrets_path = 'client_secrets.json'
            
            if not os.path.exists(client_secrets_path):
                raise FileNotFoundError("client_secrets.json not found")
            
            with open(client_secrets_path, 'r') as f:
                client_config = json.load(f)
            
            if not redirect_uri:
                base_url = os.getenv("API_URL") or os.getenv("BASE_URL") or "https://www.biztrack.uk"
                if base_url.endswith('/'):
                    base_url = base_url.rstrip('/')
                redirect_uri = f"{base_url}/events/google/callback"
            
            if 'web' in client_config:
                client_info = client_config['web']
                redirect_uris = client_info.get('redirect_uris', [])
                if redirect_uri not in redirect_uris:
                    logger.warning(f"Redirect URI {redirect_uri} not in client_secrets.json redirect_uris. Make sure it's added to Google Cloud Console.")
            else:
                redirect_uri = redirect_uri or 'urn:ietf:wg:oauth:2.0:oob'
            
            flow = Flow.from_client_secrets_file(
                client_secrets_path,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
            flow.fetch_token(code=authorization_code)
            
            self.credentials = flow.credentials
            if not self.credentials:
                logger.error("Failed to obtain credentials from authorization code")
                return False
            
            token_json = self.credentials.to_json()
            token_data = json.loads(token_json)
            expires_at = None
            if self.credentials.expiry:
                expires_at = self.credentials.expiry
            
            create_or_update_oauth_token(
                self.user_id,
                "google",
                token_data,
                expires_at,
                db
            )
            
            self.service = build('calendar', 'v3', credentials=self.credentials)
            logger.info(f"Successfully authorized and saved token for {self.user_email}")
            return True
        except Exception as e:
            logger.error(f"Authorization failed: {e}", exc_info=True)
            return False
    
    def is_authorized(self, db: Optional[Session] = None) -> bool:
        if not self.user_email:
            return False
        
        if db:
            self.db = db
            if not self.user_id:
                user = get_user_by_email(self.user_email, db)
                if user:
                    self.user_id = str(user.id)
        
        if not self.db or not self.user_id:
            return False
        
        if self.service is not None:
            return True
        
        try:
            token_data = get_oauth_token_decrypted(self.user_id, "google", self.db)
            if not token_data or not isinstance(token_data, dict):
                return False
            
            if 'token' not in token_data and 'access_token' not in token_data:
                return False
            
            self._load_credentials()
            return self.service is not None
        except Exception as e:
            logger.debug(f"Error checking authorization status: {e}")
            return False
    
    def _get_calendar_id(self) -> str:
        return 'primary'
    
    def create_meeting(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar not authorized',
                    'event_id': None,
                    'meet_link': None
                }
            
            start_time = event_data.get('startDate')
            end_time = event_data.get('endDate')
            
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            if isinstance(end_time, str):
                end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            participants = event_data.get('participants', [])
            valid_emails = filter_valid_emails(participants) if participants else []
            
            event = {
                'summary': event_data.get('title', 'Meeting'),
                'description': event_data.get('description', ''),
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': event_data.get('timezone', 'UTC'),
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': event_data.get('timezone', 'UTC'),
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                }
            }
            
            if valid_emails:
                event['attendees'] = [{'email': email} for email in valid_emails]
            
            calendar_id = self._get_calendar_id()
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event,
                conferenceDataVersion=1
            ).execute()
            
            meet_link = None
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry in event['conferenceData']['entryPoints']:
                    if entry['entryPointType'] == 'video':
                        meet_link = entry['uri']
                        break
            
            return {
                'success': True,
                'event_id': event['id'],
                'meet_link': meet_link,
                'event': event
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}",
                'event_id': None,
                'meet_link': None
            }
        except Exception as e:
            logger.error(f"Error creating meeting: {e}")
            return {
                'success': False,
                'error': str(e),
                'event_id': None,
                'meet_link': None
            }
    
    def update_meeting(self, event_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar service not available'
                }
            
            calendar_id = self._get_calendar_id()
            event = self.service.events().get(calendarId=calendar_id, eventId=event_id).execute()
            
            if 'title' in update_data:
                event['summary'] = update_data['title']
            if 'description' in update_data:
                event['description'] = update_data['description']
            if 'startDate' in update_data:
                start_time = update_data['startDate']
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                event['start'] = {
                    'dateTime': start_time.isoformat(),
                    'timeZone': update_data.get('timezone', 'UTC'),
                }
            if 'endDate' in update_data:
                end_time = update_data['endDate']
                if isinstance(end_time, str):
                    end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                event['end'] = {
                    'dateTime': end_time.isoformat(),
                    'timeZone': update_data.get('timezone', 'UTC'),
                }
            
            calendar_id = self._get_calendar_id()
            updated_event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()
            
            return {
                'success': True,
                'event': updated_event
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}"
            }
        except Exception as e:
            logger.error(f"Error updating meeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_meeting(self, event_id: str) -> Dict[str, Any]:
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar service not available'
                }
            
            calendar_id = self._get_calendar_id()
            self.service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            
            return {
                'success': True
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}"
            }
        except Exception as e:
            logger.error(f"Error deleting meeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }
