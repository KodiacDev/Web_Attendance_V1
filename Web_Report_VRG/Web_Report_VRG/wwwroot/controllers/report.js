let dataTable = null; 

$(document).ready(function () {
    // Kiểm tra jQuery và DataTables
    if (typeof jQuery === 'undefined') {
        console.error('jQuery is not loaded');
        return;
    }
    if (typeof jQuery.fn.DataTable === 'undefined') {
        console.error('DataTables is not loaded. Check CDN or script inclusion.');
        return;
    }
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Sự kiện lọc khi nhấn nút tìm kiếm
    $('#btnLoc').on('click', function () {
        const params = {
            nam: $('#nam').val(),
            maCongNhan: $('#maCongNhan').val(),
            date: $('#ngayCao_phien').val(),
            phien: $('#phien').val(),
            farmGroupId: '7' // Giá trị mặc định
        };

        if (IsNullOrEmpty(params.nam) || IsNullOrEmpty(params.date) || IsNullOrEmpty(params.phien)) {
            ShowToastNoti('error', '', 'Vui lòng chọn đầy đủ mùa vụ, ngày cạo và phiên');
            return;
        }

        console.log('Triggering all charts and table with params:', params);
        LoadDataTable(params); // Tải bảng chi tiết
        InitChartTheoPhien(params); // Tải biểu đồ theo phiên
        InitChartSanLuong(params); // Tải biểu đồ sản lượng
    });
});

// Hàm kiểm tra giá trị null hoặc rỗng
function IsNullOrEmpty(value) {
    return value === null || value === undefined || value === '';
}

// Hàm kiểm tra phản hồi
function CheckResponseIsSuccess(response) {
    if (response && response.result === 1) {
        return true;
    }
    const errorMsg = response.error?.message || `Lỗi: ${response.error?.code || 'Dữ liệu không hợp lệ'}`;
    ShowToastNoti('error', '', errorMsg);
    return false;
}

// Hàm hiển thị thông báo
function ShowToastNoti(type, title, message) {
    console.log(`[${type}] ${title}: ${message}`);
    alert(`[${type}] ${message}`);
}

// Hàm tạo bảng tổng sản lượng (kg và tấn)
function CreateTongSanLuongTable(totalKg, totalTons) {
    console.log('Creating TongSanLuongTable with totalKg:', totalKg, 'totalTons:', totalTons);
    const table = document.createElement('table');
    table.className = 'table table-bordered mt-4 text-center';
    table.style.maxWidth = '600px';
    table.style.margin = 'auto';
    table.innerHTML = `
    <thead class="table-secondary">
        <tr><th>Tổng sản lượng mủ nước + mủ tạp(12 tháng)</th></tr>
    </thead>
    <tbody>
        <tr class="table-primary"><td><strong>${totalKg.toFixed(2)} kg</strong></td></tr>
        <tr class="table-primary"><td><strong>${totalTons.toFixed(2)} tấn</strong></td></tr>
    </tbody>
    `;
    console.log('TongSanLuongTable created:', table.outerHTML);
    return table;
}

// Hàm tạo bảng tổng mủ cho InitChartTheoPhien
function CreatePhienSummaryTable(totalWater, totalSolidify, totalWire, totalCup, totalMiscellaneous) {
    console.log('Creating PhienSummaryTable with totals:', { totalWater, totalSolidify, totalWire, totalCup, totalMiscellaneous });
    const table = document.createElement('table');
    table.className = 'table table-bordered mt-4 text-center';
    table.style.maxWidth = '600px';
    table.style.margin = 'auto';
    table.innerHTML = `
    <thead class="table-secondary">
        <tr>
            <th>Tổng sản lượng mủ nước (kg)</th>
            <th colspan="3">Mủ tạp (kg)</th>
        </tr>
        <tr>
            <th></th>
            <th>Mủ đông</th>
            <th>Mủ dây</th>
            <th>Mủ chén</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>${totalWater.toFixed(2)}</strong></td>
            <td><strong>${totalSolidify.toFixed(2)}</strong></td>
            <td><strong>${totalWire.toFixed(2)}</strong></td>
            <td><strong>${totalCup.toFixed(2)}</strong></td>
        </tr>
    </tbody>
    <tfoot class="table-secondary">
        <tr>
            <td><strong>Tổng: ${totalWater.toFixed(2)}</strong></td>
            <td colspan="3"><strong>Tổng mủ tạp: ${totalMiscellaneous.toFixed(2)}</strong></td>
        </tr>
    </tfoot>
    `;
    console.log('PhienSummaryTable created:', table.outerHTML);
    return table;
}

