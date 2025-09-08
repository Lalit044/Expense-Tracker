/* =========================
   STORAGE & INITIAL SETUP
   ========================= */
let fixedExpenses = JSON.parse(localStorage.getItem("fixedExpenses")) || [];
let extraExpenses = JSON.parse(localStorage.getItem("extraExpenses")) || [];
let totalBudget = parseFloat(localStorage.getItem("totalBudget")) || 10000;

// History keyed by "Month YYYY" => { fixed:[], extra:[], budget: number }
let history = JSON.parse(localStorage.getItem("history")) || {};

// Recurring defaults
let recurring = JSON.parse(localStorage.getItem("recurring")) || {
  rent: 4000,
  food: 2800,
  wifi: 250
};

// Current month key
const currentMonthKey = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

// DOM refs
const monthDisplayEl = document.getElementById("monthDisplay");
const budgetInput = document.getElementById("totalBudget");
const setBudgetBtn = document.getElementById("setBudgetBtn");
const summaryEl = document.getElementById("summary");
const themeToggleBtn = document.getElementById("themeToggle");

// Recurring inputs
const recurringRent = document.getElementById("recurringRent");
const recurringFood = document.getElementById("recurringFood");
const recurringWifi = document.getElementById("recurringWifi");
const saveRecurringBtn = document.getElementById("saveRecurringBtn");
const applyRecurringNowBtn = document.getElementById("applyRecurringNowBtn");

// Fixed DOM
const fixedName = document.getElementById("fixedName");
const fixedAmount = document.getElementById("fixedAmount");
const addFixedBtn = document.getElementById("addFixedBtn");
const fixedTable = document.getElementById("fixedTable");

// Extra DOM
const quickChips = document.getElementById("quickChips");
const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseDate = document.getElementById("expenseDate");
const expenseNote = document.getElementById("expenseNote");
const addExtraBtn = document.getElementById("addExtraBtn");
const sortExtraBtn = document.getElementById("sortExtraBtn");
const expenseTable = document.getElementById("expenseTable");

// Export/Reset
const resetBtn = document.getElementById("resetBtn");
const monthSelect = document.getElementById("monthSelect");
const downloadSelectedBtn = document.getElementById("downloadSelectedBtn");
const downloadHistoryBtn = document.getElementById("downloadHistoryBtn");

/* =========================
   THEME
   ========================= */
(function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  if (saved === "dark") document.body.classList.add("dark");
  themeToggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
})();

/* =========================
   MONTH DISPLAY
   ========================= */
monthDisplayEl.textContent = `📅 ${currentMonthKey}`;

/* =========================
   LOAD UI VALUES
   ========================= */
budgetInput.value = totalBudget;
recurringRent.value = recurring.rent ?? "";
recurringFood.value = recurring.food ?? "";
recurringWifi.value = recurring.wifi ?? "";

/* =========================
   MONTHLY ROLLOVER
   ========================= */
(function checkMonthReset() {
  const lastMonth = localStorage.getItem("lastMonthKey");
  if (lastMonth && lastMonth !== currentMonthKey) {
    // Save last month into history
    history[lastMonth] = {
      fixed: fixedExpenses,
      extra: extraExpenses,
      budget: totalBudget
    };
    // Start fresh
    fixedExpenses = [];
    extraExpenses = [];
    applyRecurring();
    alert(`🔄 New month detected! Saved ${lastMonth} to history and started fresh for ${currentMonthKey}.`);
  } else if (!lastMonth && fixedExpenses.length === 0) {
    applyRecurring();
  }
  saveAll();
})();

/* =========================
   MONTH SELECT FOR EXPORT
   ========================= */
function refreshMonthSelect() {
  monthSelect.innerHTML = "";
  const optCurrent = document.createElement("option");
  optCurrent.value = currentMonthKey;
  optCurrent.textContent = `${currentMonthKey} (current)`;
  monthSelect.appendChild(optCurrent);

  const months = Object.keys(history).sort((a, b) => new Date(b) - new Date(a));
  months.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });
}
refreshMonthSelect();

/* =========================
   SAVE ALL
   ========================= */
function saveAll() {
  localStorage.setItem("fixedExpenses", JSON.stringify(fixedExpenses));
  localStorage.setItem("extraExpenses", JSON.stringify(extraExpenses));
  localStorage.setItem("totalBudget", totalBudget);
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("recurring", JSON.stringify(recurring));
  localStorage.setItem("lastMonthKey", currentMonthKey);
}

/* =========================
   SUMMARY
   ========================= */
function updateSummary() {
  const totalFixed = fixedExpenses.reduce((s, x) => s + x.amount, 0);
  const totalExtra = extraExpenses.reduce((s, x) => s + x.amount, 0);
  const remaining = (totalBudget || 0) - (totalFixed + totalExtra);
  summaryEl.textContent = `Budget: ₹${totalBudget || 0} | Fixed: ₹${totalFixed} | Extra: ₹${totalExtra} | Remaining: ₹${remaining}`;
  summaryEl.classList.toggle("positive", remaining >= 0);
  summaryEl.classList.toggle("negative", remaining < 0);
  saveAll();
}

