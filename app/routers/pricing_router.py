from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, PricingRule
from app.schemas import PricingRuleCreate, PricingRuleUpdate, PricingRuleOut
from app.database import get_db

router = APIRouter(prefix="/pricing", tags=["Pricing"])

# create a new pricing rule
@router.post("/", response_model=PricingRuleOut)
async def create_pricing_rule(pricing: PricingRuleCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_pricing_rule = PricingRule(hotel_id=pricing.hotel_id, label=pricing.label, start_date=pricing.start_date, end_date=pricing.end_date)
    db.add(new_pricing_rule)
    db.commit()
    db.refresh(new_pricing_rule)
    return new_pricing_rule

# fetch all existing pricing rules
@router.get("/", response_model=list[PricingRuleOut])
async def get_all_pricing_rules(db: Session = Depends(get_db)):
    fetch_pricing_rules = db.query(PricingRule).all()
    return fetch_pricing_rules

# fetch pricing rule by id
@router.get("/{pricing_rule_id}", response_model=PricingRuleOut)
async def get_pricing_rule_id(pricing_rule_id: int, db: Session = Depends(get_db)):
    pricing_rule = db.get(PricingRule, pricing_rule_id)
    if pricing_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")
    return pricing_rule

# update an existing pricing rule
@router.put("/{pricing_rule_id}", response_model=PricingRuleOut)
async def update_pricing_rule(pricing_rule_id: int, updated: PricingRuleUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    pricing_rule = db.get(PricingRule, pricing_rule_id)
    if pricing_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")

    if updated.label is not None:
        pricing_rule.label = updated.label
    if updated.start_date is not None:
        pricing_rule.start_date = updated.start_date
    if updated.end_date is not None:
        pricing_rule.end_date = updated.end_date

    db.commit()
    db.refresh(pricing_rule)
    return pricing_rule

# delete an existing pricing rule
@router.delete("/{pricing_rule_id}", response_model=PricingRuleOut)
async def delete_pricing_rule(pricing_rule_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    pricing_rule = db.get(PricingRule, pricing_rule_id)
    if pricing_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")

    db.delete(pricing_rule)
    db.commit()
    return pricing_rule
