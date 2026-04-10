using NightFood.API.Models;
using NightFood.API.ViewModels;

namespace NightFood.API.Services
{
    // 用户服务接口
    public interface IUserService
    {
        Task<UserViewModel> GetUserByIdAsync(int userId);
        Task<UserViewModel> GetUserByOpenIdAsync(string openId);
        Task<UserViewModel> CreateUserAsync(string openId);
        Task<UserViewModel> UpdateUserAsync(int userId, UpdateUserViewModel model);
    }

    // 订单服务接口
    public interface IOrderService
    {
        Task<OrderViewModel> GetOrderByIdAsync(int orderId);
        Task<List<OrderViewModel>> GetUserOrdersAsync(int userId);
        Task<OrderViewModel> CreateOrderAsync(CreateOrderViewModel model);
        Task<OrderViewModel> UpdateOrderStatusAsync(int orderId, string status);
    }

    // 任务服务接口
    public interface ITaskService
    {
        Task<TaskViewModel> GetTaskByIdAsync(int taskId);
        Task<List<TaskViewModel>> GetUserTasksAsync(int userId);
        Task<List<TaskViewModel>> SearchTasksAsync(string keyword);
        Task<TaskViewModel> CreateTaskAsync(CreateTaskViewModel model);
        Task<TaskViewModel> UpdateTaskAsync(int taskId, UpdateTaskViewModel model);
    }

    // 优惠券服务接口
    public interface ICouponService
    {
        Task<List<CouponViewModel>> GetUserCouponsAsync(int userId);
        Task<CouponViewModel> AssignCouponToUserAsync(int userId, int couponId);
        Task<bool> UseCouponAsync(int userCouponId, int orderId);
    }

    // 食品服务接口
    public interface IFoodService
    {
        Task<List<FoodCategoryViewModel>> GetAllCategoriesWithFoodsAsync();
        Task<List<FoodViewModel>> GetFoodsByCategoryAsync(int categoryId);
        Task<FoodViewModel> GetFoodByIdAsync(int foodId);
    }

    // 微信服务接口
    public interface IWechatService
    {
        Task<WechatLoginResult> LoginAsync(string code);
    }
}