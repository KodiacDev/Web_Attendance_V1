using Microsoft.AspNetCore.Mvc;

namespace Web_Report_VRG.Controllers
{
    public class ReportController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
