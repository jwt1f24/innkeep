from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, PricingRule
from app.schemas import PricingRuleCreate, PricingRuleUpdate, PricingRuleOut
from app.database import get_db

router = APIRouter(prefix="/pricing", tags=["Pricing"])

# create a new pricing rule
@router.post("/", response_model=PricingRuleOut)
def create_pricing_rule(pricing: PricingRuleCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # label & date edge case
    if not pricing.label.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Label cannot be empty")

    if pricing.end_date <= pricing.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    # prevent duplicate period names on a specific hotel
    existing_label = db.query(PricingRule).filter(PricingRule.label == pricing.label).first()
    if existing_label is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A pricing rule with this label already exists")

    # prevent overlapping dates on a specific hotel
    conflict = db.query(PricingRule).filter(
        PricingRule.start_date <= pricing.end_date,
        PricingRule.end_date >= pricing.start_date
    ).first()
    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pricing rule that overlaps these dates already exists")

    # create pricing rule object & commit to database
    new_pricing_rule = PricingRule(label=pricing.label, start_date=pricing.start_date, end_date=pricing.end_date)
    db.add(new_pricing_rule)
    db.commit()
    db.refresh(new_pricing_rule)
    return new_pricing_rule

# fetch all existing pricing rules
@router.get("/", response_model=list[PricingRuleOut])
def get_all_pricing_rules(db: Session = Depends(get_db)):
    fetch_pricing_rules = db.query(PricingRule).all()
    return fetch_pricing_rules

# fetch pricing rule by id
@router.get("/{pricing_rule_id}", response_model=PricingRuleOut)
def get_pricing_rule_id(pricing_rule_id: int, db: Session = Depends(get_db)):
    pricing_rule = db.get(PricingRule, pricing_rule_id)
    if pricing_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")
    return pricing_rule

# update an existing pricing rule
@router.put("/{pricing_rule_id}", response_model=PricingRuleOut)
def update_pricing_rule(pricing_rule_id: int, updated: PricingRuleUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    pricing_rule = db.get(PricingRule, pricing_rule_id)
    if pricing_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")

    # prevent overlapping dates & duplicate names for a specific hotel
    new_label = updated.label.strip() if updated.label is not None else pricing_rule.label
    new_start = updated.start_date if updated.start_date is not None else pricing_rule.start_date
    new_end = updated.end_date if updated.end_date is not None else pricing_rule.end_date

    if not new_label:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Label cannot be empty")

    if new_end <= new_start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    existing_label = db.query(PricingRule).filter(
        PricingRule.label == new_label,
        PricingRule.id != pricing_rule_id
    ).first()
    if existing_label:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A pricing rule with this label already exists")

    duplicate = db.query(PricingRule).filter(
        PricingRule.start_date <= new_end,
        PricingRule.end_date >= new_start,
        PricingRule.id != pricing_rule_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pricing rule that overlaps these dates already exists")

    pricing_rule.label = new_label
    pricing_rule.start_date = new_start
    pricing_rule.end_date = new_end
    db.commit()
    db.refresh(pricing_rule)
    return pricing_rule

# delete an existing pricing rule
@router.delete("/{pricing_rule_id}", response_model=PricingRuleOut)
def delete_pricing_rule(pricing_rule_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    pricing_rule = db.get(PricingRule, pricing_rule_id)
    if pricing_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")

    db.delete(pricing_rule)
    db.commit()
    return pricing_rule
