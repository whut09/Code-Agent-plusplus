
from dataclasses import dataclass

@dataclass
class Invoice:
    id: int
    total: float
    status: str

def calculate_total(lines: list[float]) -> float:
    return sum(lines)

def format_invoice(invoice: Invoice) -> dict[str, object]:
    return {"id": invoice.id, "total": invoice.total, "status": invoice.status}
