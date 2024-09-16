const budgetForm = document.getElementById('budget-form');
const transactionList = document.getElementById('transaction-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const balanceEl = document.getElementById('balance');
const filterType = document.getElementById('filter-type');
const filterDayInput = document.getElementById('filter-day');
const filterMonthInput = document.getElementById('filter-month');
const filterYearInput = document.getElementById('filter-year');
const filterInputs = document.querySelectorAll('.filter-input');
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

let expenseChartInstance;
let balanceChartInstance;

// Sauvegarde les transactions dans LocalStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Obtient la date actuelle au format YYYY-MM-DD
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];  // Format: YYYY-MM-DD
}

// Ajoute la transaction lors de la soumission du formulaire
budgetForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = getCurrentDate();  // Utilise la date actuelle automatiquement

    if (isNaN(amount) || amount <= 0) return;

    // Crée une nouvelle transaction avec la date courante
    const transaction = { type, category, amount, date };

    // Ajoute la transaction au tableau des transactions
    transactions.push(transaction);

    // Sauvegarde les transactions dans LocalStorage
    saveTransactions();

    // Applique le filtre actuel pour afficher les transactions mises à jour
    applyFilter();

    // Réinitialise le formulaire après l'ajout de la transaction
    budgetForm.reset();
});

// Applique le filtre selon le type sélectionné
function applyFilter() {
    let filteredTransactions = [];
    const filterTypeValue = filterType.value;

    // Applique le filtre selon le type (jour, mois, année)
    if (filterTypeValue === 'day') {
        const filterDay = filterDayInput.value;
        filteredTransactions = transactions.filter(t => t.date && t.date === filterDay);
    } else if (filterTypeValue === 'month') {
        const filterMonth = filterMonthInput.value;
        filteredTransactions = transactions.filter(t => t.date && t.date.startsWith(filterMonth));
    } else if (filterTypeValue === 'year') {
        const filterYear = filterYearInput.value;
        filteredTransactions = transactions.filter(t => t.date && t.date.startsWith(filterYear));
    } else {
        // Si aucun filtre n'est appliqué, affiche toutes les transactions
        filteredTransactions = transactions;
    }

    // Mets à jour l'affichage des transactions et du résumé
    updateTransactions(filteredTransactions);
    updateSummary(filteredTransactions);
}

// Mets à jour l'affichage des transactions dans la liste
function updateTransactions(filteredTransactions) {
    transactionList.innerHTML = '';  // Vide la liste des transactions
    filteredTransactions.forEach((transaction, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${transaction.category} - ${transaction.type === 'income' ? '+' : '-'}${transaction.amount}€
            <button onclick="deleteTransaction(${index})">Supprimer</button>
        `;
        transactionList.appendChild(li);  // Ajoute chaque transaction à la liste
    });
    updateCharts(filteredTransactions);  // Mets à jour les graphiques
}

// Supprime une transaction et mets à jour les données
function deleteTransaction(index) {
    transactions.splice(index, 1);
    saveTransactions();
    applyFilter();
}

// Mets à jour le résumé des revenus/dépenses
function updateSummary(filteredTransactions) {
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    totalIncomeEl.textContent = totalIncome;
    totalExpensesEl.textContent = totalExpenses;
    balanceEl.textContent = balance;
}

// Mets à jour les graphiques (camembert et graphique linéaire)
function updateCharts(filteredTransactions) {
    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }

    const expensesByCategory = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const ctxExpense = document.getElementById('expenseChart').getContext('2d');
    expenseChartInstance = new Chart(ctxExpense, {
        type: 'pie',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56']
            }]
        }
    });

    const balanceOverTime = filteredTransactions.map((t, i) => ({
        x: i + 1,
        y: filteredTransactions.slice(0, i + 1)
            .reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0)
    }));

    const ctxBalance = document.getElementById('balanceChart').getContext('2d');
    balanceChartInstance = new Chart(ctxBalance, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Solde au fil du temps',
                data: balanceOverTime,
                fill: false,
                borderColor: '#42a5f5',
                tension: 0.1
            }]
        }
    });
}

// Gère le changement du type de filtre
filterType.addEventListener('change', function () {
    filterInputs.forEach(input => input.style.display = 'none');
    const selectedFilter = filterType.value;

    if (selectedFilter === 'day') {
        filterDayInput.style.display = 'block';
    } else if (selectedFilter === 'month') {
        filterMonthInput.style.display = 'block';
    } else if (selectedFilter === 'year') {
        filterYearInput.style.display = 'block';
    }
});

// Applique le filtre au clic sur "Appliquer le filtre"
document.getElementById('apply-filter').addEventListener('click', applyFilter);

// Charge les transactions et affiche le tout au démarrage
applyFilter();
