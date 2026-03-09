const API_BASE_URL =
  window.location.protocol.startsWith("http")
    ? `${window.location.origin}/api`
    : "http://localhost:3000/api";

const CHART_COLORS = ["#0b7285", "#e67700", "#5f3dc4", "#2f9e44", "#c92a2a", "#1c7ed6"];

let allOutcomes = [];
let allReferralDetails = [];
let detailsLoaded = false;
let outcomesAscending = true;
let activeOutcomeFilter = "All";

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const errorText = await response.text();
    const compactError = errorText.replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(
      `Request failed for ${path} (${response.status})${compactError ? `: ${compactError}` : ""}`
    );
  }
  return response.json();
}

async function fetchSummary() {
  return fetchJson("/kpis/summary");
}

async function fetchOutcomes() {
  return fetchJson("/kpis/outcomes");
}

async function fetchReferralDetails() {
  return fetchJson("/kpis/referrals");
}

function setStatus(message) {
  document.getElementById("status-message").textContent = message;
}

function renderSummary(summary) {
  document.getElementById("total-referrals").textContent = summary.total_referrals;
  document.getElementById("average-sla").textContent = summary.average_sla_days;
}

function renderOutcomes() {
  const tableBody = document.getElementById("outcomes-table-body");
  tableBody.innerHTML = "";

  const sortedOutcomes = [...allOutcomes].sort((a, b) => {
    if (outcomesAscending) {
      return a.count - b.count;
    }
    return b.count - a.count;
  });

  sortedOutcomes.forEach((item) => {
    const row = document.createElement("tr");

    const statusCell = document.createElement("td");
    statusCell.textContent = item.outcome_status;

    const countCell = document.createElement("td");
    countCell.textContent = item.count;

    const actionCell = document.createElement("td");
    const filterButton = document.createElement("button");
    filterButton.textContent = "Filter Details";
    filterButton.className = "secondary";
    filterButton.dataset.outcome = item.outcome_status;
    actionCell.appendChild(filterButton);

    row.appendChild(statusCell);
    row.appendChild(countCell);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function renderReferralDetails() {
  const tableBody = document.getElementById("details-table-body");
  tableBody.innerHTML = "";

  const filteredRows =
    activeOutcomeFilter === "All"
      ? allReferralDetails
      : allReferralDetails.filter((row) => row.outcome_status === activeOutcomeFilter);

  filteredRows.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.referral_id}</td>
      <td>${item.submitted_at ?? "-"}</td>
      <td>${item.referral_status ?? "-"}</td>
      <td>${item.appointment_date ?? "-"}</td>
      <td>${item.outcome_status ?? "-"}</td>
      <td>${item.sla_days ?? "-"}</td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("details-count").textContent = `${filteredRows.length} rows`;
  document.getElementById("active-filter").textContent = activeOutcomeFilter;
}

function showDetailsSection() {
  document.getElementById("details-section").style.display = "block";
  document.getElementById("load-details-btn").textContent = "Hide Referral Details";
}

function hideDetailsSection() {
  document.getElementById("details-section").style.display = "none";
  document.getElementById("load-details-btn").textContent = "Load Referral Details";
}

function resizeCanvas(canvas, height) {
  const width = Math.max(canvas.clientWidth, 320);
  const dpr = window.devicePixelRatio || 1;
  const context = canvas.getContext("2d");

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { context, width, height };
}

function drawBarChart(data) {
  const canvas = document.getElementById("outcomes-bar-chart");
  const { context, width, height } = resizeCanvas(canvas, 260);
  context.clearRect(0, 0, width, height);

  if (data.length === 0) {
    context.fillStyle = "#334e68";
    context.fillText("No data", 20, 20);
    return;
  }

  const padding = { top: 20, right: 20, bottom: 50, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map((item) => item.count), 1);
  const slotWidth = chartWidth / data.length;
  const barWidth = slotWidth * 0.6;

  context.strokeStyle = "#9fb3c8";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.stroke();

  context.font = "12px Segoe UI";
  context.textAlign = "center";

  data.forEach((item, index) => {
    const barHeight = (item.count / maxValue) * chartHeight;
    const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
    const y = padding.top + chartHeight - barHeight;
    const color = CHART_COLORS[index % CHART_COLORS.length];

    context.fillStyle = color;
    context.fillRect(x, y, barWidth, barHeight);

    context.fillStyle = "#102a43";
    context.fillText(String(item.count), x + barWidth / 2, y - 6);
    context.fillText(item.outcome_status, x + barWidth / 2, padding.top + chartHeight + 16);
  });
}

function drawDonutChart(data) {
  const canvas = document.getElementById("outcomes-donut-chart");
  const { context, width, height } = resizeCanvas(canvas, 260);
  context.clearRect(0, 0, width, height);

  if (data.length === 0) {
    context.fillStyle = "#334e68";
    context.fillText("No data", 20, 20);
    return;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.34;

  let startAngle = -Math.PI / 2;
  data.forEach((item, index) => {
    const angle = (item.count / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
    context.fill();

    startAngle = endAngle;
  });

  context.beginPath();
  context.fillStyle = "#ffffff";
  context.arc(centerX, centerY, radius * 0.58, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#102a43";
  context.textAlign = "center";
  context.font = "700 18px Segoe UI";
  context.fillText(`${total}`, centerX, centerY - 4);
  context.font = "12px Segoe UI";
  context.fillText("Total outcomes", centerX, centerY + 14);
}

function renderChartLegend(data) {
  const legend = document.getElementById("chart-legend");
  legend.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "legend-chip secondary";
  allButton.textContent = "Show All";
  allButton.addEventListener("click", () => {
    clearFilter();
  });
  legend.appendChild(allButton);

  data.forEach((item, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "legend-chip secondary";
    chip.dataset.outcome = item.outcome_status;

    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.backgroundColor = CHART_COLORS[index % CHART_COLORS.length];

    const label = document.createElement("span");
    label.textContent = `${item.outcome_status} (${item.count})`;

    chip.appendChild(dot);
    chip.appendChild(label);
    legend.appendChild(chip);
  });
}

function renderCharts() {
  const chartData = [...allOutcomes].sort((a, b) => b.count - a.count);
  drawBarChart(chartData);
  drawDonutChart(chartData);
  renderChartLegend(chartData);
}

async function loadDashboardData() {
  setStatus("Refreshing dashboard...");
  const [summary, outcomes] = await Promise.all([fetchSummary(), fetchOutcomes()]);
  allOutcomes = outcomes;
  renderSummary(summary);
  renderOutcomes();
  renderCharts();
  setStatus("Dashboard data updated.");
}

async function loadDetails() {
  setStatus("Loading referral details...");
  allReferralDetails = await fetchReferralDetails();
  detailsLoaded = true;
  showDetailsSection();
  renderReferralDetails();
  setStatus("Referral details loaded.");
}

async function applyOutcomeFilter(outcome) {
  if (!detailsLoaded) {
    await loadDetails();
  }
  activeOutcomeFilter = outcome;
  renderReferralDetails();
  setStatus(`Filtered referral details by: ${activeOutcomeFilter}`);
}

function clearFilter() {
  activeOutcomeFilter = "All";
  document.getElementById("active-filter").textContent = activeOutcomeFilter;
  if (detailsLoaded) {
    renderReferralDetails();
  }
  setStatus("Outcome filter cleared.");
}

function wireEvents() {
  document.getElementById("refresh-btn").addEventListener("click", async () => {
    try {
      await loadDashboardData();
      if (detailsLoaded) {
        allReferralDetails = await fetchReferralDetails();
        renderReferralDetails();
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  });

  document.getElementById("load-details-btn").addEventListener("click", async () => {
    try {
      if (detailsLoaded && document.getElementById("details-section").style.display === "block") {
        hideDetailsSection();
        setStatus("Referral details hidden.");
        return;
      }

      if (!detailsLoaded) {
        await loadDetails();
        return;
      }

      showDetailsSection();
      renderReferralDetails();
      setStatus("Referral details shown.");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  });

  document.getElementById("export-csv-btn").addEventListener("click", () => {
    window.open(`${API_BASE_URL}/mi/export`, "_blank");
    setStatus("CSV export opened in a new tab.");
  });

  document.getElementById("toggle-sort-btn").addEventListener("click", () => {
    outcomesAscending = !outcomesAscending;
    document.getElementById("toggle-sort-btn").textContent = `Sort Outcomes: ${
      outcomesAscending ? "Asc" : "Desc"
    }`;
    renderOutcomes();
    setStatus("Outcome sort order updated.");
  });

  document.getElementById("clear-filter-btn").addEventListener("click", clearFilter);

  document.getElementById("outcomes-table-body").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !button.dataset.outcome) {
      return;
    }

    try {
      await applyOutcomeFilter(button.dataset.outcome);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  });

  document.getElementById("chart-legend").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !button.dataset.outcome) {
      return;
    }

    try {
      await applyOutcomeFilter(button.dataset.outcome);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  });

  window.addEventListener("resize", () => {
    if (allOutcomes.length > 0) {
      renderCharts();
    }
  });
}

async function initializeDashboard() {
  wireEvents();
  hideDetailsSection();

  try {
    await loadDashboardData();
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
