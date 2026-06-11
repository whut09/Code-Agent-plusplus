from dataclasses import dataclass

@dataclass
class User:
    id: int
    email: str
    status: str = 'active'
