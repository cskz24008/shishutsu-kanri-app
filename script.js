// --- 状態管理 (モデル) ---
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let chartInstance = null;

// DOM要素の取得
let expenseForm, amountInput, dateInput, categoryInput, memoInput, expenseList, monthlyTotalText, searchKeyword, filterCategory, noDataMessage;

// アプリ起動時の初期化処理
function initApp() {
    expenseForm = document.getElementById('expense-form');
    amountInput = document.getElementById('amount');
    dateInput = document.getElementById('date');
    categoryInput = document.getElementById('category');
    memoInput = document.getElementById('memo');
    expenseList = document.getElementById('expense-list');
    monthlyTotalText = document.getElementById('monthly-total');
    searchKeyword = document.getElementById('search-keyword');
    filterCategory = document.getElementById('filter-category');
    noDataMessage = document.getElementById('no-data-message');

    // 日付の初期値を当日に設定
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // イベントリスナーの登録
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleFormSubmit);
    }
    if (searchKeyword) {
        searchKeyword.addEventListener('input', updateUI);
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', updateUI);
    }

    // 初回UI描画
    updateUI();
}

// フォーム送信時の処理 (登録)
function handleFormSubmit(e) {
    e.preventDefault();

    const amount = parseInt(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('正しい金額を入力してください。');
        return;
    }

    const newExpense = {
        id: Date.now().toString(),
        amount: amount,
        date: dateInput.value,
        category: categoryInput.value,
        memo: memoInput.value.trim()
    };

    expenses.push(newExpense);
    saveToLocalStorage();
    
    // 入力欄のクリア
    amountInput.value = '';
    memoInput.value = '';
    
    updateUI();
}

// データの永続化
function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// データの削除 (グローバルスコープから呼べるようにwindowオブジェクトに紐付け)
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveToLocalStorage();
    updateUI();
};

// UIの更新（一覧表示・集計・検索フィルタ）
function updateUI() {
    const keyword = searchKeyword ? searchKeyword.value.toLowerCase() : '';
    const selectedCategory = filterCategory ? filterCategory.value : 'all';

    // フィルタリング処理
    const filteredExpenses = expenses.filter(exp => {
        const matchesKeyword = exp.memo ? exp.memo.toLowerCase().includes(keyword) : keyword === '';
        const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
        return matchesKeyword && matchesCategory;
    });

    // 履歴リストの描画
    if (expenseList) {
        expenseList.innerHTML = '';
        
        // 日付の新しい順に並び替え
        const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sorted.forEach(exp => {
            const li = document.createElement('li');
            li.className = 'expense-item';
            li.innerHTML = `
                <div class="expense-info">
                    <span><strong>${exp.category}</strong>: ${exp.amount.toLocaleString()} 円</span>
                    <span class="expense-meta">${exp.date} ${exp.memo ? `| ${exp.memo}` : ''}</span>
                </div>
                <button class="delete-btn" onclick="deleteExpense('${exp.id}')">削除</button>
            `;
            expenseList.appendChild(li);
        });
    }

    // 金額の集計
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    if (monthlyTotalText) {
        monthlyTotalText.textContent = total.toLocaleString();
    }

    // カテゴリ別集計
    const categoryTotals = { '食費': 0, '交通費': 0, '娯楽費': 0, 'その他': 0 };
    filteredExpenses.forEach(exp => {
        if (categoryTotals[exp.category] !== undefined) {
            categoryTotals[exp.category] += exp.amount;
        }
    });

    // グラフの更新
    updateChart(categoryTotals);
}

// グラフの描画処理
function updateChart(categoryTotals) {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 既存のグラフがあれば一度確実に破棄
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // データが全て0（未登録）の場合の処理
    const hasData = Object.values(categoryTotals).some(val => val > 0);
    if (!hasData) {
        canvas.style.display = 'none';
        if (noDataMessage) noDataMessage.style.display = 'block';
        return;
    }

    // データがある場合はグラフを表示
    canvas.style.display = 'block';
    if (noDataMessage) noDataMessage.style.display = 'none';

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56']
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

// DOMの読み込みが完了したらアプリを起動
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}