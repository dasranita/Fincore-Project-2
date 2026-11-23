from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_low_risk():
    r=client.post("/risk-score",json={"amount":"100.00","recent_transaction_count":1,"account_age_days":100,"currency":"INR"})
    assert r.status_code==200 and r.json()["risk_band"]=="LOW"
def test_reject_negative_amount():
    r=client.post("/risk-score",json={"amount":"-1","recent_transaction_count":1,"account_age_days":100,"currency":"INR"})
    assert r.status_code==422
