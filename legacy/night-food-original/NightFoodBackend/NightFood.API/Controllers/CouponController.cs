using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NightFood.API.Services;
using NightFood.API.ViewModels;

namespace NightFood.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CouponController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserCoupons(int userId)
        {
            var coupons = await _couponService.GetUserCouponsAsync(userId);
            return Ok(ApiResponse<List<CouponViewModel>>.Success(coupons));
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignCoupon([FromBody] AssignCouponRequest request)
        {
            var coupon = await _couponService.AssignCouponToUserAsync(request.UserId, request.CouponId);
            if (coupon == null)
            {
                return BadRequest(ApiResponse<object>.Fail("优惠券不存在或已过期"));
            }

            return Ok(ApiResponse<CouponViewModel>.Success(coupon, "优惠券分配成功"));
        }
    }

    public class AssignCouponRequest
    {
        public int UserId { get; set; }
        public int CouponId { get; set; }
    }
}