/* =========================
   RECURRING
   ========================= */
function applyRecurring() {
  const adds = [];
  if (Number(recurring.rent) > 0) adds.push({ name: "Rent", amount: Number(recurring.rent) });
  if (Number(recurring.food) > 0) adds.push({ name: "Food", amount: Number(recurring.food) });
  if (Number(recurring.wifi) > 0) adds.push({ name: "Wifi", amount: Number(recurring.wifi) });

  if (adds.length) fixedExpenses = [...adds, ...fixedExpenses];
  renderFixedTable();
  updateSummary();
}

/* =========================
   FIXED EXPENSES
   ========================= */
function addFixedExpense() {
  const name = (fixedName.value || "").trim();
  const amount = parseFloat(fixedAmount.value);
  if (!name || isNaN(amount) || amount <= 0) {
    alert("⚠️ Please enter valid fixed expense details!");
    return;
  }
  fixedExpenses.push({ name, amount });
  fixedName.value = "";
  fixedAmount.value = "";
  renderFixedTable();
  updateSummary();
}

function editFixedExpense(index) {
  const item = fixedExpenses[index];
  const newName = prompt("Edit Fixed Expense Name:", item.name);
  const newAmount = parseFloat(prompt("Edit Amount:", item.amount));
  if (newName && !isNaN(newAmount) && newAmount > 0) {
    fixedExpenses[index] = { name: newName, amount: newAmount };
    renderFixedTable();
    updateSummary();
  }
}

function deleteFixedExpense(index) {
  fixedExpenses.splice(index, 1);
  renderFixedTable();
  updateSummary();
}

function renderFixedTable() {
  fixedTable.innerHTML = "";
  fixedExpenses.forEach((exp, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.name}</td>
      <td>₹${exp.amount}</td>
      <td>
        <button class="edit-btn" onclick="editFixedExpense(${i})">Edit</button>
        <button class="delete-btn" onclick="deleteFixedExpense(${i})">Delete</button>
      </td>`;
    fixedTable.appendChild(tr);
  });
}

/* =========================
   EXTRA EXPENSES
   ========================= */
let sortDesc = true;

function formatDateForStorage(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function addExtraExpense() {
  const name = (expenseName.value || "").trim();
  const amount = parseFloat(expenseAmount.value);
  const dateStr = expenseDate.value;
  const note = (expenseNote.value || "").trim();

  if (!name || isNaN(amount) || amount <= 0) {
    alert("⚠️ Please enter valid extra expense details!");
    return;
  }

  const fullDateTime = formatDateForStorage(dateStr);

  extraExpenses.push({ name, amount, date: fullDateTime, note: note || undefined });
  expenseName.value = "";
  expenseAmount.value = "";
  expenseDate.value = "";
  expenseNote.value = "";
  renderExtraTable();
  updateSummary();
}

function editExtraExpense(index) {
  const item = extraExpenses[index];
  const newName = prompt("Edit Extra Expense Name:", item.name);
  const newAmount = parseFloat(prompt("Edit Amount:", item.amount));
  const newDate = prompt("Edit Date & Time (YYYY-MM-DD HH:MM):", item.date);
  const newNote = prompt("Edit Note (optional, leave blank to remove):", item.note ?? "");

  if (newName && !isNaN(newAmount) && newAmount > 0 && newDate) {
    extraExpenses[index] = { name: newName, amount: newAmount, date: newDate, note: newNote?.trim() || undefined };
    renderExtraTable();
    updateSummary();
  }
}

function deleteExtraExpense(index) {
  extraExpenses.splice(index, 1);
  renderExtraTable();
  updateSummary();
}

function renderExtraTable() {
  expenseTable.innerHTML = "";
  extraExpenses.forEach((exp, i) => {
    const noteHTML = exp.note ? `<span class="note">📝 ${exp.note}</span>` : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.name}${noteHTML}</td>
      <td>₹${exp.amount}</td>
      <td>${exp.date}</td>
      <td>
        <button class="edit-btn" onclick="editExtraExpense(${i})">Edit</button>
        <button class="delete-btn" onclick="deleteExtraExpense(${i})">Delete</button>
      </td>`;
    expenseTable.appendChild(tr);
  });
}

function sortExtraByAmount() {
  if (sortDesc) {
    extraExpenses.sort((a, b) => b.amount - a.amount);
    sortExtraBtn.textContent = "🔼 Sort Ascending";
  } else {
    extraExpenses.sort((a, b) => a.amount - b.amount);
    sortExtraBtn.textContent = "🔽 Sort Descending";
  }
  sortDesc = !sortDesc;
  renderExtraTable();
  updateSummary();
}

/* =========================
   CSV EXPORT
   ========================= */
function formatCSVDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // fallback if invalid
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  // Add spaces before T for better readability
  return `${year}-${month}-${day}   T${hours}:${minutes}`;
}

