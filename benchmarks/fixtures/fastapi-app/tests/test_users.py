from app.routes.users import get_user

def test_user_response_includes_status():
    response = get_user(1)
    assert response.status == 'active'