// Hàm tạo cấu trúc bảng chi tiết
function CreateProductionTable() {
    const tableContainer = $('#bang_chi_tiet');
    tableContainer.empty().addClass('active');
    tableContainer.html(`
        <table id="table_main" class="table table-bordered table-striped">
            <thead class="table-primary text-center align-middle">
                <tr>
                    <th rowspan="2">Mã CN</th>
                    <th rowspan="2">Họ và Tên</th>
                    <th rowspan="2">Lô / Phần cây</th>
                    <th colspan="4">Mủ nước (kg)</th>
                    <th colspan="3">Mủ tạp (kg)</th>
                    <th rowspan="2">Tổng tạp (kg)</th>
                    <th rowspan="2">Tổng quy khô</th>
                </tr>
                <tr>
                    <th>Khối lượng từng thùng</th>
                    <th>Sản lượng</th>
                    <th>DRC (%)</th>
                    <th>Quy khô</th>
                    <th>Mủ đông</th>
                    <th>Mủ chén</th>
                    <th>Mủ dây</th>
                </tr>
            </thead>
            <tbody></tbody>
            <tfoot class="table-secondary text-center"></tfoot>
        </table>
    `);
    console.log('Table structure created for #table_main');
}

// Hàm tải bảng chi tiết sản lượng
function LoadDataTable(params) {
    console.log('LoadDataTable called with params:', params);

    const tableContainer = $('#bang_chi_tiet');
    if (!tableContainer.length) {
        console.error('Table container #bang_chi_tiet not found in DOM');
        ShowToastNoti('error', '', 'Không tìm thấy container bảng chi tiết');
        return;
    }
    tableContainer.html('<p class="text-center">Đang tải dữ liệu...</p>').show();

    // API call
    const apiUrl = `https://api-rubber-somu.ecotech2a.com/RubberFarmGroupDetail/GetListByDateWorkFarmGroup?farmGroupId=${params.farmGroupId}&dateWork=${params.date}&shavingSessionId=${params.phien}`;
    console.log('Fetching data from API:', apiUrl);

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log('API response:', response);

            if (!CheckResponseIsSuccess(response) || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
                console.warn('Invalid API response or no data:', response);
                tableContainer.html('<p class="text-danger text-center">Không có dữ liệu từ API</p>').show();
                return;
            }

            // Lấy object đầu tiên
            const item = response.data[0];
            const data = [{
                code: item.workerFarmGroupObj?.code || '-',
                worker: item.workerFarmGroupObj?.name || '-',
                treeNumber: item.treePartObj?.placeMarkObj?.plotNewName + ' / ' + item.treePartObj?.part || '-',
                farmWaterWeightEachBucket: item.farmWaterWeightEachBucket || '-',
                farmWaterWeight: Number(item.farmWaterWeight) || 0,
                factoryWaterDrc: Number(item.factoryWaterDrc) || 0,
                factoryWaterDry: Number(item.factoryWaterDry) || 0,
                farmWeightSolidify: Number(item.farmWeightSolidify) || 0,
                farmWeightCup: Number(item.farmWeightCup) || 0,
                farmWeightWire: Number(item.farmWeightWire) || 0,
                farmImpurityWeightTotal: Number(item.farmImpurityWeightTotal) || 0,
                factoryImpurityDryTotal: Number(item.factoryImpurityDryTotal) || 0
            }];

            if (dataTable) {
                console.log('Destroying existing DataTable');
                dataTable.destroy();
                dataTable = null;
            }

            // Create table structure
            CreateProductionTable();

            try {
                console.log('Initializing DataTable with API data:', data);
                dataTable = $('#table_main').DataTable({
                    lengthChange: true,
                    lengthMenu: [[10, 25, 50, 100, -1], ['10', '25', '50', '100', 'Tất cả']],
                    colReorder: { allowReorder: false },
                    responsive: { details: true },
                    scrollX: true,
                    select: false,
                    stateSave: false,
                    data: data,
                    columns: [
                        { data: 'code', title: 'Mã CN', className: 'text-center' },
                        { data: 'worker', title: 'Họ và Tên', className: 'text-left' },
                        { data: 'treeNumber', title: 'Lô / Phần cây', className: 'text-center' },
                        { data: 'farmWaterWeightEachBucket', title: 'Khối lượng từng thùng', className: 'text-center', render: data => data || '-' },
                        { data: 'farmWaterWeight', title: 'Sản lượng', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'factoryWaterDrc', title: 'DRC (%)', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'factoryWaterDry', title: 'Quy khô', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'farmWeightSolidify', title: 'Mủ đông', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'farmWeightCup', title: 'Mủ chén', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'farmWeightWire', title: 'Mủ dây', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'farmImpurityWeightTotal', title: 'Tổng tạp (kg)', className: 'text-center', render: data => data.toFixed(2) },
                        { data: 'factoryImpurityDryTotal', title: 'Tổng quy khô', className: 'text-center', render: data => data.toFixed(2) }
                    ],
                    language: {
                        emptyTable: 'Không có dữ liệu',
                        info: 'Hiển thị _START_ đến _END_ của _TOTAL_ bản ghi',
                        infoEmpty: 'Hiển thị 0 bản ghi',
                        lengthMenu: 'Hiển thị _MENU_ bản ghi',
                        search: 'Tìm kiếm:',
                        paginate: {
                            first: 'Đầu',
                            last: 'Cuối',
                            next: 'Tiếp',
                            previous: 'Trước'
                        }
                    },
                    drawCallback: function () {
                        console.log('DataTable drawCallback executed');
                        const totalWeight = data[0].farmImpurityWeightTotal;
                        const totalDry = data[0].factoryImpurityDryTotal;
                        const tfootHtml = `
                            <tr>
                                <td colspan="3">Tổng</td>
                                <td>-</td>
                                <td>${data[0].farmWaterWeight.toFixed(2)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>${data[0].farmWeightSolidify.toFixed(2)}</td>
                                <td>${data[0].farmWeightCup.toFixed(2)}</td>
                                <td>${data[0].farmWeightWire.toFixed(2)}</td>
                                <td>${totalWeight.toFixed(2)}</td>
                                <td>${totalDry.toFixed(2)}</td>
                            </tr>`;
                        $('#table_main tfoot').html(tfootHtml).show();
                        console.log('Footer updated with totals:', { totalWeight, totalDry });
                    },
                    initComplete: function () {
                        console.log('DataTable initialization complete');
                        $('#table_main').show();
                        tableContainer.addClass('active').show();
                    }
                });
                window.dataTable = dataTable;
                console.log('DataTable initialized successfully');
            } catch (error) {
                console.error('Error initializing DataTable:', error);
                tableContainer.html(`<p class="text-danger text-center">Lỗi khi khởi tạo bảng: ${error.message}</p>`).show();
            }
        },
        error: function (xhr, status, error) {
            console.error('API call failed:', error);
            tableContainer.html(`<p class="text-danger text-center">Lỗi khi gọi API: ${error}</p>`).show();
        }
    });
}