function toCSVRow(arr) {
  return arr.map(v => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }).join(",");
}

function downloadCSVFile(filename, rows) {
  const csv = rows.map(toCSVRow).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function downloadHistoryAll() {
  const rows = [["Month","Type","Name","Amount","Date","Note"]];
  const months = Object.keys(history);
  if (months.length === 0) {
    alert("No history available yet!");
    return;
  }
  months.forEach(month => {
    (history[month].fixed || []).forEach(f => rows.push([month,"Fixed",f.name,f.amount,"",""]));
    (history[month].extra || []).forEach(e => rows.push([month,"Extra",e.name,e.amount,formatCSVDate(e.date),e.note || ""]));
  });
  downloadCSVFile("expense_history.csv", rows);
}

function downloadSelectedMonth() {
  const month = monthSelect.value;
  let data;
  if (month === currentMonthKey) {
    data = { fixed: fixedExpenses, extra: extraExpenses, budget: totalBudget };
  } else {
    data = history[month];
  }
  if (!data) {
    alert("No data for the selected month.");
    return;
  }
  const rows = [["Month","Type","Name","Amount","Date","Note"]];
  (data.fixed || []).forEach(f => rows.push([month,"Fixed",f.name,f.amount,"",""]));
  (data.extra || []).forEach(e => rows.push([month,"Extra",e.name,e.amount,formatCSVDate(e.date),e.note || ""]));
  downloadCSVFile(`${month.replaceAll(" ","_")}.csv`, rows);
}


/* =========================
   BUDGET / RESET / THEME
   ========================= */
function setBudget() {
  const val = parseFloat(budgetInput.value);
  if (isNaN(val) || val <= 0) {
    alert("⚠️ Please enter a valid budget amount!");
    return;
  }
  totalBudget = val;
  updateSummary();
}

function resetAllData() {
  const confirmReset = confirm("⚠️ You are about to RESET ALL data (including history and recurring defaults). This action cannot be undone. Are you sure?");
  if (!confirmReset) return; // If user clicks "Cancel", do nothing

  // Reset data
  fixedExpenses = [];
  extraExpenses = [];
  totalBudget = 12000;
  history = {};
  recurring = { rent: 4000, food: 2800, wifi: 250 };
  
  // Reset UI
  budgetInput.value = totalBudget;
  recurringRent.value = recurring.rent;
  recurringFood.value = recurring.food;
  recurringWifi.value = recurring.wifi;

  // Clear localStorage and save fresh state
  localStorage.clear();
  saveAll();

  // Re-render UI
  renderFixedTable();
  renderExtraTable();
  refreshMonthSelect();
  updateSummary();

  alert("✅ All data has been reset successfully.");
}


function toggleTheme() {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", mode);
  themeToggleBtn.textContent = mode === "dark" ? "☀️" : "🌙";
}

function saveRecurring() {
  const r = Number(recurringRent.value) || 0;
  const f = Number(recurringFood.value) || 0;
  const w = Number(recurringWifi.value) || 0;
  recurring = { rent: r, food: f, wifi: w };
  saveAll();
  alert("Recurring defaults saved.");
}

function applyRecurringNow() {
  applyRecurring();
  saveAll();
}

/* =========================
   QUICK CHIPS
   ========================= */
function onChipClick(e) {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  expenseName.value = btn.dataset.name;
  expenseAmount.focus();
}

/* =========================
   EVENTS
   ========================= */
setBudgetBtn.addEventListener("click", setBudget);
resetBtn.addEventListener("click", resetAllData);
themeToggleBtn.addEventListener("click", toggleTheme);
saveRecurringBtn.addEventListener("click", saveRecurring);
applyRecurringNowBtn.addEventListener("click", applyRecurringNow);
addFixedBtn.addEventListener("click", addFixedExpense);
addExtraBtn.addEventListener("click", addExtraExpense);
sortExtraBtn.addEventListener("click", sortExtraByAmount);
downloadHistoryBtn.addEventListener("click", downloadHistoryAll);
downloadSelectedBtn.addEventListener("click", downloadSelectedMonth);
quickChips.addEventListener("click", onChipClick);

/* =========================
   INIT RENDER
   ========================= */
renderFixedTable();
renderExtraTable();
updateSummary();

/* Expose editors for inline onclick */
window.editFixedExpense = editFixedExpense;
window.deleteFixedExpense = deleteFixedExpense;
window.editExtraExpense = editExtraExpense;
window.deleteExtraExpense = deleteExtraExpense;

// Collapsible About Section
const aboutToggle = document.getElementById("aboutToggle");
const aboutContent = document.querySelector(".about-content");
const aboutArrow = document.getElementById("aboutArrow");

aboutToggle.addEventListener("click", () => {
  const isVisible = aboutContent.style.display === "block";
  aboutContent.style.display = isVisible ? "none" : "block";
  aboutArrow.textContent = isVisible ? "▼" : "▲";
});
