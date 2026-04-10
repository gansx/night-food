using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NightFood.API.Services;
using NightFood.API.ViewModels;

namespace NightFood.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IWechatService _wechatService;

        public UserController(IUserService userService, IWechatService wechatService)
        {
            _userService = userService;
            _wechatService = wechatService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Code))
            {
                return BadRequest(ApiResponse<object>.Fail("微信授权码不能为空"));
            }

            var result = await _wechatService.LoginAsync(request.Code);
            if (!result.Success)
            {
                return BadRequest(ApiResponse<object>.Fail(result.ErrorMessage));
            }

            var response = new
            {
                token = result.Token,
                user = result.User
            };

            return Ok(ApiResponse<object>.Success(response, "登录成功", result.IsNew));
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("用户不存在"));
            }

            return Ok(ApiResponse<UserViewModel>.Success(user));
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserViewModel model)
        {
            var user = await _userService.UpdateUserAsync(id, model);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("用户不存在"));
            }

            return Ok(ApiResponse<UserViewModel>.Success(user, "更新成功"));
        }
    }

    public class LoginRequest
    {
        public string Code { get; set; }
    }
}