// Biểu đồ sản lượng năm
function InitChartSanLuong(params) {
    console.log('InitChartSanLuong called with params:', params);
    const chartContainer = $('#bieu_do_san_luong');
    if (!chartContainer.length) {
        console.error('Chart container #bieu_do_san_luong not found in DOM');
        ShowToastNoti('error', '', 'Không tìm thấy container biểu đồ sản lượng');
        return;
    }
    chartContainer.html('<p class="text-center">Đang tải dữ liệu...</p>').show();

    const apiUrl = `https://api-rubber-somu.ecotech2a.com/RubberFarmGroup/TotalRubberFarmGroupByYear?year=${encodeURIComponent(params.nam)}`;
    console.log('Fetching data from API:', apiUrl);

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log('API response:', response);
            if (!CheckResponseIsSuccess(response)) {
                chartContainer.html('<p class="text-danger text-center">Dữ liệu không hợp lệ từ API</p>').show();
                return;
            }

            const data = response.data || [];
            let sanLuongThang = new Array(12).fill(0);
            data.forEach(item => {
                if (item.month && item.total !== undefined) {
                    sanLuongThang[item.month - 1] = item.total;
                }
            });

            const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
            const totalKg = sanLuongThang.reduce((a, b) => a + b, 0);
            const totalTons = totalKg / 1000;

            chartContainer.empty().addClass('active').show();
            const canvas = $('<canvas></canvas>').attr('id', 'chart_sanluong').css({ width: '100%', height: '400px' });
            chartContainer.append(canvas);

            try {
                console.log('Rendering Chart.js for InitChartSanLuong with data:', sanLuongThang);
                new Chart(canvas[0].getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Sản lượng (kg)',
                            data: sanLuongThang,
                            backgroundColor: '#00b894',
                            borderColor: '#00b894',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: `Sản lượng mủ năm ${params.nam}`,
                                font: { size: 16 },
                                padding: { top: 10, bottom: 10 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return `${context.raw} kg`;
                                    }
                                }
                            },
                            legend: { display: false }
                        },
                        scales: {
                            x: { title: { display: true, text: 'Tháng' } },
                            y: { title: { display: true, text: 'Khối lượng (kg)' }, beginAtZero: true }
                        }
                    },
                    plugins: [{
                        id: 'labelOnTop',
                        afterDatasetsDraw(chart) {
                            const { ctx, chartArea: { top }, data } = chart;
                            chart.data.datasets.forEach((dataset, datasetIndex) => {
                                const meta = chart.getDatasetMeta(datasetIndex);
                                meta.data.forEach((bar, index) => {
                                    const value = dataset.data[index];
                                    if (value > 0) {
                                        ctx.save();
                                        ctx.fillStyle = 'black';
                                        ctx.font = 'bold 12px sans-serif';
                                        ctx.textAlign = 'center';
                                        ctx.fillText(`${value.toFixed(2)} kg`, bar.x, bar.y - 6);
                                        ctx.restore();
                                    }
                                });
                            });
                        }
                    }]
                });

                const table = CreateTongSanLuongTable(totalKg, totalTons);
                chartContainer.append(table);
                console.log('Appended TongSanLuongTable to #bieu_do_san_luong');
            } catch (error) {
                console.error('Error rendering yearly chart:', error);
                chartContainer.html('<p class="text-danger text-center">Lỗi khi vẽ biểu đồ</p>').show();
            }
        },
        error: function (xhr, status, error) {
            console.error('API call failed:', status, error);
            chartContainer.html('<p class="text-danger text-center">Lỗi khi tải dữ liệu từ API</p>').show();
        }
    });
}

