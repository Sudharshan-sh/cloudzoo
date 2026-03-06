import os
import shutil
import random
import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic import BaseModel
from typing import Optional
import re
from PIL import Image
import pytesseract

# Database Setup
DATABASE_URL = "sqlite:///./bills.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBBill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(String, index=True, unique=True)
    vendor = Column(String)
    date = Column(String)
    amount = Column(Float)
    category = Column(String)
    status = Column(String)
    image_url = Column(String)
    rejectReason = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CloudZoo Expense Approval API")

# Setup CORS for React frontend (default typical React dev port: 5173 or 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount it
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Pydantic models for responses and updates
class BillResponse(BaseModel):
    id: str  # maps to bill_id in DB to match frontend interface "id"
    vendor: str
    date: str
    amount: float
    category: Optional[str] = None
    status: str
    image_url: str
    rejectReason: Optional[str] = None
    
    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None

class OCRResponse(BaseModel):
    vendor: str
    date: str
    amount: str
    category: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "CloudZoo API is running! Access the React frontend (likely on port 5173 or 3000) to use the app, or go to /docs for the API swagger."}

@app.get("/api/bills", response_model=list[BillResponse])
def get_bills():
    db = SessionLocal()
    bills = db.query(DBBill).order_by(DBBill.id.desc()).all()
    db.close()
    
    # Map DB id/bill_id to frontend 'id'
    response_bills = []
    for b in bills:
        response_bills.append(BillResponse(
            id=b.bill_id,
            vendor=b.vendor,
            date=b.date,
            amount=b.amount,
            category=b.category,
            status=b.status,
            image_url=b.image_url,
            rejectReason=b.rejectReason
        ))
    return response_bills

@app.post("/api/extract-bill-data", response_model=OCRResponse)
def extract_bill_data(file: UploadFile = File(...)):
    # Save the file securely
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Perform OCR on the image
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
    except Exception as e:
        print(f"OCR Error: {e}")
        text = ""

    # Basic Heuristic Extraction from OCR text
    
    # 1. Amount Extraction (look for currency symbols or 'Total' followed by a number)
    amount_match = re.search(r'(?:Total|Amount|Rs\.?|INR|₹|\$)\s*:?\s*([\d,]+\.?\d*)', text, re.IGNORECASE)
    amount = amount_match.group(1).replace(',', '') if amount_match else ""
    
    # 2. Date Extraction (look for common date formats)
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    date = date_match.group(1) if date_match else ""
    
    # 3. Vendor Extraction (first non-empty line is often the vendor)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    vendor = lines[0] if lines else ""
    
    # 4. Category Prediction based on keywords
    text_lower = text.lower()
    if 'travel' in text_lower or 'uber' in text_lower or 'flight' in text_lower:
        category = 'Travel'
    elif 'repair' in text_lower or 'maintenance' in text_lower:
        category = 'Repair'
    elif 'courier' in text_lower or 'delivery' in text_lower:
        category = 'Courier'
    elif 'software' in text_lower or 'cloud' in text_lower:
        category = 'Software'
    else:
        category = 'Supplies'
        
    return OCRResponse(vendor=vendor, date=date, amount=amount, category=category)


@app.post("/api/upload-bill", response_model=BillResponse)
def upload_bill(
    file: UploadFile = File(...),
    vendor: str = Form(...),
    amount: float = Form(...),
    date: str = Form(...),
    category: str = Form(...)
):
    db = SessionLocal()
    
    # Save the file securely
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_count = db.query(DBBill).count()
    new_bill_id_str = f"B-{1000 + db_count + 1}"
    
    new_bill = DBBill(
        bill_id=new_bill_id_str,
        vendor=vendor,
        date=date,
        amount=amount,
        category=category,
        status="Pending Accounts",
        image_url=f"/uploads/{file.filename}"
    )
    
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    
    resp = BillResponse(
        id=new_bill.bill_id,
        vendor=new_bill.vendor,
        date=new_bill.date,
        amount=new_bill.amount,
        category=new_bill.category,
        status=new_bill.status,
        image_url=new_bill.image_url,
        rejectReason=new_bill.rejectReason
    )
    db.close()
    return resp

@app.post("/api/bills/{bill_id}/status", response_model=BillResponse)
def update_status(bill_id: str, request: StatusUpdateRequest):
    db = SessionLocal()
    bill = db.query(DBBill).filter(DBBill.bill_id == bill_id).first()
    if not bill:
        db.close()
        raise HTTPException(status_code=404, detail="Bill not found")
        
    bill.status = request.status
    if request.reason:
        bill.rejectReason = request.reason
        
    db.commit()
    db.refresh(bill)
    
    resp = BillResponse(
        id=bill.bill_id,
        vendor=bill.vendor,
        date=bill.date,
        amount=bill.amount,
        category=bill.category,
        status=bill.status,
        image_url=bill.image_url,
        rejectReason=bill.rejectReason
    )
    db.close()
    return resp

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
