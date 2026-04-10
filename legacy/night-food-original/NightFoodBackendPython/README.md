# 食堂点餐系统 - Python后端

这是使用Flask框架开发的食堂点餐系统后端API。

## 功能特点

- 用户注册和登录
- 食品分类和食品管理
- 订单创建和查询
- 任务管理

## 安装步骤

1. 确保已安装Python 3.7+
2. 安装依赖包：

```bash
pip install -r requirements.txt
```

## 运行方法

```bash
python app.py
```

服务器将在 http://localhost:5000 上运行。

## API接口

### 用户相关

- POST /api/login - 用户登录
- POST /api/register - 用户注册
- GET /api/user - 获取用户信息
- PUT /api/user - 更新用户信息

### 食品相关

- GET /api/categories - 获取所有食品分类及其食品
- GET /api/foods - 获取所有食品

### 订单相关

- POST /api/orders - 创建订单
- GET /api/orders - 获取用户订单

### 任务相关

- GET /api/tasks - 获取用户任务
- POST /api/tasks - 创建任务
- PUT /api/tasks/{task_id} - 更新任务
- DELETE /api/tasks/{task_id} - 删除任务