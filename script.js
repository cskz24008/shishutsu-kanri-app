// --- 状態管理 (モデル) ---
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let chartInstance = null;

// DOM要素の取得
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const memoInput = document.getElementById('memo');
const expenseList = document.getElementById('expense-list');
const monthlyTotalText = document.getElementById('monthly-total');
const searchKeyword = document.getElementById('search-keyword');
const filterCategory = document.getElementById('filter-category');

// --- アプリ初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 日付の初期値を当日に設定
    dateInput.value = new Date().toISOString().split('T')[0];
    updateUI();
});

// --- イベントリスナー ---
// 1. 支出の登録
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // バリデーション（金額チェック）
    const amount = parseInt(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('正しい金額を入力してください。');
        return;
    }

    // 新しいオブジェクト（データ型）の作成
    const newExpense = {
        id: Date.now().toString(), // 簡易的な個別ID
        amount: amount,
        date: dateInput.value,
        category: categoryInput.value,
        memo: memoInput.value.trim()
    };

    // 配列へ追加して永続化
    expenses.push(newExpense);
    saveToLocalStorage();
    
    // フォームのリセット（日付は残す）
    amountInput.value = '';
    memoInput.value = '';
    
    updateUI();
});

// 2. 検索・フィルターイベント
searchKeyword.addEventListener('input', updateUI);
filterCategory.addEventListener('change', updateUI);

// --- データの永続化 (リポジトリ機能) ---
function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 3. データの削除
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveToLocalStorage();
    updateUI();
}

// --- UIの更新（描画と集計） ---
function updateUI() {
    // 検索・フィルタリング処理
    const keyword = searchKeyword.value.toLowerCase();
    const selectedCategory = filterCategory.value;

    const filteredExpenses = expenses.filter(exp => {
        const matchesKeyword = exp.memo.toLowerCase().includes(keyword);
        const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
        return matchesKeyword && matchesCategory;
    });

    // 履歴リストの描画
    expenseList.innerHTML = '';
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
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

    // 集計ロジック (BudgetCalculatorに相当)
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    monthlyTotalText.textContent = total.toLocaleString();

    // カテゴリ別集計の計算
    const categoryTotals = { '食費': 0, '交通費': 0, '娯楽費': 0, 'その他': 0 };
    filteredExpenses.forEach(exp => {
        if (categoryTotals[exp.category] !== undefined) {
            categoryTotals[exp.category] += exp.amount;
        }
    });

    // グラフの更新
    updateChart(categoryTotals);
}

// --- グラフの描画処理 ---
function updateChart(categoryTotals) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // 既存のグラフがあれば一度破棄する
    if (chartInstance) {
        chartInstance.destroy();
    }

    // データが全て0ならグラフを表示しない
    const hasData = Object.values(categoryTotals).some(val => val > 0);
    if (!hasData) return;

    chartInstance = new Chart(ctx, {
        type: 'doughnut', // 円（ドーナツ）グラフ
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
                legend: { display: false } // スペース節約のため凡例は非表示
            }
        }
    });
}