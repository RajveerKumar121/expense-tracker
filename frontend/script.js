// --- Initial State & Categories ---
const CATEGORIES = {
    expense: ['Food & Dining', 'Rent & Utilities', 'Entertainment', 'Transportation', 'Shopping'],
    income: ['Salary', 'Freelance', 'Investments', 'Other']
};

let transactions = [
    { id: '1', title: 'Monthly Salary', amount: 4500, type: 'income', category: 'Salary', date: '2026-08-01' },
    { id: '2', title: 'Apartment Rent', amount: 1200, type: 'expense', category: 'Rent & Utilities', date: '2026-08-02' },
    { id: '3', title: 'Grocery Run', amount: 150, type: 'expense', category: 'Food & Dining', date: '2026-08-05' },
    { id: '4', title: 'Freelance Design', amount: 800, type: 'income', category: 'Freelance', date: '2026-08-10' }
];

let chartInstance = null;

// --- DOM References ---
const txForm = document.getElementById('txForm');
const txType = document.getElementById('txType');
const txCategory = document.getElementById('txCategory');
const txTitle = document.getElementById('txTitle');
const txAmount = document.getElementById('txAmount');
const txDate = document.getElementById('txDate');

const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');

const txTableBody = document.getElementById('txTableBody');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');

// Set default date to today
txDate.value = new Date().toISOString().split('T')[0];

// --- Dropdown Population ---
function updateCategoryDropdown() {
    const type = txType.value;
    txCategory.innerHTML = '';
    CATEGORIES[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        txCategory.appendChild(option);
    });
}

function populateFilterCategories() {
    filterCategory.innerHTML = '<option value="all">All Categories</option>';
    const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
    allCats.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
    });
}

// --- Dashboard Render Logic ---
function updateDashboard() {
    // 1. Calculate Totals
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expense;

    totalBalance.textContent = `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    totalIncome.textContent = `+$${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    totalExpense.textContent = `-$${expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    // 2. Render Table & Chart
    renderTable();
    renderChart();
}

function renderTable() {
    const query = searchInput.value.toLowerCase();
    const type = filterType.value;
    const cat = filterCategory.value;

    const filtered = transactions.filter(t => {
        const matchesQuery = t.title.toLowerCase().includes(query);
        const matchesType = type === 'all' || t.type === type;
        const matchesCat = cat === 'all' || t.category === cat;
        return matchesQuery && matchesType && matchesCat;
    });

    txTableBody.innerHTML = '';

    if (filtered.length === 0) {
        txTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No transactions found.
        </td>
      </tr>
    `;
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        const isIncome = t.type === 'income';
        tr.innerHTML = `
      <td style="font-weight: 500;">${escapeHtml(t.title)}</td>
      <td><span class="badge">${escapeHtml(t.category)}</span></td>
      <td style="color: var(--text-muted);">${t.date}</td>
      <td class="text-right" style="font-weight: 600; color: ${isIncome ? 'var(--income-color)' : 'var(--text-main)'};">
        ${isIncome ? '+' : '-'}$${Number(t.amount).toFixed(2)}
      </td>
      <td class="text-center">
        <button class="btn-delete" onclick="deleteTransaction('${t.id}')" title="Delete">✕</button>
      </td>
    `;
        txTableBody.appendChild(tr);
    });
}

function renderChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const expenses = transactions.filter(t => t.type === 'expense');

    const categoryMap = {};
    expenses.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (chartInstance) {
        chartInstance.destroy();
    }

    if (data.length === 0) return;

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#3b82f6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// --- Actions & Helpers ---
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateDashboard();
}

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s];
    });
}

// --- Event Listeners ---
txType.addEventListener('change', updateCategoryDropdown);

txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTx = {
        id: Date.now().toString(),
        title: txTitle.value.trim(),
        amount: parseFloat(txAmount.value),
        type: txType.value,
        category: txCategory.value,
        date: txDate.value
    };

    transactions.unshift(newTx);
    txTitle.value = '';
    txAmount.value = '';

    updateDashboard();
});

searchInput.addEventListener('input', renderTable);
filterType.addEventListener('change', renderTable);
filterCategory.addEventListener('change', renderTable);

// --- Initialization ---
updateCategoryDropdown();
populateFilterCategories();
updateDashboard();