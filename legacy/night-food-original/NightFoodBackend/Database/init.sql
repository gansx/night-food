-- 创建数据库
CREATE DATABASE NightFoodDB;
GO

USE NightFoodDB;
GO

-- 用户表
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    OpenId NVARCHAR(100) UNIQUE NOT NULL,
    UserName NVARCHAR(50),
    Avatar NVARCHAR(255),
    Phone NVARCHAR(20),
    Address NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- 食品分类表
CREATE TABLE FoodCategories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(50) NOT NULL,
    SortOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1
);

-- 食品表
CREATE TABLE Foods (
    FoodId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT FOREIGN KEY REFERENCES FoodCategories(CategoryId),
    FoodName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Price DECIMAL(10, 2) NOT NULL,
    ImageUrl NVARCHAR(255),
    IsAvailable BIT DEFAULT 1,
    SortOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- 订单表
CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    OrderNumber NVARCHAR(50) UNIQUE NOT NULL,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    Status NVARCHAR(20) NOT NULL, -- 待支付、已支付、已完成、已取消
    Address NVARCHAR(255),
    ContactPhone NVARCHAR(20),
    ContactName NVARCHAR(50),
    Remark NVARCHAR(500),
    CouponId INT NULL,
    DiscountAmount DECIMAL(10, 2) DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- 订单详情表
CREATE TABLE OrderDetails (
    OrderDetailId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES Orders(OrderId),
    FoodId INT FOREIGN KEY REFERENCES Foods(FoodId),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL
);

-- 任务表
CREATE TABLE Tasks (
    TaskId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Reward NVARCHAR(100),
    Status NVARCHAR(20) NOT NULL, -- 进行中、已完成、已取消
    StartTime DATETIME,
    EndTime DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- 优惠券表
CREATE TABLE Coupons (
    CouponId INT IDENTITY(1,1) PRIMARY KEY,
    CouponCode NVARCHAR(50) UNIQUE NOT NULL,
    CouponType NVARCHAR(20) NOT NULL, -- 满减、折扣
    DiscountAmount DECIMAL(10, 2), -- 满减金额或折扣率
    MinimumAmount DECIMAL(10, 2), -- 最低消费金额
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 用户优惠券关联表
CREATE TABLE UserCoupons (
    UserCouponId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    CouponId INT FOREIGN KEY REFERENCES Coupons(CouponId),
    IsUsed BIT DEFAULT 0,
    UsedTime DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 插入初始数据
-- 食品分类
INSERT INTO FoodCategories (CategoryName, SortOrder) VALUES 
('夜宵主食', 1),
('小吃', 2),
('饮料', 3);

-- 食品
INSERT INTO Foods (CategoryId, FoodName, Description, Price, ImageUrl, IsAvailable, SortOrder) VALUES 
(1, '炒面', '香辣可口的炒面', 15.00, 'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png', 1, 1),
(1, '炒饭', '美味蛋炒饭', 12.00, 'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png', 1, 2),
(2, '鸡翅', '香辣鸡翅', 18.00, 'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png', 1, 1),
(3, '可乐', '冰镇可乐', 5.00, 'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png', 1, 1);

-- 优惠券
INSERT INTO Coupons (CouponCode, CouponType, DiscountAmount, MinimumAmount, StartDate, EndDate, IsActive) VALUES 
('NEW10', '满减', 10.00, 50.00, '2023-01-01', '2023-12-31', 1),
('DISC20', '折扣', 0.8, 30.00, '2023-01-01', '2023-12-31', 1);