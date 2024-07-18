document.addEventListener('DOMContentLoaded', () => {
    const addExpenseForm = document.getElementById('addExpenseForm');
    const deleteButton = document.getElementById('deleteButton');
    const sortOptions = document.querySelectorAll('#sortButton + .dropdown-menu a');
    let selectedExpenses = [];
    let expenses = [];

    initialize();

    function initialize() {
        fetchExpenses();
        displayCurrentDate();
        addExpenseForm.addEventListener('submit', handleSubmit);
        deleteButton.addEventListener('click', deleteSelectedExpenses);
        sortOptions.forEach(option => {
            option.addEventListener('click', (e) => sortExpenses(e.target.dataset.sort));
        });
        summary();
        loadAndDisplayChart();
    }

    function fetchExpenses() {
        fetch('http://localhost:3000/expenses')
            .then(res => res.json())
            .then(data => {
                expenses = data;
                displayExpenses();
            })
            .catch(error => console.error(`Fetching Error: ${error}`));
    }

    function totalExpenditure(category = null) {
        return new Promise((resolve, reject) => {
            let filteredExpenses = category ? expenses.filter(expense => expense.category === category) : expenses;
            const total = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
            resolve(total);
        });
    }

    function summary() {
        totalExpenditure().then(total => {
            document.getElementById('currentExpense').textContent = `Total expense: $${total.toFixed(2)}`;
            document.getElementById('totalSum').textContent = `Total expense: $${total.toFixed(2)}`;
        });

        ['Groceries', 'Transport', 'Personal Care', 'Entertainment', 'Utilities', 'Other'].forEach(category => {
            totalExpenditure(category).then(total => {
                document.getElementById(category.toLowerCase().replace(' ', '-')).textContent = `Total ${category}: $${total.toFixed(2)}`;
            });
        });
    }

    function sortExpenses(sortOption) {
        switch (sortOption) {
            case 'dateN':
                expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'dateO':
                expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'amountL':
                expenses.sort((a, b) => a.amount - b.amount);
                break;
            case 'amountH':
                expenses.sort((a, b) => b.amount - a.amount);
                break;
            case 'category':
                expenses.sort((a, b) => a.category.localeCompare(b.category));
                break;
        }
        displayExpenses();
    }

    function displayExpenses() {
        const tbody = document.getElementById('expensesList');
        tbody.innerHTML = '';
        expenses.forEach(expense => displayExpenseItem(expense, tbody));
    }

    function handleSubmit(event) {
        event.preventDefault();
        const category = document.getElementById('formSelect').value;
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        const newExpense = { category, description, amount, date };
        postExpense(newExpense);
        addExpenseForm.reset();
    }

    function postExpense(newExpense) {
        fetch('http://localhost:3000/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newExpense)
        })
        .then(res => res.json())
        .then(expense => {
            expenses.push(expense);
            displayExpenseItem(expense, document.getElementById('expensesList'));
        })
        .catch(error => console.error(`Posting Error: ${error}`));
    }

    function displayExpenseItem(expense, tbody) {
        const row = document.createElement('tr');
        row.dataset.id = expense.id;
        row.innerHTML = `
            <td><input type="checkbox" onchange="toggleExpenseSelection(${expense.id}, this.checked)"></td>
            <td ondblclick="editCell(this, 'category', ${expense.id})">${expense.category}</td>
            <td ondblclick="editCell(this, 'description', ${expense.id})">${expense.description}</td>
            <td ondblclick="editCell(this, 'amount', ${expense.id})">${expense.amount}</td>
            <td ondblclick="editCell(this, 'date', ${expense.id})">${expense.date}</td>
        `;
        tbody.appendChild(row);
    }

    window.editCell = function(cell, field, id) {
        const input = document.createElement(field === 'amount' ? 'input' : field === 'date' ? 'input' : 'select');
        input.value = cell.textContent;

        if (field === 'category') {
            input.innerHTML = `
                <option>Groceries</option>
                <option>Transport</option>
                <option>Personal Care</option>
                <option>Entertainment</option>
                <option>Utilities</option>
                <option>Other</option>
            `;
        } else if (field === 'amount') {
            input.type = 'number';
        } else if (field === 'date') {
            input.type = 'date';
        }

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const newValue = input.value;
                updateExpenseField(id, field, newValue).then(() => {
                    cell.textContent = newValue;
                });
            }
        });

        cell.replaceWith(input);
    }

    function updateExpenseField(id, field, value) {
        return fetch(`http://localhost:3000/expenses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        }).then(res => res.json());
    }

    function toggleExpenseSelection(expenseId, isSelected) {
        if (isSelected) {
            selectedExpenses.push(expenseId);
        } else {
            selectedExpenses = selectedExpenses.filter(id => id !== expenseId);
        }
        deleteButton.disabled = selectedExpenses.length === 0;
    }

    function deleteSelectedExpenses() {
        selectedExpenses.forEach(id => {
            fetch(`http://localhost:3000/expenses/${id}`, {
                method: 'DELETE'
            }).then(() => {
                expenses = expenses.filter(expense => expense.id !== id);
                displayExpenses();
            });
        });
        selectedExpenses = [];
        deleteButton.disabled = true;
    }

    function displayCurrentDate() {
        const currentDate = document.getElementById('currentDate');
        const date = new Date();
        currentDate.textContent = `Date: ${new Intl.DateTimeFormat('en-US').format(date)}`;
    }

    function loadAndDisplayChart() {
        fetch('http://localhost:3000/expenses')
            .then(response => response.json())
            .then(data => {
                const categoryTotals = data.reduce((acc, expense) => {
                    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
                    return acc;
                }, {});

                const categories = Object.keys(categoryTotals);
                const amounts = Object.values(categoryTotals);

                const ctx = document.getElementById('expenseChart').getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: categories,
                        datasets: [{
                            data: amounts,
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#FF9F40', '#4BC0C0', '#9966FF'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: (tooltipItem) => {
                                        return `${categories[tooltipItem.dataIndex]}: $${amounts[tooltipItem.dataIndex].toFixed(2)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }
});