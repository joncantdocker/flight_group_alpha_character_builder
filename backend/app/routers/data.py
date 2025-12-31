from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import DataModel, User
from app.models.schemas import (
    DataModelCreate, 
    DataModelUpdate, 
    DataModel as DataModelSchema
)
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[DataModelSchema])
async def get_all_data(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all data entries"""
    data = db.query(DataModel).offset(skip).limit(limit).all()
    return data


@router.get("/{data_id}", response_model=DataModelSchema)
async def get_data(
    data_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific data entry by ID"""
    data = db.query(DataModel).filter(DataModel.id == data_id).first()
    if data is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return data


@router.post("/", response_model=DataModelSchema)
async def create_data(
    data: DataModelCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new data entry"""
    db_data = DataModel(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data


@router.put("/{data_id}", response_model=DataModelSchema)
async def update_data(
    data_id: int, 
    data: DataModelUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update existing data entry"""
    db_data = db.query(DataModel).filter(DataModel.id == data_id).first()
    if db_data is None:
        raise HTTPException(status_code=404, detail="Data not found")
    
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_data, field, value)
    
    db.commit()
    db.refresh(db_data)
    return db_data


@router.delete("/{data_id}")
async def delete_data(
    data_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete data entry"""
    db_data = db.query(DataModel).filter(DataModel.id == data_id).first()
    if db_data is None:
        raise HTTPException(status_code=404, detail="Data not found")
    
    db.delete(db_data)
    db.commit()
    return {"message": "Data deleted successfully"}


# Public endpoint for testing
@router.get("/public/sample")
async def get_sample_data():
    """Get sample data without authentication"""
    return {
        "message": "Hello from Flight Group Alpha API!",
        "data": [
            {"id": 1, "title": "Sample Data 1", "value": "Test Value 1"},
            {"id": 2, "title": "Sample Data 2", "value": "Test Value 2"},
        ],
        "timestamp": "2025-12-30T00:00:00Z"
    }