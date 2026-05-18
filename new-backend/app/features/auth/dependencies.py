from fastapi import HTTPException, Request, status


async def session_required(request: Request) -> str:
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return str(user_id)
