from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import time
import os
import hashlib
from functools import wraps

# 创建Flask应用
app = Flask(__name__)
CORS(app)

# 配置
app.config['SECRET_KEY'] = 'night-food-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nightfood.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db = SQLAlchemy(app)

# 数据模型
class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    avatar = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    
    tasks = db.relationship('TaskItem', backref='user', lazy=True)
    orders = db.relationship('Order', backref='user', lazy=True)

class FoodCategory(db.Model):
    __tablename__ = 'food_categories'
    
    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(80), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    
    foods = db.relationship('Food', backref='category', lazy=True)

class Food(db.Model):
    __tablename__ = 'foods'
    
    food_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('food_categories.category_id'), nullable=False)
    food_name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200))
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    
    order_items = db.relationship('OrderItem', backref='food', lazy=True)

class Order(db.Model):
    __tablename__ = 'orders'
    
    order_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    food_id = db.Column(db.Integer, db.ForeignKey('foods.food_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

class TaskItem(db.Model):
    __tablename__ = 'tasks'
    
    task_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

# 工具函数
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': '缺少认证令牌'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(user_id=data['user_id']).first()
        except:
            return jsonify({'message': '无效的认证令牌'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def get_password_hash(password):
    return hashlib.md5(password.encode()).hexdigest()

def verify_password(plain_password, hashed_password):
    return get_password_hash(plain_password) == hashed_password

# 用户相关路由
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': '请提供用户名和密码'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': '用户名已存在'}), 400
    
    hashed_password = get_password_hash(data['password'])
    
    new_user = User(
        username=data['username'],
        password=hashed_password,
        avatar=data.get('avatar'),
        phone=data.get('phone'),
        address=data.get('address')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # 生成令牌
    token = jwt.encode(
        {
            'user_id': new_user.user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        },
        app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    return jsonify({
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'user_id': new_user.user_id,
            'username': new_user.username,
            'avatar': new_user.avatar,
            'phone': new_user.phone,
            'address': new_user.address
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    auth = request.get_json()
    
    if not auth or not auth.get('username') or not auth.get('password'):
        return jsonify({'message': '请提供用户名和密码'}), 401
    
    user = User.query.filter_by(username=auth['username']).first()
    
    if not user or not verify_password(auth['password'], user.password):
        return jsonify({'message': '用户名或密码错误'}), 401
    
    # 生成令牌
    token = jwt.encode(
        {
            'user_id': user.user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        },
        app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    return jsonify({
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'user_id': user.user_id,
            'username': user.username,
            'avatar': user.avatar,
            'phone': user.phone,
            'address': user.address
        }
    })

@app.route('/api/user', methods=['GET'])
@token_required
def get_user_info(current_user):
    return jsonify({
        'user_id': current_user.user_id,
        'username': current_user.username,
        'avatar': current_user.avatar,
        'phone': current_user.phone,
        'address': current_user.address
    })

@app.route('/api/user', methods=['PUT'])
@token_required
def update_user_info(current_user):
    data = request.get_json()
    
    if data.get('username'):
        current_user.username = data['username']
    if data.get('avatar'):
        current_user.avatar = data['avatar']
    if data.get('phone'):
        current_user.phone = data['phone']
    if data.get('address'):
        current_user.address = data['address']
    
    db.session.commit()
    
    return jsonify({
        'user_id': current_user.user_id,
        'username': current_user.username,
        'avatar': current_user.avatar,
        'phone': current_user.phone,
        'address': current_user.address
    })

# 食品分类和食品路由
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = FoodCategory.query.order_by(FoodCategory.sort_order).all()
    
    result = []
    for category in categories:
        foods = []
        for food in category.foods:
            if food.is_available:
                foods.append({
                    'food_id': food.food_id,
                    'food_name': food.food_name,
                    'description': food.description,
                    'price': food.price,
                    'image_url': food.image_url,
                    'is_available': food.is_available,
                    'sort_order': food.sort_order,
                    'category_id': food.category_id
                })
        
        result.append({
            'category_id': category.category_id,
            'category_name': category.category_name,
            'sort_order': category.sort_order,
            'foods': foods
        })
    
    return jsonify(result)

@app.route('/api/foods', methods=['GET'])
def get_foods():
    foods = Food.query.filter_by(is_available=True).order_by(Food.sort_order).all()
    
    result = []
    for food in foods:
        result.append({
            'food_id': food.food_id,
            'food_name': food.food_name,
            'description': food.description,
            'price': food.price,
            'image_url': food.image_url,
            'is_available': food.is_available,
            'sort_order': food.sort_order,
            'category_id': food.category_id
        })
    
    return jsonify(result)

# 订单路由
@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    data = request.get_json()
    
    if not data or not data.get('items') or len(data['items']) == 0:
        return jsonify({'message': '订单必须包含至少一个商品'}), 400
    
    # 生成订单号
    order_number = f"ORD{int(time.time())}{current_user.user_id}"
    
    # 计算总金额
    total_amount = 0
    for item in data['items']:
        food = Food.query.get(item['food_id'])
        if not food:
            return jsonify({'message': f"食品ID {item['food_id']} 不存在"}), 400
        total_amount += food.price * item['quantity']
    
    # 创建订单
    new_order = Order(
        user_id=current_user.user_id,
        order_number=order_number,
        total_amount=total_amount,
        status='pending'
    )
    
    db.session.add(new_order)
    db.session.flush()
    
    # 添加订单项
    order_items = []
    for item in data['items']:
        food = Food.query.get(item['food_id'])
        new_item = OrderItem(
            order_id=new_order.order_id,
            food_id=food.food_id,
            quantity=item['quantity'],
            price=food.price
        )
        db.session.add(new_item)
        order_items.append({
            'item_id': new_item.item_id,
            'food_id': food.food_id,
            'quantity': item['quantity'],
            'price': food.price,
            'food_name': food.food_name
        })
    
    db.session.commit()
    
    return jsonify({
        'order_id': new_order.order_id,
        'order_number': new_order.order_number,
        'total_amount': new_order.total_amount,
        'status': new_order.status,
        'created_at': new_order.created_at.isoformat(),
        'items': order_items
    }), 201

@app.route('/api/orders', methods=['GET'])
@token_required
def get_user_orders(current_user):
    orders = Order.query.filter_by(user_id=current_user.user_id).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = []
        for item in order.items:
            food = Food.query.get(item.food_id)
            items.append({
                'item_id': item.item_id,
                'food_id': item.food_id,
                'quantity': item.quantity,
                'price': item.price,
                'food_name': food.food_name if food else None
            })
        
        result.append({
            'order_id': order.order_id,
            'order_number': order.order_number,
            'total_amount': order.total_amount,
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'items': items
        })
    
    return jsonify(result)

# 任务路由
@app.route('/api/tasks', methods=['GET'])
@token_required
def get_user_tasks(current_user):
    tasks = TaskItem.query.filter_by(user_id=current_user.user_id).order_by(TaskItem.created_at.desc()).all()
    
    result = []
    for task in tasks:
        result.append({
            'task_id': task.task_id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'message': '任务必须包含标题'}), 400
    
    new_task = TaskItem(
        user_id=current_user.user_id,
        title=data['title'],
        description=data.get('description'),
        status=data.get('status', 'pending')
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({
        'task_id': new_task.task_id,
        'title': new_task.title,
        'description': new_task.description,
        'status': new_task.status,
        'created_at': new_task.created_at.isoformat(),
        'updated_at': new_task.updated_at.isoformat()
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    task = TaskItem.query.filter_by(task_id=task_id, user_id=current_user.user_id).first()
    
    if not task:
        return jsonify({'message': '任务不存在或无权限'}), 404
    
    data = request.get_json()
    
    if data.get('title'):
        task.title = data['title']
    if data.get('description') is not None:
        task.description = data['description']
    if data.get('status'):
        task.status = data['status']
    
    db.session.commit()
    
    return jsonify({
        'task_id': task.task_id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat()
    })

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    task = TaskItem.query.filter_by(task_id=task_id, user_id=current_user.user_id).first()
    
    if not task:
        return jsonify({'message': '任务不存在或无权限'}), 404
    
    db.session.delete(task)
    db.session.commit()
    
    return '', 204

# 初始化数据库和添加初始数据
@app.before_first_request
def create_tables():
    db.create_all()
    
    # 检查是否需要添加初始数据
    if FoodCategory.query.count() == 0:
        # 添加食品分类
        categories = [
            FoodCategory(category_name="主食", sort_order=1),
            FoodCategory(category_name="小吃", sort_order=2),
            FoodCategory(category_name="饮料", sort_order=3)
        ]
        db.session.add_all(categories)
        db.session.commit()
        
        # 添加食品
        foods = [
            Food(category_id=1, food_name="米饭", price=2.0, description="香喷喷的米饭", image_url="/static/images/rice.jpg", sort_order=1),
            Food(category_id=1, food_name="面条", price=8.0, description="美味的面条", image_url="/static/images/noodles.jpg", sort_order=2),
            Food(category_id=2, food_name="薯条", price=6.0, description="酥脆可口的薯条", image_url="/static/images/fries.jpg", sort_order=1),
            Food(category_id=2, food_name="鸡翅", price=10.0, description="香辣鸡翅", image_url="/static/images/wings.jpg", sort_order=2),
            Food(category_id=3, food_name="可乐", price=3.0, description="冰镇可乐", image_url="/static/images/cola.jpg", sort_order=1),
            Food(category_id=3, food_name="果汁", price=5.0, description="新鲜果汁", image_url="/static/images/juice.jpg", sort_order=2)
        ]
        db.session.add_all(foods)
        db.session.commit()

# 启动应用
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)