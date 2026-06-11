from fastapi import APIRouter
from app.models import User
from app.schemas import UserResponse

router = APIRouter()

@router.get('/users/{user_id}', response_model=UserResponse)
def get_user(user_id: int) -> UserResponse:
    user = User(id=user_id, email='ada@example.com')
    return UserResponse(id=user.id, email=user.email, status=user.status)
