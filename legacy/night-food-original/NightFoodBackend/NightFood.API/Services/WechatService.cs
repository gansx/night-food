using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NightFood.API.Data;
using NightFood.API.Models;
using NightFood.API.ViewModels;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace NightFood.API.Services
{
    public class WechatService : IWechatService
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly IUserService _userService;
        private readonly HttpClient _httpClient;

        public WechatService(IConfiguration configuration, ApplicationDbContext context, IUserService userService, HttpClient httpClient)
        {
            _configuration = configuration;
            _context = context;
            _userService = userService;
            _httpClient = httpClient;
        }

        public async Task<WechatLoginResult> LoginAsync(string code)
        {
            try
            {
                // 获取微信小程序配置
                var appId = _configuration["Wechat:AppId"];
                var appSecret = _configuration["Wechat:AppSecret"];

                // 调用微信接口获取OpenId
                var url = $"https://api.weixin.qq.com/sns/jscode2session?appid={appId}&secret={appSecret}&js_code={code}&grant_type=authorization_code";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    return new WechatLoginResult
                    {
                        Success = false,
                        ErrorMessage = "微信服务器请求失败"
                    };
                }

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<WechatLoginResponse>(content);

                if (result == null || !string.IsNullOrEmpty(result.ErrCode))
                {
                    return new WechatLoginResult
                    {
                        Success = false,
                        ErrorMessage = result?.ErrMsg ?? "微信登录失败"
                    };
                }

                // 查找或创建用户
                var user = await _userService.GetUserByOpenIdAsync(result.OpenId);
                bool isNewUser = false;

                if (user == null)
                {
                    user = await _userService.CreateUserAsync(result.OpenId);
                    isNewUser = true;
                }

                // 生成JWT令牌
                var token = GenerateJwtToken(user.UserId.ToString(), user.UserName ?? "");

                return new WechatLoginResult
                {
                    Success = true,
                    Token = token,
                    User = user,
                    IsNew = isNewUser
                };
            }
            catch (Exception ex)
            {
                return new WechatLoginResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private string GenerateJwtToken(string userId, string userName)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Name, userName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpireMinutes"]));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private class WechatLoginResponse
        {
            [System.Text.Json.Serialization.JsonPropertyName("openid")]
            public string OpenId { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("session_key")]
            public string SessionKey { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("errcode")]
            public string ErrCode { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("errmsg")]
            public string ErrMsg { get; set; }
        }
    }
}