import json
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[int, WebSocket]] = {}
        self.user_info: Dict[str, Dict[int, dict]] = {}
        self.user_connections: Dict[int, list[WebSocket]] = {}

    async def connect(self, session_code: str, websocket: WebSocket, user_id: int, role: str):
        await websocket.accept()
        if session_code not in self.rooms:
            self.rooms[session_code] = {}
            self.user_info[session_code] = {}
        self.rooms[session_code][user_id] = websocket
        self.user_info[session_code][user_id] = {"user_id": user_id, "role": role}
        logger.info(f"{role} {user_id} joined room {session_code}")

        await self.broadcast(session_code, {
            "type": "peer-joined",
            "user_id": user_id,
            "role": role
        }, exclude=None)

        peers = [{"user_id": uid, "role": info["role"]}
                 for uid, info in self.user_info[session_code].items()
                 if uid != user_id]
        await self.send_to(websocket, {
            "type": "room-info",
            "peers": peers,
            "your_user_id": user_id
        })

    async def disconnect(self, session_code: str, user_id: int):
        if session_code in self.rooms:
            self.rooms[session_code].pop(user_id, None)
            self.user_info[session_code].pop(user_id, None)
            if not self.rooms[session_code]:
                del self.rooms[session_code]
                del self.user_info[session_code]
                return
        await self.broadcast(session_code, {
            "type": "peer-left",
            "user_id": user_id
        }, exclude=None)

    async def broadcast(self, session_code: str, message: dict, exclude: int = None):
        if session_code not in self.rooms:
            return
        for uid, ws in self.rooms[session_code].items():
            if uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {uid}: {e}")

    async def send_to(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")

    async def handle_message(self, session_code: str, sender_id: int, data: dict):
        msg_type = data.get("type")
        target_id = data.get("target_id")

        if msg_type == "offer":
            if target_id and target_id in self.rooms.get(session_code, {}):
                await self.send_to(self.rooms[session_code][target_id], {
                    "type": "offer",
                    "from": sender_id,
                    "sdp": data["sdp"],
                    "from_role": self.user_info[session_code][sender_id]["role"]
                })

        elif msg_type == "answer":
            if target_id and target_id in self.rooms.get(session_code, {}):
                await self.send_to(self.rooms[session_code][target_id], {
                    "type": "answer",
                    "from": sender_id,
                    "sdp": data["sdp"],
                    "from_role": self.user_info[session_code][sender_id]["role"]
                })

        elif msg_type == "ice-candidate":
            if target_id and target_id in self.rooms.get(session_code, {}):
                await self.send_to(self.rooms[session_code][target_id], {
                    "type": "ice-candidate",
                    "from": sender_id,
                    "candidate": data["candidate"]
                })

        elif msg_type == "whiteboard-data":
            await self.broadcast(session_code, {
                "type": "whiteboard-data",
                "from": sender_id,
                "data_url": data["data_url"]
            }, exclude=sender_id)

        elif msg_type == "whiteboard-clear":
            await self.broadcast(session_code, {
                "type": "whiteboard-clear",
                "from": sender_id
            }, exclude=sender_id)

    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected to notification channel")

    async def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        logger.info(f"User {user_id} disconnected from notification channel")

    async def send_notification(self, user_id: int, notification_data: dict):
        if user_id in self.user_connections:
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_json({
                        "type": "notification",
                        "data": notification_data
                    })
                except Exception as e:
                    logger.error(f"Error sending notification to user {user_id}: {e}")

    async def broadcast_notification(self, user_ids: list[int], notification_data: dict):
        for uid in user_ids:
            await self.send_notification(uid, notification_data)


ws_manager = WebSocketManager()
