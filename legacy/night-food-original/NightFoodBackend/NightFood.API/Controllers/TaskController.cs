using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NightFood.API.Services;
using NightFood.API.ViewModels;

namespace NightFood.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TaskController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return NotFound(ApiResponse<object>.Fail("任务不存在"));
            }

            return Ok(ApiResponse<TaskViewModel>.Success(task));
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserTasks(int userId)
        {
            var tasks = await _taskService.GetUserTasksAsync(userId);
            return Ok(ApiResponse<List<TaskViewModel>>.Success(tasks));
        }
        
        [HttpGet("search")]
        public async Task<IActionResult> SearchTasks([FromQuery] string keyword)
        {
            var tasks = await _taskService.SearchTasksAsync(keyword);
            return Ok(ApiResponse<List<TaskViewModel>>.Success(tasks));
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskViewModel model)
        {
            var task = await _taskService.CreateTaskAsync(model);
            return Ok(ApiResponse<TaskViewModel>.Success(task, "任务创建成功"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskViewModel model)
        {
            var task = await _taskService.UpdateTaskAsync(id, model);
            if (task == null)
            {
                return NotFound(ApiResponse<object>.Fail("任务不存在"));
            }

            return Ok(ApiResponse<TaskViewModel>.Success(task, "任务更新成功"));
        }
    }
}