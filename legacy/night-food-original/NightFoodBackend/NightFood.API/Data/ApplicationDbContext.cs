using Microsoft.EntityFrameworkCore;
using NightFood.API.Models;

namespace NightFood.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<FoodCategory> FoodCategories { get; set; }
        public DbSet<Food> Foods { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<UserCoupon> UserCoupons { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 配置实体关系和约束
            modelBuilder.Entity<User>()
                .HasIndex(u => u.OpenId)
                .IsUnique();

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId);

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Order)
                .WithMany(o => o.OrderDetails)
                .HasForeignKey(od => od.OrderId);

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Food)
                .WithMany()
                .HasForeignKey(od => od.FoodId);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.UserId);

            modelBuilder.Entity<UserCoupon>()
                .HasOne(uc => uc.User)
                .WithMany(u => u.UserCoupons)
                .HasForeignKey(uc => uc.UserId);

            modelBuilder.Entity<UserCoupon>()
                .HasOne(uc => uc.Coupon)
                .WithMany()
                .HasForeignKey(uc => uc.CouponId);

            modelBuilder.Entity<Food>()
                .HasOne(f => f.Category)
                .WithMany(c => c.Foods)
                .HasForeignKey(f => f.CategoryId);
        }
    }
}