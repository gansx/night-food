from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel
from typing import List, Optional
import jwt
import datetime
import hashlib
import time
import os

# 创建FastAPI应用
app = FastAPI(title="NightFood API", description="学校食堂点餐系统API")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./nightfood.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 数据模型
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False)
    password = Column(String(120), nullable=False)
    avatar = Column(String(200))
    phone = Column(String(20))
    address = Column(String(200))
    
    tasks = relationship("TaskItem", back_populates="user")
    orders = relationship("Order", back_populates="user")

class FoodCategory(Base):
    __tablename__ = "food_categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(80), nullable=False)
    sort_order = Column(Integer, default=0)
    
    foods = relationship("Food", back_populates="category")

class Food(Base):
    __tablename__ = "foods"
    
    food_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("food_categories.category_id"), nullable=False)
    food_name = Column(String(80), nullable=False)
    description = Column(String(200))
    price = Column(Float, nullable=False)
    image_url = Column(String(200))
    is_available = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    category = relationship("FoodCategory", back_populates="foods")
    order_items = relationship("OrderItem", back_populates="food")

class Order(Base):
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    order_number = Column(String(50), unique=True, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")  # pending, processing, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.food_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")
    food = relationship("Food", back_populates="order_items")

class TaskItem(Base):
    __tablename__ = "tasks"
    
    task_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(200))
    status = Column(String(20), default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    
    user = relationship("User", back_populates="tasks")

# Pydantic模型
class UserBase(BaseModel):
    username: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int
    
    class Config:
        orm_mode = True

class FoodCategoryBase(BaseModel):
    category_name: str
    sort_order: Optional[int] = 0

class FoodCategoryResponse(FoodCategoryBase):
    category_id: int
    
    class Config:
        orm_mode = True

class FoodBase(BaseModel):
    category_id: int
    food_name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: Optional[bool] = True
    sort_order: Optional[int] = 0

class FoodResponse(FoodBase):
    food_id: int
    
    class Config:
        orm_mode = True

class OrderItemBase(BaseModel):
    food_id: int
    quantity: int
    price: float

class OrderItemResponse(OrderItemBase):
    item_id: int
    
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    total_amount: float
    items: List[OrderItemBase]

class OrderResponse(BaseModel):
    order_id: int
    user_id: int
    order_number: str
    total_amount: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItemResponse]
    
    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "pending"

class TaskResponse(TaskBase):
    task_id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# 工具函数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SECRET_KEY = "night-food-secret-key"
ALGORITHM = "HS256"

def get_password_hash(password):
    return hashlib.md5(password.encode()).hexdigest()

def verify_password(plain_password, hashed_password):
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.datetime.now() + datetime.timedelta(days=1)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# API路由
@app.post("/api/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    
    if not data or not data.get("username") or not data.get("password"):
        raise HTTPException(status_code=400, detail="请提供用户名和密码")
    
    db_user = db.query(User).filter(User.username == data["username"]).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    hashed_password = get_password_hash(data["password"])
    db_user = User(
        username=data["username"],
        password=hashed_password,
        avatar=data.get("avatar"),
        phone=data.get("phone"),
        address=data.get("address")
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token(data={"user_id": db_user.user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.post("/api/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请提供用户名和密码",
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    
    access_token = create_access_token(data={"user_id": user.user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/foods", response_model=List[FoodResponse])
async def get_foods(db: Session = Depends(get_db)):
    foods = db.query(Food).all()
    return foods

@app.get("/api/categories", response_model=List[FoodCategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(FoodCategory).all()
    return categories

@app.get("/api/foods/{food_id}", response_model=FoodResponse)
async def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.food_id == food_id).first()
    if food is None:
        raise HTTPException(status_code=404, detail="食品不存在")
    return food

@app.get("/")
async def root():
    return {"message": "欢迎使用学校食堂点餐系统API", "docs_url": "/docs"}

# 启动应用
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)