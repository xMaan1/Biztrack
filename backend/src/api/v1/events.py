from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid
import logging
import base64
import json
import os

from ...config.database import get_db, get_event_by_id, get_all_events, create_event, update_event, delete_event, get_events_by_project, get_events_by_user, get_upcoming_events, get_user_by_email
from ...models.unified_models import EventCreate, EventUpdate, Event, EventResponse, EventType, EventStatus, RecurrenceType
from ...api.dependencies import get_current_user, get_tenant_context
from ...services.google_meet_service import GoogleMeetService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])

class AuthorizationCodeRequest(BaseModel):
    code: str

def convert_event_to_response(event):
    """Convert database event object to response model"""
    # Check if the meet link is valid, if not, set it to None
    google_meet_link = event.googleMeetLink
    if google_meet_link and ('_meet/whoops' in google_meet_link or not google_meet_link.startswith('https://meet.google.com/')):
        # Invalid meet link, set to None so frontend can handle it
        google_meet_link = None
    
    return {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "eventType": event.eventType,
        "startDate": event.startDate,
        "endDate": event.endDate,
        "timezone": event.timezone,
        "location": event.location,
        "isOnline": event.isOnline,
        "googleMeetLink": google_meet_link,
        "googleCalendarEventId": event.googleCalendarEventId,
        "recurrenceType": event.recurrenceType,
        "recurrenceData": event.recurrenceData,
        "reminderMinutes": event.reminderMinutes,
        "participants": event.participants or [],
        "discussionPoints": event.discussionPoints or [],
        "attachments": event.attachments or [],
        "projectId": str(event.projectId) if event.projectId else None,
        "status": event.status,
        "createdBy": str(event.createdById),
        "tenant_id": str(event.tenant_id),
        "createdAt": event.createdAt,
        "updatedAt": event.updatedAt
    }

@router.post("/", response_model=Event)
async def create_new_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new event with Google Meet integration"""
    try:
        event_data = event.dict()
        event_data['id'] = str(uuid.uuid4())
        event_data['tenant_id'] = str(tenant_context['tenant_id'])
        event_data['createdById'] = str(current_user.id)
        event_data['createdAt'] = datetime.utcnow()
        event_data['updatedAt'] = datetime.utcnow()
        
        if event_data.get('projectId') == '':
            event_data['projectId'] = None
        if event_data.get('location') == '':
            event_data['location'] = None
            
        if 'eventType' in event_data and hasattr(event_data['eventType'], 'value'):
            event_data['eventType'] = event_data['eventType'].value
        if 'recurrenceType' in event_data and hasattr(event_data['recurrenceType'], 'value'):
            event_data['recurrenceType'] = event_data['recurrenceType'].value
        if 'status' in event_data and hasattr(event_data['status'], 'value'):
            event_data['status'] = event_data['status'].value
        
        if event_data.get('isOnline', False):
            user_email = current_user.email if hasattr(current_user, 'email') else None
            if not user_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User email is required for online events with Google Meet integration"
                )
            
            google_meet_service = GoogleMeetService(user_email=user_email, db=db)
            
            if not google_meet_service.is_authorized(db):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Google Calendar authorization required. Please authorize your Google account first to create events with Google Meet links."
                )
            
            try:
                meet_result = google_meet_service.create_meeting(event_data)
                
                if not meet_result.get('success'):
                    error_msg = meet_result.get('error', 'Unknown error')
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create Google Meet link: {error_msg}"
                    )
                
                event_data['googleMeetLink'] = meet_result.get('meet_link')
                event_data['googleCalendarEventId'] = meet_result.get('event_id')
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Google Meet creation failed: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create Google Meet link: {str(e)}"
                )
        
        db_event = create_event(event_data, db)
        return convert_event_to_response(db_event)
        
    except Exception as e:
        logger.error(f"Failed to create event: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create event: {str(e)}"
        )

@router.get("/", response_model=EventResponse)
async def get_events(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all events with optional filtering"""
    try:
        if project_id:
            events = get_events_by_project(project_id, db, str(tenant_context['tenant_id']))
        elif user_id:
            events = get_events_by_user(user_id, db, str(tenant_context['tenant_id']))
        else:
            events = get_all_events(db, str(tenant_context['tenant_id']), skip, limit)
        
        # Apply status filter if provided
        if status_filter:
            events = [event for event in events if event.status == status_filter]
        
        # Convert database objects to response models
        events_response = [convert_event_to_response(event) for event in events]
        
        return {
            "events": events_response,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": len(events)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch events: {str(e)}"
        )

