from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel
from typing import List, Optional
import jwt
import datetime
import time
import os
import hashlib
from datetime import timedelta

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

# JWT配置
SECRET_KEY = "night-food-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24小时

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# 数据模型
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    tasks = relationship("TaskItem", back_populates="user")
    orders = relationship("Order", back_populates="user")

class FoodCategory(Base):
    __tablename__ = "food_categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, index=True)
    sort_order = Column(Integer, default=0)
    
    foods = relationship("Food", back_populates="category")

class Food(Base):
    __tablename__ = "foods"
    
    food_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("food_categories.category_id"))
    food_name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    category = relationship("FoodCategory", back_populates="foods")
    order_items = relationship("OrderItem", back_populates="food")

class Order(Base):
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    order_number = Column(String, unique=True, index=True)
    total_amount = Column(Float)
    status = Column(String, default="pending")  # pending, processing, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    food_id = Column(Integer, ForeignKey("foods.food_id"))
    quantity = Column(Integer)
    price = Column(Float)
    
    order = relationship("Order", back_populates="items")
    food = relationship("Food", back_populates="order_items")

class TaskItem(Base):
    __tablename__ = "tasks"
    
    task_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String)
    description = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="tasks")

# Pydantic模型
class UserBase(BaseModel):
    username: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class FoodBase(BaseModel):
    food_name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool = True
    sort_order: int = 0

class FoodResponse(FoodBase):
    food_id: int
    category_id: int
    
    class Config:
        orm_mode = True

class CategoryBase(BaseModel):
    name: str
    sort_order: int = 0

class CategoryResponse(CategoryBase):
    category_id: int
    foods: List[FoodResponse] = []
    
    class Config:
        orm_mode = True

class OrderItemBase(BaseModel):
    food_id: int
    quantity: int

class OrderItemResponse(BaseModel):
    item_id: int
    food_id: int
    quantity: int
    price: float
    food_name: Optional[str] = None
    
    class Config:
        orm_mode = True

class OrderCreate(BaseModel):
    items: List[OrderItemBase]

class OrderResponse(BaseModel):
    order_id: int
    order_number: str
    total_amount: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItemResponse] = []
    
    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "pending"

class TaskResponse(TaskBase):
    task_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    class Config:
        orm_mode = True

# 依赖项
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str):
    return hashlib.md5(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str):
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except:
        raise credentials_exception
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# 初始化数据库
@app.on_event("startup")
def startup_db_client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 检查是否需要添加初始数据
    if db.query(FoodCategory).count() == 0:
        # 添加食品分类
        categories = [
            FoodCategory(category_name="主食", sort_order=1),
            FoodCategory(category_name="小吃", sort_order=2),
            FoodCategory(category_name="饮料", sort_order=3)
        ]
        db.add_all(categories)
        db.commit()
        
        # 添加食品
        foods = [
            Food(category_id=1, food_name="米饭", price=2.0, description="香喷喷的米饭", image_url="/static/images/rice.jpg", sort_order=1),
            Food(category_id=1, food_name="面条", price=8.0, description="美味的面条", image_url="/static/images/noodles.jpg", sort_order=2),
            Food(category_id=2, food_name="薯条", price=6.0, description="酥脆可口的薯条", image_url="/static/images/fries.jpg", sort_order=1),
            Food(category_id=2, food_name="鸡翅", price=10.0, description="香辣鸡翅", image_url="/static/images/wings.jpg", sort_order=2),
            Food(category_id=3, food_name="可乐", price=3.0, description="冰镇可乐", image_url="/static/images/cola.jpg", sort_order=1),
            Food(category_id=3, food_name="果汁", price=5.0, description="新鲜果汁", image_url="/static/images/juice.jpg", sort_order=2)
        ]
        db.add_all(foods)
        db.commit()
    
    db.close()

# 用户相关路由
@app.post("/api/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        password=hashed_password,
        avatar=user.avatar,
        phone=user.phone,
        address=user.address
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.user_id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.post("/api/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/user", response_model=UserResponse)
def get_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/api/user", response_model=UserResponse)
def update_user_info(user_update: UserBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.username = user_update.username
    current_user.avatar = user_update.avatar
    current_user.phone = user_update.phone
    current_user.address = user_update.address
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

# 食品分类和食品路由
@app.get("/api/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(FoodCategory).order_by(FoodCategory.sort_order).all()
    return categories

@app.get("/api/foods", response_model=List[FoodResponse])
def get_foods(db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.is_available == True).order_by(Food.sort_order).all()
    return foods

# 订单路由
@app.post("/api/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not order.items or len(order.items) == 0:
        raise HTTPException(status_code=400, detail="订单必须包含至少一个商品")
    
    # 生成订单号
    order_number = f"ORD{int(time.time())}{current_user.user_id}"
    
    # 计算总金额
    total_amount = 0
    for item in order.items:
        food = db.query(Food).filter(Food.food_id == item.food_id).first()
        if not food:
            raise HTTPException(status_code=400, detail=f"食品ID {item.food_id} 不存在")
        total_amount += food.price * item.quantity
    
    # 创建订单
    db_order = Order(
        user_id=current_user.user_id,
        order_number=order_number,
        total_amount=total_amount,
        status="pending"
    )
    
    db.add(db_order)
    db.flush()
    
    # 添加订单项
    for item in order.items:
        food = db.query(Food).filter(Food.food_id == item.food_id).first()
        db_item = OrderItem(
            order_id=db_order.order_id,
            food_id=food.food_id,
            quantity=item.quantity,
            price=food.price
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    
    # 构建响应
    response_items = []
    for item in db_order.items:
        food = db.query(Food).filter(Food.food_id == item.food_id).first()
        response_items.append(OrderItemResponse(
            item_id=item.item_id,
            food_id=item.food_id,
            quantity=item.quantity,
            price=item.price,
            food_name=food.food_name if food else None
        ))
    
    return OrderResponse(
        order_id=db_order.order_id,
        order_number=db_order.order_number,
        total_amount=db_order.total_amount,
        status=db_order.status,
        created_at=db_order.created_at,
        items=response_items
    )

@app.get("/api/orders", response_model=List[OrderResponse])
def get_user_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == current_user.user_id).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = []
        for item in order.items:
            food = db.query(Food).filter(Food.food_id == item.food_id).first()
            items.append(OrderItemResponse(
                item_id=item.item_id,
                food_id=item.food_id,
                quantity=item.quantity,
                price=item.price,
                food_name=food.food_name if food else None
            ))
        
        result.append(OrderResponse(
            order_id=order.order_id,
            order_number=order.order_number,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at,
            items=items
        ))
    
    return result

# 任务路由
@app.get("/api/tasks", response_model=List[TaskResponse])
def get_user_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(TaskItem).filter(TaskItem.user_id == current_user.user_id).order_by(TaskItem.created_at.desc()).all()
    return tasks

@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: TaskBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = TaskItem(
        user_id=current_user.user_id,
        title=task.title,
        description=task.description,
        status=task.status
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return db_task

@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(TaskItem).filter(TaskItem.task_id == task_id, TaskItem.user_id == current_user.user_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="任务不存在或无权限")
    
    db_task.title = task_update.title
    db_task.description = task_update.description
    db_task.status = task_update.status
    
    db.commit()
    db.refresh(db_task)
    
    return db_task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(TaskItem).filter(TaskItem.task_id == task_id, TaskItem.user_id == current_user.user_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="任务不存在或无权限")
    
    db.delete(db_task)
    db.commit()
    
    return None

# 启动应用
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)