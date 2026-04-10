using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NightFood.API.Models
{
    // 用户模型
    public class User
    {
        [Key]
        public int UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string OpenId { get; set; }
        
        [StringLength(50)]
        public string? UserName { get; set; }
        
        [StringLength(255)]
        public string? Avatar { get; set; }
        
        [StringLength(20)]
        public string? Phone { get; set; }
        
        [StringLength(255)]
        public string? Address { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        // 导航属性
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
        public virtual ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        public virtual ICollection<UserCoupon> UserCoupons { get; set; } = new List<UserCoupon>();
    }

    // 食品分类模型
    public class FoodCategory
    {
        [Key]
        public int CategoryId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string CategoryName { get; set; }
        
        public int SortOrder { get; set; } = 0;
        
        public bool IsActive { get; set; } = true;
        
        // 导航属性
        public virtual ICollection<Food> Foods { get; set; } = new List<Food>();
    }

    // 食品模型
    public class Food
    {
        [Key]
        public int FoodId { get; set; }
        
        public int? CategoryId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FoodName { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Price { get; set; }
        
        [StringLength(255)]
        public string? ImageUrl { get; set; }
        
        public bool IsAvailable { get; set; } = true;
        
        public int SortOrder { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        // 导航属性
        public virtual FoodCategory? Category { get; set; }
    }

    // 订单模型
    public class Order
    {
        [Key]
        public int OrderId { get; set; }
        
        public int UserId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal TotalAmount { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } // 待支付、已支付、已完成、已取消
        
        [StringLength(255)]
        public string? Address { get; set; }
        
        [StringLength(20)]
        public string? ContactPhone { get; set; }
        
        [StringLength(50)]
        public string? ContactName { get; set; }
        
        [StringLength(500)]
        public string? Remark { get; set; }
        
        public int? CouponId { get; set; }
        
        [Column(TypeName = "decimal(10, 2)")]
        public decimal DiscountAmount { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        // 导航属性
        public virtual User User { get; set; }
        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }

    // 订单详情模型
    public class OrderDetail
    {
        [Key]
        public int OrderDetailId { get; set; }
        
        public int OrderId { get; set; }
        
        public int FoodId { get; set; }
        
        public int Quantity { get; set; }
        
        [Column(TypeName = "decimal(10, 2)")]
        public decimal UnitPrice { get; set; }
        
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Subtotal { get; set; }
        
        // 导航属性
        public virtual Order Order { get; set; }
        public virtual Food Food { get; set; }
    }

    // 任务模型
    public class TaskItem
    {
        [Key]
        public int TaskId { get; set; }
        
        public int UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(100)]
        public string? Reward { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } // 进行中、已完成、已取消
        
        [StringLength(255)]
        public string? ImageUrl { get; set; }
        
        public DateTime? StartTime { get; set; }
        
        public DateTime? EndTime { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        // 导航属性
        public virtual User User { get; set; }
    }

    // 优惠券模型
    public class Coupon
    {
        [Key]
        public int CouponId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string CouponCode { get; set; }
        
        [Required]
        [StringLength(20)]
        public string CouponType { get; set; } // 满减、折扣
        
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? DiscountAmount { get; set; } // 满减金额或折扣率
        
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? MinimumAmount { get; set; } // 最低消费金额
        
        public DateTime StartDate { get; set; }
        
        public DateTime EndDate { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 用户优惠券关联模型
    public class UserCoupon
    {
        [Key]
        public int UserCouponId { get; set; }
        
        public int UserId { get; set; }
        
        public int CouponId { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public DateTime? UsedTime { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        // 导航属性
        public virtual User User { get; set; }
        public virtual Coupon Coupon { get; set; }
    }
}