@router.get("/upcoming", response_model=EventResponse)
async def get_upcoming_events_route(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get upcoming events for the next N days"""
    try:
        events = get_upcoming_events(db, str(tenant_context['tenant_id']), days)
        
        # Convert database objects to response models
        events_response = [convert_event_to_response(event) for event in events]
        
        return {
            "events": events_response,
            "pagination": {
                "total": len(events),
                "days": days
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch upcoming events: {str(e)}"
        )

@router.get("/{event_id}", response_model=Event)
async def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific event by ID"""
    try:
        event = get_event_by_id(event_id, db, str(tenant_context['tenant_id']))
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Convert database object to response model
        return convert_event_to_response(event)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch event: {str(e)}"
        )

@router.put("/{event_id}", response_model=Event)
async def update_existing_event(
    event_id: str,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing event"""
    try:
        # Get existing event
        existing_event = get_event_by_id(event_id, db, str(tenant_context['tenant_id']))
        if not existing_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Prepare update data
        update_data = event_update.dict(exclude_unset=True)
        update_data['updatedAt'] = datetime.utcnow()
        
        if existing_event.googleCalendarEventId and update_data:
            user_email = current_user.email if hasattr(current_user, 'email') else None
            if user_email:
                google_meet_service = GoogleMeetService(user_email=user_email, db=db)
                if google_meet_service.is_authorized(db):
                    try:
                        meet_result = google_meet_service.update_meeting(
                            existing_event.googleCalendarEventId,
                            update_data
                        )
                        if not meet_result['success']:
                            logger.error(f"Google Calendar update failed: {meet_result.get('error')}")
                    except Exception as e:
                        logger.error(f"Google Calendar integration error: {e}")
        
        # Update event in database
        updated_event = update_event(event_id, update_data, db, str(tenant_context['tenant_id']))
        
        if not updated_event:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update event"
            )
        
        # Convert database object to response model
        return convert_event_to_response(updated_event)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update event: {str(e)}"
        )

@router.delete("/{event_id}")
async def delete_existing_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete an existing event"""
    try:
        # Get existing event
        existing_event = get_event_by_id(event_id, db, str(tenant_context['tenant_id']))
        if not existing_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        if existing_event.googleCalendarEventId:
            user_email = current_user.email if hasattr(current_user, 'email') else None
            if user_email:
                google_meet_service = GoogleMeetService(user_email=user_email, db=db)
                if google_meet_service.is_authorized(db):
                    try:
                        meet_result = google_meet_service.delete_meeting(existing_event.googleCalendarEventId)
                        if not meet_result['success']:
                            logger.error(f"Google Calendar deletion failed: {meet_result.get('error')}")
                    except Exception as e:
                        logger.error(f"Google Calendar integration error: {e}")
        
        # Delete event from database
        success = delete_event(event_id, db, str(tenant_context['tenant_id']))
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete event"
            )
        
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete event: {str(e)}"
        )

@router.post("/{event_id}/regenerate-meet-link")
async def regenerate_meet_link(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Regenerate Google Meet link for an existing event"""
    try:
        # Get existing event
        existing_event = get_event_by_id(event_id, db, str(tenant_context['tenant_id']))
        if not existing_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if event is online
        if not existing_event.isOnline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate meet link for offline events"
            )
        
        user_email = current_user.email if hasattr(current_user, 'email') else None
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email is required for Google Meet integration"
            )
        
        google_meet_service = GoogleMeetService(user_email=user_email, db=db)
        
        if not google_meet_service.is_authorized(db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Google Calendar authorization required. Please authorize your Google account first."
            )
        
        try:
            meet_result = google_meet_service.create_meeting({
                'id': str(existing_event.id),
                'title': existing_event.title,
                'startDate': existing_event.startDate,
                'endDate': existing_event.endDate
            })
            
            if not meet_result['success']:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate meet link: {meet_result.get('error')}"
                )
            
            update_data = {
                'googleMeetLink': meet_result.get('meet_link'),
                'googleCalendarEventId': meet_result.get('event_id'),
                'updatedAt': datetime.utcnow()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Google Meet integration error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate meet link: {str(e)}"
            )
        
        updated_event = update_event(event_id, update_data, db, str(tenant_context['tenant_id']))
        
        if not updated_event:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update event with new meet link"
            )
        
        # Convert database object to response model
        return convert_event_to_response(updated_event)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate meet link: {str(e)}"
        )

@router.post("/{event_id}/join")
async def join_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Join an event (add user to participants)"""
    try:
        event = get_event_by_id(event_id, db, str(tenant_context['tenant_id']))
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        participants = event.participants or []
        if str(current_user.id) not in participants:
            participants.append(str(current_user.id))
            
            update_data = {
                'participants': participants,
                'updatedAt': datetime.utcnow()
            }
            
            updated_event = update_event(event_id, update_data, db, str(tenant_context['tenant_id']))
            if not updated_event:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to join event"
                )
        
        return {
            "message": "Successfully joined event",
            "meet_link": event.googleMeetLink
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join event: {str(e)}"
        )

