from fastapi import FastAPI
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime, timezone

app = FastAPI(title="FinCore Risk Analytics", version="1.0.0")

class TransactionSignal(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    recent_transaction_count: int = Field(ge=0, le=10000)
    account_age_days: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)

@app.get("/health")
def health():
    return {"status": "ok", "service": "fincore-analytics"}

@app.post("/risk-score")
def risk_score(signal: TransactionSignal):
    score = 0
    reasons = []
    if signal.amount >= Decimal("50000"):
        score += 35; reasons.append("large_transaction_amount")
    if signal.recent_transaction_count >= 8:
        score += 30; reasons.append("high_transaction_velocity")
    if signal.account_age_days < 7:
        score += 20; reasons.append("new_account")
    score = min(score, 100)
    band = "HIGH" if score >= 60 else "MEDIUM" if score >= 30 else "LOW"
    return {"score": score, "risk_band": band, "reasons": reasons,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "Decision support only; a risk score is not proof of fraud."}
