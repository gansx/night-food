using Microsoft.EntityFrameworkCore;
using NightFood.API.Data;
using NightFood.API.Models;
using NightFood.API.ViewModels;

namespace NightFood.API.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserViewModel> GetUserByIdAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return null;

            return MapToViewModel(user);
        }

        public async Task<UserViewModel> GetUserByOpenIdAsync(string openId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.OpenId == openId);
            if (user == null)
                return null;

            return MapToViewModel(user);
        }

        public async Task<UserViewModel> CreateUserAsync(string openId)
        {
            var user = new User
            {
                OpenId = openId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return MapToViewModel(user);
        }

        public async Task<UserViewModel> UpdateUserAsync(int userId, UpdateUserViewModel model)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return null;

            user.UserName = model.UserName ?? user.UserName;
            user.Avatar = model.Avatar ?? user.Avatar;
            user.Phone = model.Phone ?? user.Phone;
            user.Address = model.Address ?? user.Address;
            user.UpdatedAt = DateTime.Now;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return MapToViewModel(user);
        }

        private UserViewModel MapToViewModel(User user)
        {
            return new UserViewModel
            {
                UserId = user.UserId,
                UserName = user.UserName,
                Avatar = user.Avatar,
                Phone = user.Phone,
                Address = user.Address
            };
        }
    }
}