@router.get("/google/authorize")
async def get_google_authorization_url(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Google OAuth2 authorization URL"""
    try:
        user_email = current_user.email if hasattr(current_user, 'email') else None
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email is required"
            )
        
        origin = request.headers.get("origin") or request.headers.get("referer")
        redirect_uri = None
        
        if origin:
            origin = origin.rstrip('/')
            if 'localhost' in origin or '127.0.0.1' in origin:
                api_url = os.getenv("API_URL") or "http://localhost:8000"
                if api_url.endswith('/'):
                    api_url = api_url.rstrip('/')
                redirect_uri = f"{api_url}/events/google/callback"
            else:
                base_url = os.getenv("API_URL") or os.getenv("BASE_URL") or "https://www.biztrack.uk"
                if base_url.endswith('/'):
                    base_url = base_url.rstrip('/')
                redirect_uri = f"{base_url}/events/google/callback"
        else:
            base_url = os.getenv("API_URL") or os.getenv("BASE_URL") or "https://www.biztrack.uk"
            if base_url.endswith('/'):
                base_url = base_url.rstrip('/')
            redirect_uri = f"{base_url}/events/google/callback"
        
        google_meet_service = GoogleMeetService(user_email=user_email, db=db)
        auth_url = google_meet_service.get_authorization_url(redirect_uri=redirect_uri)
        
        return {
            "authorization_url": auth_url
        }
    except Exception as e:
        logger.error(f"Failed to get authorization URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get authorization URL: {str(e)}"
        )

@router.get("/google/callback")
async def google_oauth_callback_get(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth2 callback redirect (GET request from Google)"""
    logger.info(f"OAuth callback received - code: {bool(code)}, state: {bool(state)}, error: {error}")
    try:
        if error:
            error_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                    .error {{ color: #d32f2f; }}
                </style>
            </head>
            <body>
                <h1 class="error">Authorization Failed</h1>
                <p>Error: {error}</p>
                <p>Please try again.</p>
                <script>
                    setTimeout(function() {{
                        window.close();
                    }}, 3000);
                </script>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=400)
        
        if not code:
            error_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1 class="error">Authorization Failed</h1>
                <p>No authorization code received.</p>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=400)
        
        if not state:
            error_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1 class="error">Authorization Failed</h1>
                <p>Invalid authorization request. Please try again.</p>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=400)
        
        user_email = None
        try:
            state_data = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
            user_email = state_data.get('email')
            if not user_email or not isinstance(user_email, str):
                raise ValueError("Invalid email in state")
        except Exception as e:
            logger.error(f"Failed to decode or validate state: {e}")
            error_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1 class="error">Authorization Failed</h1>
                <p>Invalid authorization request. Please try again.</p>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=400)
        
        user = get_user_by_email(user_email, db)
        if not user:
            logger.error(f"User not found for email in OAuth callback: {user_email}")
            error_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1 class="error">Authorization Failed</h1>
                <p>User account not found. Please contact support.</p>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=400)
        
        host = request.headers.get("host") or ""
        scheme = request.url.scheme if hasattr(request.url, 'scheme') else "https"
        if 'localhost' in host or '127.0.0.1' in host:
            redirect_uri = f"http://{host}/events/google/callback"
        else:
            base_url = os.getenv("API_URL") or os.getenv("BASE_URL") or "https://www.biztrack.uk"
            if base_url.endswith('/'):
                base_url = base_url.rstrip('/')
            redirect_uri = f"{base_url}/events/google/callback"
        
        logger.info(f"Processing OAuth authorization for user: {user_email}")
        google_meet_service = GoogleMeetService(user_email=user_email, db=db)
        success = google_meet_service.authorize(code, redirect_uri=redirect_uri, db=db)
        
        logger.info(f"OAuth authorization result: {success}")
        if success:
            success_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Successful</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .success { color: #2e7d32; font-size: 24px; margin-bottom: 10px; }
                    .message { color: #666; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="success">✓ Authorization Successful!</h1>
                    <p class="message">Google Calendar has been connected successfully.</p>
                    <p class="message">This window will close automatically...</p>
                </div>
                <script>
                    (function() {
                        var messageSent = false;
                        var attempts = 0;
                        var maxAttempts = 10;
                        
                        function sendMessage() {
                            if (messageSent) return;
                            attempts++;
                            
                            try {
                                if (window.opener && !window.opener.closed) {
                                    window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                                    messageSent = true;
                                    console.log('Message sent to parent window');
                                    setTimeout(function() {
                                        if (window.opener) {
                                            window.close();
                                        }
                                    }, 500);
                                } else {
                                    console.log('No opener window found, attempt', attempts);
                                    if (attempts < maxAttempts) {
                                        setTimeout(sendMessage, 200);
                                    } else {
                                        setTimeout(function() {
                                            window.close();
                                        }, 2000);
                                    }
                                }
                            } catch (e) {
                                console.error('Error sending message:', e);
                                if (attempts < maxAttempts) {
                                    setTimeout(sendMessage, 200);
                                } else {
                                    setTimeout(function() {
                                        window.close();
                                    }, 2000);
                                }
                            }
                        }
                        
                        window.addEventListener('load', function() {
                            sendMessage();
                        });
                        
                        if (document.readyState === 'complete' || document.readyState === 'interactive') {
                            sendMessage();
                        }
                        
                        setTimeout(function() {
                            if (!messageSent) {
                                sendMessage();
                            }
                        }, 100);
                    })();
                </script>
            </body>
            </html>
            """
            response = HTMLResponse(content=success_html)
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors *;"
            return response
        else:
            error_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authorization Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1 class="error">Authorization Failed</h1>
                <p>Failed to complete authorization. Please try again.</p>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=400)
            
    except Exception as e:
        logger.error(f"Authorization callback failed: {e}")
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authorization Failed</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                .error {{ color: #d32f2f; }}
            </style>
        </head>
        <body>
            <h1 class="error">Authorization Failed</h1>
            <p>An error occurred: {str(e)}</p>
            <script>
                setTimeout(function() {{
                    window.close();
                }}, 3000);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=500)

@router.post("/google/callback")
async def google_oauth_callback(
    request: AuthorizationCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Handle Google OAuth2 callback with authorization code (manual code submission)"""
    try:
        user_email = current_user.email if hasattr(current_user, 'email') else None
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email is required"
            )
        
        google_meet_service = GoogleMeetService(user_email=user_email, db=db)
        success = google_meet_service.authorize(request.code, db=db)
        
        if success:
            return {
                "message": "Google Calendar authorization successful. You can now create events with Google Meet links."
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization failed. Please try again."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authorization callback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authorization failed: {str(e)}"
        )

@router.get("/google/status")
async def get_google_authorization_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has authorized Google Calendar"""
    try:
        user_email = current_user.email if hasattr(current_user, 'email') else None
        if not user_email:
            return {"authorized": False, "message": "User email is required"}
        
        google_meet_service = GoogleMeetService(user_email=user_email, db=db)
        return {
            "authorized": google_meet_service.is_authorized(db),
            "message": "Authorized" if google_meet_service.is_authorized(db) else "Not authorized. Please authorize first."
        }
    except Exception as e:
        logger.error(f"Failed to check authorization status: {e}")
        return {"authorized": False, "message": f"Error: {str(e)}"}

@router.post("/{event_id}/leave")
async def leave_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Leave an event (remove user from participants)"""
    try:
        event = get_event_by_id(event_id, db, str(tenant_context['tenant_id']))
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Remove user from participants
        participants = event.participants or []
        if str(current_user.id) in participants:
            participants.remove(str(current_user.id))
            
            update_data = {
                'participants': participants,
                'updatedAt': datetime.utcnow()
            }
            
            updated_event = update_event(event_id, update_data, db, str(tenant_context['tenant_id']))
            if not updated_event:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to leave event"
                )
        
        return {"message": "Successfully left event"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to leave event: {str(e)}"
        )
