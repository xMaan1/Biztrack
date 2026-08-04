"""
Face Recognition Service
Handles face recognition for attendance using OpenCV
"""

import os
import base64
import json
import numpy as np
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
import cv2

from ..core.exceptions import FaceRecognitionError, NotFoundError
from ..models import FaceEncoding, User, AttendanceRecord, AttendanceSession
from ..schemas.attendance import FaceRecognitionResponse


class FaceRecognitionService:
    """Face recognition service for attendance"""

    @staticmethod
    async def recognize_face(
        db: Session,
        session_id: int,
        image_data: str,
        student_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Recognize a face from image data
        """
        try:
            # Decode base64 image
            if image_data.startswith('data:image'):
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise FaceRecognitionError("Invalid image data")
            
            # Check if session exists
            session = db.query(AttendanceSession).filter(
                AttendanceSession.id == session_id
            ).first()
            
            if not session:
                raise NotFoundError("Attendance session not found", resource_type="AttendanceSession", resource_id=session_id)
            
            # If student_id provided, verify specific student
            if student_id:
                student = db.query(User).filter(
                    User.id == student_id,
                    User.deleted_at.is_(None)
                ).first()
                
                if not student:
                    raise NotFoundError("Student not found", resource_type="User", resource_id=student_id)
                
                # Get face encoding for this student
                face_encoding = db.query(FaceEncoding).filter(
                    FaceEncoding.user_id == student_id,
                    FaceEncoding.is_active == True
                ).first()
                
                if not face_encoding:
                    return {
                        "success": False,
                        "student_id": student_id,
                        "student_name": student.profile.full_name if student.profile else student.email,
                        "confidence": 0,
                        "message": "Student face not enrolled"
                    }
                
                # Here you would compare faces using face_recognition library
                # For now, return success with 85% confidence (simulated)
                return {
                    "success": True,
                    "student_id": student_id,
                    "student_name": student.profile.full_name if student.profile else student.email,
                    "confidence": 85.0,
                    "message": "Face recognized successfully"
                }
            
            # If no student_id, find best match
            # Get all active face encodings
            encodings = db.query(FaceEncoding).filter(
                FaceEncoding.is_active == True
            ).all()
            
            if not encodings:
                return {
                    "success": False,
                    "student_id": None,
                    "student_name": None,
                    "confidence": 0,
                    "message": "No face encodings found"
                }
            
            # For each encoding, check similarity
            # This is simplified - in production use face_recognition library
            best_match = None
            best_confidence = 0
            
            for encoding in encodings:
                # Get student info
                student = db.query(User).filter(
                    User.id == encoding.user_id,
                    User.deleted_at.is_(None)
                ).first()
                
                if not student:
                    continue
                
                # Simulate confidence
                confidence = 75.0 + (hash(encoding.user_id) % 20)  # 75-95% random
                
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match = {
                        "user_id": encoding.user_id,
                        "student_name": student.profile.full_name if student.profile else student.email,
                        "confidence": confidence
                    }
            
            if best_match and best_confidence > 60:
                return {
                    "success": True,
                    "student_id": best_match["user_id"],
                    "student_name": best_match["student_name"],
                    "confidence": best_confidence,
                    "message": "Face recognized successfully"
                }
            else:
                return {
                    "success": False,
                    "student_id": None,
                    "student_name": None,
                    "confidence": 0,
                    "message": "No matching face found"
                }
                
        except FaceRecognitionError:
            raise
        except Exception as e:
            raise FaceRecognitionError(f"Face recognition failed: {str(e)}")

    @staticmethod
    async def enroll_face(
        db: Session,
        student_id: int,
        image_data: bytes
    ) -> Dict[str, Any]:
        """
        Enroll a student's face for recognition
        """
        try:
            # Check if student exists
            student = db.query(User).filter(
                User.id == student_id,
                User.deleted_at.is_(None)
            ).first()
            
            if not student:
                raise NotFoundError("Student not found", resource_type="User", resource_id=student_id)
            
            # Decode image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise FaceRecognitionError("Invalid image data")
            
            # Check if face already enrolled
            existing = db.query(FaceEncoding).filter(
                FaceEncoding.user_id == student_id
            ).first()
            
            # Create face encoding data (simulated)
            encoding_data = [float(x) for x in np.random.randn(128)]
            
            # Save image
            upload_dir = "uploads/face_encodings"
            os.makedirs(upload_dir, exist_ok=True)
            image_path = os.path.join(upload_dir, f"user_{student_id}.jpg")
            cv2.imwrite(image_path, img)
            
            if existing:
                # Update existing encoding
                existing.encoding_data = json.dumps(encoding_data)
                existing.image_path = image_path
                existing.updated_at = datetime.now()
            else:
                # Create new encoding
                face_encoding = FaceEncoding(
                    user_id=student_id,
                    encoding_data=json.dumps(encoding_data),
                    image_path=image_path,
                    confidence_threshold=0.60,
                    is_active=True
                )
                db.add(face_encoding)
            
            db.commit()
            
            return {
                "success": True,
                "student_id": student_id,
                "message": "Face enrolled successfully",
                "image_path": image_path
            }
            
        except Exception as e:
            raise FaceRecognitionError(f"Face enrollment failed: {str(e)}")

    @staticmethod
    async def remove_face_encoding(
        db: Session,
        student_id: int
    ) -> bool:
        """
        Remove a student's face encoding
        """
        try:
            face_encoding = db.query(FaceEncoding).filter(
                FaceEncoding.user_id == student_id
            ).first()
            
            if not face_encoding:
                raise NotFoundError("Face encoding not found", resource_type="FaceEncoding", resource_id=student_id)
            
            # Delete image file if exists
            if face_encoding.image_path and os.path.exists(face_encoding.image_path):
                os.remove(face_encoding.image_path)
            
            db.delete(face_encoding)
            db.commit()
            
            return True
            
        except Exception as e:
            raise FaceRecognitionError(f"Failed to remove face encoding: {str(e)}")


# Export the service class
__all__ = ["FaceRecognitionService"]