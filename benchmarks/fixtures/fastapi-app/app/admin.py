
def list_admin_actions() -> list[str]:
    return ["disable-user", "rotate-key", "clear-cache"]

def can_run_admin_action(role: str) -> bool:
    return role == "admin"
