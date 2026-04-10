using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NightFood.API.Services;
using NightFood.API.ViewModels;

namespace NightFood.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
            {
                return NotFound(ApiResponse<object>.Fail("订单不存在"));
            }

            return Ok(ApiResponse<OrderViewModel>.Success(order));
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserOrders(int userId)
        {
            var orders = await _orderService.GetUserOrdersAsync(userId);
            return Ok(ApiResponse<List<OrderViewModel>>.Success(orders));
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderViewModel model)
        {
            try
            {
                var order = await _orderService.CreateOrderAsync(model);
                return Ok(ApiResponse<OrderViewModel>.Success(order, "订单创建成功"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var order = await _orderService.UpdateOrderStatusAsync(id, request.Status);
            if (order == null)
            {
                return NotFound(ApiResponse<object>.Fail("订单不存在"));
            }

            return Ok(ApiResponse<OrderViewModel>.Success(order, "订单状态更新成功"));
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; }
    }
}