import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, update the OAuth2 permissions accordingly
SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleMeetService:
    def __init__(self):
        self.credentials = None
        self.service = None
        self._load_credentials()
    
    def _load_credentials(self):
        """Load Google API credentials using service account or OAuth2 client secrets"""
        try:
            # First try service account credentials
            service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if not service_account_path:
                # Try to find service-account.json in the backend directory
                service_account_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'service-account.json')
            
            if os.path.exists(service_account_path):
                try:
                    from google.oauth2 import service_account
                    # Load service account credentials
                    self.credentials = service_account.Credentials.from_service_account_file(
                        service_account_path,
                        scopes=SCOPES
                    )
                    
                    # Build the service
                    self.service = build('calendar', 'v3', credentials=self.credentials)
                    print("✅ Google API credentials loaded successfully using service account")
                    return
                    
                except Exception as e:
                    print(f"Failed to load service account: {e}")
                    # Continue to OAuth2 flow
            
            # Try OAuth2 client secrets as fallback
            client_secrets_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'client_secrets.json')
            if not os.path.exists(client_secrets_path):
                client_secrets_path = 'client_secrets.json'
            
            if os.path.exists(client_secrets_path):
                # Check if we have a saved token
                token_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'token.pickle')
                if os.path.exists(token_path):
                    try:
                        import pickle
                        with open(token_path, 'rb') as token:
                            self.credentials = pickle.load(token)
                        
                        # If credentials are expired, refresh them
                        if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                            self.credentials.refresh(Request())
                            with open(token_path, 'wb') as token:
                                pickle.dump(self.credentials, token)
                        
                        # Build the service
                        self.service = build('calendar', 'v3', credentials=self.credentials)
                        print("✅ Google API credentials loaded successfully from saved OAuth2 token")
                        return
                        
                    except Exception as e:
                        print(f"Failed to load saved OAuth2 token: {e}")
            
            # No valid credentials found
            print("⚠️ No valid Google credentials found - Google Meet integration disabled")
            self.service = None
            
        except Exception as e:
            print(f"❌ Failed to load Google API credentials: {e}")
            print("Google Meet integration will be disabled")
            # Don't raise exception - let the service continue without Google integration
            self.service = None
    
    def create_meeting(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Calendar event with Google Meet"""
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Meet integration not available - no valid credentials',
                    'event_id': None,
                    'meet_link': None
                }
            
            # Prepare event data for Google Calendar
            start_time = event_data.get('startDate')
            end_time = event_data.get('endDate')
            
            # Convert datetime strings to proper format
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            if isinstance(end_time, str):
                end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
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
                'attendees': [{'email': email} for email in event_data.get('participants', [])],
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"meet-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                }
            }
            
            # Create the event
            event = self.service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1
            ).execute()
            
            # Extract meeting link
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
            print(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}",
                'event_id': None,
                'meet_link': None
            }
        except Exception as e:
            print(f"Error creating meeting: {e}")
            return {
                'success': False,
                'error': str(e),
                'event_id': None,
                'meet_link': None
            }
    
    def update_meeting(self, event_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a Google Calendar event"""
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar service not available'
                }
            
            # Get existing event
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Update event data
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
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event
            ).execute()
            
            return {
                'success': True,
                'event': updated_event
            }
            
        except HttpError as error:
            print(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}"
            }
        except Exception as e:
            print(f"Error updating meeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_meeting(self, event_id: str) -> Dict[str, Any]:
        """Delete a Google Calendar event"""
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar service not available'
                }
            
            # Delete the event
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            
            return {
                'success': True
            }
            
        except HttpError as error:
            print(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}"
            }
        except Exception as e:
            print(f"Error deleting meeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }