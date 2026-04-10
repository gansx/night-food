using Microsoft.EntityFrameworkCore;
using NightFood.API.Data;
using NightFood.API.Models;
using NightFood.API.ViewModels;

namespace NightFood.API.Services
{
    public class CouponService : ICouponService
    {
        private readonly ApplicationDbContext _context;

        public CouponService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<CouponViewModel>> GetUserCouponsAsync(int userId)
        {
            var userCoupons = await _context.UserCoupons
                .Include(uc => uc.Coupon)
                .Where(uc => uc.UserId == userId && !uc.IsUsed && uc.Coupon.EndDate >= DateTime.Now && uc.Coupon.IsActive)
                .OrderByDescending(uc => uc.CreatedAt)
                .ToListAsync();

            return userCoupons.Select(MapToViewModel).ToList();
        }

        public async Task<CouponViewModel> AssignCouponToUserAsync(int userId, int couponId)
        {
            var coupon = await _context.Coupons.FindAsync(couponId);
            if (coupon == null || !coupon.IsActive || coupon.EndDate < DateTime.Now)
                return null;

            var userCoupon = new UserCoupon
            {
                UserId = userId,
                CouponId = couponId,
                IsUsed = false,
                CreatedAt = DateTime.Now
            };

            _context.UserCoupons.Add(userCoupon);
            await _context.SaveChangesAsync();

            return await GetUserCouponByIdAsync(userCoupon.UserCouponId);
        }

        public async Task<bool> UseCouponAsync(int userCouponId, int orderId)
        {
            var userCoupon = await _context.UserCoupons.FindAsync(userCouponId);
            if (userCoupon == null || userCoupon.IsUsed)
                return false;

            userCoupon.IsUsed = true;
            userCoupon.UsedTime = DateTime.Now;

            _context.UserCoupons.Update(userCoupon);
            await _context.SaveChangesAsync();

            return true;
        }

        private async Task<CouponViewModel> GetUserCouponByIdAsync(int userCouponId)
        {
            var userCoupon = await _context.UserCoupons
                .Include(uc => uc.Coupon)
                .FirstOrDefaultAsync(uc => uc.UserCouponId == userCouponId);

            if (userCoupon == null)
                return null;

            return MapToViewModel(userCoupon);
        }

        private CouponViewModel MapToViewModel(UserCoupon userCoupon)
        {
            return new CouponViewModel
            {
                UserCouponId = userCoupon.UserCouponId,
                CouponId = userCoupon.CouponId,
                CouponCode = userCoupon.Coupon.CouponCode,
                CouponType = userCoupon.Coupon.CouponType,
                DiscountAmount = userCoupon.Coupon.DiscountAmount,
                MinimumAmount = userCoupon.Coupon.MinimumAmount,
                StartDate = userCoupon.Coupon.StartDate,
                EndDate = userCoupon.Coupon.EndDate,
                IsUsed = userCoupon.IsUsed,
                UsedTime = userCoupon.UsedTime
            };
        }
    }
}