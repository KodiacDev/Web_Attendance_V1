using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Web_Report_VRG.Models;

namespace Web_Report_VRG.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }
        public IActionResult ViewSheet()
        {
            return View();
        }
    }
}
