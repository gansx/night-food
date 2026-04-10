using System.ComponentModel.DataAnnotations;

namespace NightFood.API.ViewModels
{
    // 用户视图模型
    public class UserViewModel
    {
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public string? Avatar { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }

    public class UpdateUserViewModel
    {
        public string? UserName { get; set; }
        public string? Avatar { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }

    // 食品分类视图模型
    public class FoodCategoryViewModel
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int SortOrder { get; set; }
        public List<FoodViewModel> Foods { get; set; } = new List<FoodViewModel>();
    }

    // 食品视图模型
    public class FoodViewModel
    {
        public int FoodId { get; set; }
        public int? CategoryId { get; set; }
        public string FoodName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public int SortOrder { get; set; }
    }

    // 订单视图模型
    public class OrderViewModel
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string? Address { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactName { get; set; }
        public string? Remark { get; set; }
        public decimal DiscountAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderDetailViewModel> OrderDetails { get; set; } = new List<OrderDetailViewModel>();
    }

    public class OrderDetailViewModel
    {
        public int OrderDetailId { get; set; }
        public int FoodId { get; set; }
        public string FoodName { get; set; }
        public string? FoodImage { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
    }

    public class CreateOrderViewModel
    {
        public int UserId { get; set; }
        public string? Address { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactName { get; set; }
        public string? Remark { get; set; }
        public int? UserCouponId { get; set; }
        public List<CreateOrderDetailViewModel> OrderDetails { get; set; } = new List<CreateOrderDetailViewModel>();
    }

    public class CreateOrderDetailViewModel
    {
        public int FoodId { get; set; }
        public int Quantity { get; set; }
    }

    // 任务视图模型
    public class TaskViewModel
    {
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Reward { get; set; }
        public string Status { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTaskViewModel
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(100)]
        public string? Reward { get; set; }
        
        public DateTime? StartTime { get; set; }
        
        public DateTime? EndTime { get; set; }
    }

    public class UpdateTaskViewModel
    {
        [StringLength(100)]
        public string? Title { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(100)]
        public string? Reward { get; set; }
        
        [StringLength(20)]
        public string? Status { get; set; }
        
        public DateTime? StartTime { get; set; }
        
        public DateTime? EndTime { get; set; }
    }

    // 优惠券视图模型
    public class CouponViewModel
    {
        public int UserCouponId { get; set; }
        public int CouponId { get; set; }
        public string CouponCode { get; set; }
        public string CouponType { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? MinimumAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsUsed { get; set; }
        public DateTime? UsedTime { get; set; }
    }

    // 微信登录结果
    public class WechatLoginResult
    {
        public bool Success { get; set; }
        public string? Token { get; set; }
        public UserViewModel? User { get; set; }
        public bool IsNew { get; set; }
        public string? ErrorMessage { get; set; }
    }

    // API响应模型
    public class ApiResponse<T>
    {
        public int Code { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; }
        public bool IsNew { get; set; }

        public static ApiResponse<T> Success(T data, string message = "操作成功", bool isNew = false)
        {
            return new ApiResponse<T>
            {
                Code = 200,
                Message = message,
                Data = data,
                IsNew = isNew
            };
        }

        public static ApiResponse<T> Fail(string message = "操作失败", int code = 400)
        {
            return new ApiResponse<T>
            {
                Code = code,
                Message = message,
                Data = default,
                IsNew = false
            };
        }
    }
}