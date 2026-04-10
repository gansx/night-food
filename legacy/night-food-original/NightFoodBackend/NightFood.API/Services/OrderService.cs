using Microsoft.EntityFrameworkCore;
using NightFood.API.Data;
using NightFood.API.Models;
using NightFood.API.ViewModels;

namespace NightFood.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICouponService _couponService;

        public OrderService(ApplicationDbContext context, ICouponService couponService)
        {
            _context = context;
            _couponService = couponService;
        }

        public async Task<OrderViewModel> GetOrderByIdAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Food)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                return null;

            return MapToViewModel(order);
        }

        public async Task<List<OrderViewModel>> GetUserOrdersAsync(int userId)
        {
            var orders = await _context.Orders
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Food)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(MapToViewModel).ToList();
        }

        public async Task<OrderViewModel> CreateOrderAsync(CreateOrderViewModel model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 获取所有食品信息
                var foodIds = model.OrderDetails.Select(od => od.FoodId).ToList();
                var foods = await _context.Foods.Where(f => foodIds.Contains(f.FoodId)).ToListAsync();

                // 计算订单总金额
                decimal totalAmount = 0;
                var orderDetails = new List<OrderDetail>();

                foreach (var item in model.OrderDetails)
                {
                    var food = foods.FirstOrDefault(f => f.FoodId == item.FoodId);
                    if (food == null)
                        throw new Exception($"食品ID {item.FoodId} 不存在");

                    var subtotal = food.Price * item.Quantity;
                    totalAmount += subtotal;

                    orderDetails.Add(new OrderDetail
                    {
                        FoodId = item.FoodId,
                        Quantity = item.Quantity,
                        UnitPrice = food.Price,
                        Subtotal = subtotal
                    });
                }

                // 处理优惠券
                decimal discountAmount = 0;
                if (model.UserCouponId.HasValue)
                {
                    var userCoupon = await _context.UserCoupons
                        .Include(uc => uc.Coupon)
                        .FirstOrDefaultAsync(uc => uc.UserCouponId == model.UserCouponId.Value && !uc.IsUsed);

                    if (userCoupon != null)
                    {
                        var coupon = userCoupon.Coupon;
                        if (coupon.MinimumAmount <= totalAmount)
                        {
                            if (coupon.CouponType == "满减")
                            {
                                discountAmount = coupon.DiscountAmount ?? 0;
                            }
                            else if (coupon.CouponType == "折扣")
                            {
                                discountAmount = totalAmount * (1 - (coupon.DiscountAmount ?? 1));
                            }

                            userCoupon.IsUsed = true;
                            userCoupon.UsedTime = DateTime.Now;
                            _context.UserCoupons.Update(userCoupon);
                        }
                    }
                }

                // 创建订单
                var order = new Order
                {
                    UserId = model.UserId,
                    OrderNumber = GenerateOrderNumber(),
                    TotalAmount = totalAmount - discountAmount,
                    Status = "待支付",
                    Address = model.Address,
                    ContactPhone = model.ContactPhone,
                    ContactName = model.ContactName,
                    Remark = model.Remark,
                    CouponId = model.UserCouponId,
                    DiscountAmount = discountAmount,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // 添加订单详情
                foreach (var detail in orderDetails)
                {
                    detail.OrderId = order.OrderId;
                    _context.OrderDetails.Add(detail);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return await GetOrderByIdAsync(order.OrderId);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<OrderViewModel> UpdateOrderStatusAsync(int orderId, string status)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
                return null;

            order.Status = status;
            order.UpdatedAt = DateTime.Now;

            _context.Orders.Update(order);
            await _context.SaveChangesAsync();

            return await GetOrderByIdAsync(orderId);
        }

        private OrderViewModel MapToViewModel(Order order)
        {
            return new OrderViewModel
            {
                OrderId = order.OrderId,
                OrderNumber = order.OrderNumber,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                Address = order.Address,
                ContactPhone = order.ContactPhone,
                ContactName = order.ContactName,
                Remark = order.Remark,
                DiscountAmount = order.DiscountAmount,
                CreatedAt = order.CreatedAt,
                OrderDetails = order.OrderDetails.Select(od => new OrderDetailViewModel
                {
                    OrderDetailId = od.OrderDetailId,
                    FoodId = od.FoodId,
                    FoodName = od.Food.FoodName,
                    FoodImage = od.Food.ImageUrl,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice,
                    Subtotal = od.Subtotal
                }).ToList()
            };
        }

        private string GenerateOrderNumber()
        {
            return DateTime.Now.ToString("yyyyMMddHHmmss") + new Random().Next(1000, 9999).ToString();
        }
    }
}