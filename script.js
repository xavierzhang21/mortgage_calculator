// ===== Storage =====
function safeGetRecords() {
  try {
    let str = localStorage.getItem("records_v2");
    if (!str) return [];
    let arr = JSON.parse(str);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

let data = safeGetRecords();

function save() {
  try {
    localStorage.setItem("records_v2", JSON.stringify(data));
  } catch (e) {
    alert("存储失败：浏览器可能开启了隐私模式或存储已满");
  }
}

// ===== DOM =====
const priceEl = document.getElementById("price");
const typeEl = document.getElementById("type");
const categoryEl = document.getElementById("category");
const noteEl = document.getElementById("note");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");

// ===== Utils =====
function now() {
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const H = String(d.getHours()).padStart(2, '0');
  const Mi = String(d.getMinutes()).padStart(2, '0');

  return {
    ym: `${Y}-${M}`,
    time: `${Y}-${M}-${D} ${H}:${Mi}`
  };
}

// ===== Add Record =====
function add() {
  let val = priceEl.value.trim();
  let price = parseFloat(val);

  if (isNaN(price) || price <= 0) {
    alert("请输入有效金额（如 10.5）");
    priceEl.focus();
    return;
  }

  const type = typeEl.value;
  const cat = categoryEl.value;
  const note = noteEl.value.trim();
  const t = now();

  data.push({
    id: Date.now(),
    price,
    type,
    cat,
    note,
    ym: t.ym,
    time: t.time
  });

  priceEl.value = "";
  noteEl.value = "";

  save();
  render();
}

// ===== Delete =====
function del(id) {
  data = data.filter(x => x.id !== id);
  save();
  render();
}

// ===== Stats =====
function stats() {
  let income = 0;
  let expense = 0;

  data.forEach(r => {
    if (r.type === "in") income += r.price;
    else expense += r.price;
  });

  incomeEl.textContent = income.toFixed(2);
  expenseEl.textContent = expense.toFixed(2);
  balanceEl.textContent = (income - expense).toFixed(2);
}

// ===== Trend Chart =====
let trendChart;

function trend() {
  const map = {};

  data.forEach(r => {
    if (!map[r.ym]) map[r.ym] = 0;
    if (r.type === "out") map[r.ym] += r.price;
  });

  const labels = Object.keys(map).sort();
  const values = labels.map(m => map[m]);

  const ctx = document.getElementById("trend").getContext("2d");

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "月度支出",
        data: values,
        borderColor: "#00A395",
        backgroundColor: "rgba(0,163,149,0.1)",
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ===== Pie Chart =====
let pieChart;

function pie() {
  const map = {};

  data.forEach(r => {
    if (r.type !== "out") return;
    if (!map[r.cat]) map[r.cat] = 0;
    map[r.cat] += r.price;
  });

  const labels = Object.keys(map);
  const values = labels.map(k => map[k]);

  const ctx = document.getElementById("pie").getContext("2d");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#00A395","#5AC8BE","#A7F3E7","#81E9D9","#4FC9B9",
          "#33B5A7","#68C2B5","#9AD3CB","#BEEAE3","#D5F3EE","#A0D9D0"
        ]
      }]
    },
    options: {
      responsive: true
    }
  });
}

// ===== List Rendering =====
function list() {
  const box = document.getElementById("records");
  box.innerHTML = "";

  const groups = {};

  data.forEach(r => {
    if (!groups[r.ym]) groups[r.ym] = [];
    groups[r.ym].push(r);
  });

  Object.keys(groups)
    .sort()
    .reverse()
    .forEach(month => {
      const h = document.createElement("div");
      h.className = "month";
      h.textContent = month;
      box.appendChild(h);

      groups[month]
        .sort((a, b) => b.time.localeCompare(a.time))
        .forEach(r => {
          const div = document.createElement("div");
          div.className = "record";

          const sign = r.type === "in" ? "+" : "-";
          const cls = r.type === "in" ? "income" : "expense";

          div.innerHTML = `
            <div>
              <div>${r.cat}</div>
              <div class="meta">${r.time} ${r.note ? "· " + r.note : ""}</div>
            </div>
            <div class="${cls}">
              ${sign}${r.price.toFixed(2)}
              <span class="del" onclick="del(${r.id})">🗑️</span>
            </div>
          `;

          box.appendChild(div);
        });
    });
}

// ===== Export CSV =====
function exportCSV() {
  const rows = ["时间,类型,分类,金额,备注"];

  data.forEach(r => {
    rows.push(`${r.time},${r.type},${r.cat},${r.price},${r.note || ""}`);
  });

  const blob = new Blob([rows.join("\n")], {
    type: "text/csv;charset=utf-8"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "记账记录.csv";
  a.click();
}

// ===== Main Render =====
function render() {
  stats();
  trend();
  pie();
  list();
}

// ===== Events =====
priceEl.addEventListener("keypress", e => {
  if (e.key === "Enter") add();
});

// ===== Init =====
render();