// Biểu đồ theo phiên
function InitChartTheoPhien(params) {
    console.log('InitChartTheoPhien called with params:', params);
    const chartContainer = $('#chart_theo_phien_ngay');
    if (!chartContainer.length) {
        console.error('Chart container #chart_theo_phien_ngay not found in DOM');
        ShowToastNoti('error', '', 'Không tìm thấy container biểu đồ');
        return;
    }
    chartContainer.html('<p class="text-center">Đang tải dữ liệu...</p>').show();

    const apiUrl = `https://api-rubber-somu.ecotech2a.com/RubberFarmGroupDetail/GetListByDateWorkFarmGroup?farmGroupId=${params.farmGroupId}&dateWork=${params.date}&shavingSessionId=${params.phien}`;
    console.log('Fetching data from API:', apiUrl);

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log('API response:', response);
            if (!CheckResponseIsSuccess(response) || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
                console.warn('Invalid API response or no data:', response);
                chartContainer.html('<p class="text-danger text-center">Không có dữ liệu để hiển thị</p>').show();
                return;
            }

            // Lấy object đầu tiên
            const item = response.data[0];
            const data = [{
                farmWaterWeight: Number(item.farmWaterWeight) || 0,
                farmWeightCup: Number(item.farmWeightCup) || 0,
                farmWeightWire: Number(item.farmWeightWire) || 0,
                farmWeightSolidify: Number(item.farmWeightSolidify) || 0,
                workerCode: item.workerFarmGroupObj?.code || 'Unknown'
            }];

            const loaiMu = [
                { key: 'farmWaterWeight', name: 'Mủ nước' },
                { key: 'farmWeightCup', name: 'Mủ chén' },
                { key: 'farmWeightWire', name: 'Mủ dây' },
                { key: 'farmWeightSolidify', name: 'Mủ đông' }
            ];
            const categories = ['Sản lượng'];

            const dataSeries = loaiMu.map(mu => ({
                name: mu.name,
                data: [data[0][mu.key]]
            }));

            const totalWater = data[0].farmWaterWeight;
            const totalCup = data[0].farmWeightCup;
            const totalWire = data[0].farmWeightWire;
            const totalSolidify = data[0].farmWeightSolidify;
            const totalMiscellaneous = totalCup + totalWire + totalSolidify;

            chartContainer.empty().addClass('active').show();
            const canvas = $('<canvas></canvas>').attr('id', 'chart_phien').css({ width: '100%', height: '400px' });
            chartContainer.append(canvas);

            try {
                console.log('Rendering Chart.js for InitChartTheoPhien with data:', dataSeries);
                new Chart(canvas[0].getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: categories,
                        datasets: dataSeries.map((series, idx) => ({
                            label: series.name,
                            data: series.data,
                            backgroundColor: ['#00b894', '#0984e3', '#fdcb6e', '#d63031'][idx % 4],
                            borderColor: ['#00b894', '#0984e3', '#fdcb6e', '#d63031'][idx % 4],
                            borderWidth: 1
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: `Sản lượng các loại mủ - Công nhân ${data[0].workerCode} - Phiên ${params.phien} ngày ${params.date}`,
                                font: { size: 16 },
                                padding: { top: 10, bottom: 10 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return `${context.raw} kg`;
                                    }
                                }
                            },
                            legend: { position: 'top', align: 'center' }
                        },
                        scales: {
                            x: { title: { display: true, text: 'Loại mủ' } },
                            y: { title: { display: true, text: 'Khối lượng (kg)' }, beginAtZero: true }
                        }
                    },
                    plugins: [{
                        id: 'labelOnTop',
                        afterDatasetsDraw(chart) {
                            const { ctx, chartArea: { top }, data } = chart;
                            chart.data.datasets.forEach((dataset, datasetIndex) => {
                                const meta = chart.getDatasetMeta(datasetIndex);
                                meta.data.forEach((bar, index) => {
                                    const value = dataset.data[index];
                                    if (value > 0) {
                                        ctx.save();
                                        ctx.fillStyle = 'black';
                                        ctx.font = 'bold 12px sans-serif';
                                        ctx.textAlign = 'center';
                                        ctx.fillText(`${value.toFixed(2)} kg`, bar.x, bar.y - 6);
                                        ctx.restore();
                                    }
                                });
                            });
                        }
                    }]
                });

                const table = CreatePhienSummaryTable(totalWater, totalSolidify, totalWire, totalCup, totalMiscellaneous);
                chartContainer.append(table);
                console.log('Appended PhienSummaryTable to #chart_theo_phien_ngay');
            } catch (error) {
                console.error('Error rendering phien chart:', error);
                chartContainer.html('<p class="text-danger text-center">Lỗi khi vẽ biểu đồ</p>').show();
            }
        },
        error: function (xhr, status, error) {
            console.error('API call failed:', status, error);
            chartContainer.html('<p class="text-danger text-center">Lỗi khi tải dữ liệu từ API</p>').show();
        }
    });
}