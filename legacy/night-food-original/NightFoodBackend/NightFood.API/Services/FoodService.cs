using Microsoft.EntityFrameworkCore;
using NightFood.API.Data;
using NightFood.API.Models;
using NightFood.API.ViewModels;

namespace NightFood.API.Services
{
    public class FoodService : IFoodService
    {
        private readonly ApplicationDbContext _context;

        public FoodService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<FoodCategoryViewModel>> GetAllCategoriesWithFoodsAsync()
        {
            var categories = await _context.FoodCategories
                .Include(c => c.Foods.Where(f => f.IsAvailable))
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ToListAsync();

            return categories.Select(MapCategoryToViewModel).ToList();
        }

        public async Task<List<FoodViewModel>> GetFoodsByCategoryAsync(int categoryId)
        {
            var foods = await _context.Foods
                .Where(f => f.CategoryId == categoryId && f.IsAvailable)
                .OrderBy(f => f.SortOrder)
                .ToListAsync();

            return foods.Select(MapFoodToViewModel).ToList();
        }

        public async Task<FoodViewModel> GetFoodByIdAsync(int foodId)
        {
            var food = await _context.Foods.FindAsync(foodId);
            if (food == null)
                return null;

            return MapFoodToViewModel(food);
        }

        private FoodCategoryViewModel MapCategoryToViewModel(FoodCategory category)
        {
            return new FoodCategoryViewModel
            {
                CategoryId = category.CategoryId,
                CategoryName = category.CategoryName,
                SortOrder = category.SortOrder,
                Foods = category.Foods.Select(MapFoodToViewModel).ToList()
            };
        }

        private FoodViewModel MapFoodToViewModel(Food food)
        {
            return new FoodViewModel
            {
                FoodId = food.FoodId,
                CategoryId = food.CategoryId,
                FoodName = food.FoodName,
                Description = food.Description,
                Price = food.Price,
                ImageUrl = food.ImageUrl,
                IsAvailable = food.IsAvailable,
                SortOrder = food.SortOrder
            };
        }
    }
}