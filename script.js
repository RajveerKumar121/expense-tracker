// Django REST API Base URL
const API_BASE_URL = 'https://expense-tracker-api-9gfw.onrender.com/api/transactions/';

const CATEGORIES = {
    expense: ['Food & Dining', 'Rent & Utilities', 'Entertainment', 'Transportation', 'Shopping'],
    income: ['Salary', 'Freelance', 'Investments', 'Other']
};

let transactions = [];
let chartInstance = null;

// DOM Elements
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

// --- Backend API Calls ---
async function fetchTransactions() {
    try {
        const res = await fetch(API_BASE_URL);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        transactions = await res.json();
        updateDashboard();
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

async function addTransaction(txData) {
    try {
        const res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Validation error:', errorData);
            alert('Error adding transaction. Please check your inputs.');
            return;
        }

        const savedTx = await res.json();
        transactions.unshift(savedTx);
        updateDashboard();
    } catch (err) {
        console.error('Error:', err);
        alert('Server error: Make sure your Django backend is running.');
    }
}

async function deleteTransaction(id) {
    try {
        const res = await fetch(`${API_BASE_URL}${id}/`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Failed to delete transaction');

        transactions = transactions.filter(t => t.id !== id);
        updateDashboard();
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to delete transaction.');
    }
}

// --- UI & Rendering ---
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

function updateDashboard() {
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
      <td style="text-align: right; font-weight: 600; color: ${isIncome ? 'var(--income-color)' : 'var(--text-main)'};">
        ${isIncome ? '+' : '-'}$${Number(t.amount).toFixed(2)}
      </td>
      <td style="text-align: center;">
        <button class="btn-delete" onclick="deleteTransaction(${t.id})" title="Delete">✕</button>
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

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
}

// --- Event Listeners ---
txType.addEventListener('change', updateCategoryDropdown);

txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTx = {
        title: txTitle.value.trim(),
        amount: parseFloat(txAmount.value),
        type: txType.value,
        category: txCategory.value,
        date: txDate.value
    };

    addTransaction(newTx);
    txTitle.value = '';
    txAmount.value = '';
});

searchInput.addEventListener('input', renderTable);
filterType.addEventListener('change', renderTable);
filterCategory.addEventListener('change', renderTable);

// --- App Initialization ---
updateCategoryDropdown();
populateFilterCategories();
fetchTransactions();