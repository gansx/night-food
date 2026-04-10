using Microsoft.AspNetCore.Mvc;
using NightFood.API.Services;
using NightFood.API.ViewModels;

namespace NightFood.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FoodController : ControllerBase
    {
        private readonly IFoodService _foodService;

        public FoodController(IFoodService foodService)
        {
            _foodService = foodService;
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategoriesWithFoods()
        {
            var categories = await _foodService.GetAllCategoriesWithFoodsAsync();
            return Ok(ApiResponse<List<FoodCategoryViewModel>>.Success(categories));
        }

        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetFoodsByCategory(int categoryId)
        {
            var foods = await _foodService.GetFoodsByCategoryAsync(categoryId);
            return Ok(ApiResponse<List<FoodViewModel>>.Success(foods));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFood(int id)
        {
            var food = await _foodService.GetFoodByIdAsync(id);
            if (food == null)
            {
                return NotFound(ApiResponse<object>.Fail("食品不存在"));
            }

            return Ok(ApiResponse<FoodViewModel>.Success(food));
        }
    }
}