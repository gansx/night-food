using Microsoft.EntityFrameworkCore;
using NightFood.API.Data;
using NightFood.API.ViewModels;
using TaskItem = NightFood.API.Models.TaskItem;

namespace NightFood.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;

        public TaskService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TaskViewModel> GetTaskByIdAsync(int taskId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return null;

            return MapToViewModel(task);
        }

        public async Task<List<TaskViewModel>> GetUserTasksAsync(int userId)
        {
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(MapToViewModel).ToList();
        }

        public async Task<List<TaskViewModel>> SearchTasksAsync(string keyword)
        {
            var query = _context.Tasks.AsQueryable();
            
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(t => t.Title.Contains(keyword) || 
                                        (t.Description != null && t.Description.Contains(keyword)));
            }
            
            var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
            return tasks.Select(MapToViewModel).ToList();
        }

        public async Task<TaskViewModel> CreateTaskAsync(CreateTaskViewModel model)
        {
            var task = new TaskItem
            {
                UserId = model.UserId,
                Title = model.Title,
                Description = model.Description,
                Reward = model.Reward,
                Status = "进行中",
                ImageUrl = model.ImageUrl,
                StartTime = model.StartTime,
                EndTime = model.EndTime,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return MapToViewModel(task);
        }

        public async Task<TaskViewModel> UpdateTaskAsync(int taskId, UpdateTaskViewModel model)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return null;

            task.Title = model.Title ?? task.Title;
            task.Description = model.Description ?? task.Description;
            task.Reward = model.Reward ?? task.Reward;
            task.Status = model.Status ?? task.Status;
            task.StartTime = model.StartTime ?? task.StartTime;
            task.EndTime = model.EndTime ?? task.EndTime;
            task.UpdatedAt = DateTime.Now;

            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();

            return MapToViewModel(task);
        }

        private TaskViewModel MapToViewModel(TaskItem task)
        {
            return new TaskViewModel
            {
                TaskId = task.TaskId,
                UserId = task.UserId,
                Title = task.Title,
                Description = task.Description,
                Reward = task.Reward,
                Status = task.Status,
                StartTime = task.StartTime,
                EndTime = task.EndTime,
                CreatedAt = task.CreatedAt
            };
        }
    }
}