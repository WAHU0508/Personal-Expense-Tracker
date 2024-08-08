document.addEventListener('DOMContentLoaded', () => {
    // Elements from the HTML
    const addExpenseForm = document.getElementById('addExpenseForm');
    const deleteButton = document.getElementById('deleteButton');
    const sortOptions = document.querySelectorAll('#sortButton + .dropdown-menu a');
    const expenseChart = document.getElementById('expenseChart').getContext('2d');
    const myMonthlyBudget = document.getElementById('monthlyBudget');
    const remainingBudgetDisplay = document.getElementById('remainingBudget');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const budgetForm = document.getElementById('budgetForm');
    const logoutButton = document.getElementById('logoutButton');

    let loggedInUserId = null;
    let selectedExpenses = [];
    let expenses = [];
    let monthlyBudget = 20000;

    // Check if user is logged in
    function isLoggedIn() {
        return loggedInUserId !== null;
    }

    // Check and fetch logged-in user's data
    function checkLoggedInStatus() {
        const storedUserId = localStorage.getItem('loggedInUserId');
        if (storedUserId) {
            loggedInUserId = parseInt(storedUserId, 10);
            fetchExpenses();
        }
    }

    // Logout function
    function logout() {
        localStorage.removeItem('loggedInUserId');
        loggedInUserId = null;
        expenses = [];
        displayExpenses();
        updateSummary();
        updateChart();
        alert('Logged out successfully');
    }

    logoutButton.addEventListener('click', logout);

    // User Registration
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const userData = {
            name: formData.get('registerName'),
            email: formData.get('registerEmail'),
            password: formData.get('registerPassword')
        };

        fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        })
        .then(response => response.json())
        .then(data => {
            alert('User registered successfully');
            registerForm.reset();
            const regModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            regModal.hide();
        })
        .catch(error => {
            console.error('Error registering user:', error);
            alert('Error registering user');
        });
    });

    // User Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const name = formData.get('loginName');
        const email = formData.get('loginEmail');
        const password = formData.get('loginPassword');

        fetch('http://localhost:3000/users')
            .then(response => response.json())
            .then(users => {
                const user = users.find(user => user.name === name && user.email === email && user.password === password);
                if (user) {
                    loggedInUserId = user.id;
                    localStorage.setItem('loggedInUserId', loggedInUserId);
                    alert('Logged in successfully');
                    loginForm.reset();
                    const logModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    logModal.hide();
                    fetchExpenses();
                    updateSummary();
                } else {
                    alert('Invalid credentials');
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('Error logging in');
            });
    });

    // Fetch expenses for the logged-in user
    function fetchExpenses() {
        if (!isLoggedIn()) {
            alert('Please log in to view expenses.');
            return;
        }

        fetch(`http://localhost:3000/expenses?userId=${loggedInUserId}`)
            .then(res => res.json())
            .then(data => {
                expenses = data;
                displayExpenses();
                updateSummary();
                updateChart();
            })
            .catch(error => console.error(`Fetching Error: ${error}`));
    }

    // Calculate and update the total expenditure
    function totalExpenditure(category = null) {
        return new Promise((resolve, reject) => {
            if (!isLoggedIn()) {
                reject(new Error('User not logged in'));
                return;
            }
    
            fetch(`http://localhost:3000/expenses?userId=${loggedInUserId}`)
                .then(res => res.json())
                .then(data => {
                    let filteredExpenses = data;
                    if (category !== null) {
                        filteredExpenses = data.filter(expense => expense.category === category);
                    }
                    const total = filteredExpenses.reduce((acc, expense) => acc + parseFloat(expense.amount), 0);
                    resolve(total);
                })
                .catch(error => {
                    console.error(`Error getting total: ${error}`);
                    reject(error);
                });
        });
    }
    
    // Update the summary and remaining budget
    function updateSummary() {
        if (!isLoggedIn()) {
            console.log('User not logged in. Cannot update summary.');
            return;
        }
    
        totalExpenditure().then(total => {
            document.getElementById('currentExpense').textContent = `Total expense: $${total.toFixed(2)}`;
            document.getElementById('totalSum').textContent = `Total expense: $${total.toFixed(2)}`;
            calculateRemainingBudget(total);
        }).catch(error => console.error('Error updating total expenditure:', error));
    
        const categories = ['Groceries', 'Transport', 'Personal Care', 'Entertainment', 'Utilities', 'Other'];
        categories.forEach(category => {
            totalExpenditure(category).then(total => {
                document.getElementById(category.toLowerCase().replace(' ', '-')).textContent = `${category}: $${total.toFixed(2)}`;
            }).catch(error => console.error(`Error updating ${category} total:`, error));
        });
    }

    // Calculate and display the remaining budget
    function calculateRemainingBudget(totalExpenses) {
        const updateRemainingBudget = () => {
            const remainingBudget = monthlyBudget - totalExpenses;
            remainingBudgetDisplay.textContent = `Remaining Budget: $${remainingBudget.toFixed(2)}`;
            if (totalExpenses >= monthlyBudget) {
                alert("Oops! Looks like you have exhausted your monthly budget.");
            }
        };

        fetch('http://localhost:3000/budget/1')
            .then(res => res.json())
            .then(data => {
                monthlyBudget = parseFloat(data.monthlyBudget);
                myMonthlyBudget.textContent = data.monthlyBudget;
                updateRemainingBudget();

                myMonthlyBudget.addEventListener('dblclick', () => {
                    const editBudget = document.createElement('input');
                    editBudget.type = 'number';
                    editBudget.value = myMonthlyBudget.textContent;
                    myMonthlyBudget.replaceWith(editBudget);

                    editBudget.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const newBudget = editBudget.value.trim();
                            if (newBudget !== '' && newBudget !== myMonthlyBudget.textContent) {
                                fetch('http://localhost:3000/budget/1', {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ monthlyBudget: newBudget })
                                })
                                .then(res => res.json())
                                .then(budget => {
                                    monthlyBudget = parseFloat(budget.monthlyBudget);
                                    myMonthlyBudget.textContent = budget.monthlyBudget;
                                    updateRemainingBudget();
                                })
                                .catch(error => console.error(`Error updating budget: ${error}`));
                            }
                            editBudget.replaceWith(myMonthlyBudget);
                        }
                    });
                });
            })
            .catch(error => console.error(`Error fetching budget: ${error}`));
    }

    // Sort expenses and update the display
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

    // Display the expenses in the table
    function displayExpenses() {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        expenses.forEach(expense => {
            const row = createExpenseRow(expense);
            tbody.appendChild(row);
        });

        updateChart();
    }

    // Handle expense form submission
    function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(addExpenseForm);
        const expenseData = {
            userId: loggedInUserId,
            date: formData.get('date'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            notes: formData.get('notes'),
        };

        fetch('http://localhost:3000/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData),
        })
        .then(response => response.json())
        .then(data => {
            expenses.push(data);
            displayExpenses();
            updateSummary();
            updateChart();
            addExpenseForm.reset();
        })
        .catch(error => {
            console.error('Error adding expense:', error);
            alert('Error adding expense');
        });
    }

    addExpenseForm.addEventListener('submit', handleSubmit);

    // Update an existing expense in the database
    function updateExpense(expenseId, updatedExpense) {
        fetch(`http://localhost:3000/expenses/${expenseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedExpense),
        })
        .then(response => response.json())
        .then(data => {
            const index = expenses.findIndex(expense => expense.id === expenseId);
            expenses[index] = data;
            displayExpenses();
            updateSummary();
            updateChart();
        })
        .catch(error => {
            console.error('Error updating expense:', error);
            alert('Error updating expense');
        });
    }

    // Create an expense row in the table
    function createExpenseRow(expense) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>${expense.amount}</td>
            <td>${expense.notes}</td>
        `;
        tr.setAttribute('data-id', expense.id);

        tr.addEventListener('click', () => {
            const isSelected = selectedExpenses.includes(expense.id);
            if (isSelected) {
                selectedExpenses = selectedExpenses.filter(id => id !== expense.id);
                tr.classList.remove('selected');
            } else {
                selectedExpenses.push(expense.id);
                tr.classList.add('selected');
            }
        });

        tr.addEventListener('dblclick', () => {
            editExpenseRow(tr, expense);
        });

        return tr;
    }

    // Edit an expense row in the table
    function editExpenseRow(tr, expense) {
        tr.innerHTML = `
            <td><input type="date" value="${expense.date}" class="edit-date"></td>
            <td><input type="text" value="${expense.category}" class="edit-category"></td>
            <td><input type="number" value="${expense.amount}" class="edit-amount"></td>
            <td><input type="text" value="${expense.notes}" class="edit-notes"></td>
        `;

        const dateInput = tr.querySelector('.edit-date');
        const categoryInput = tr.querySelector('.edit-category');
        const amountInput = tr.querySelector('.edit-amount');
        const notesInput = tr.querySelector('.edit-notes');

        dateInput.addEventListener('blur', () => {
            expense.date = dateInput.value;
            updateExpense(expense.id, expense);
        });

        categoryInput.addEventListener('blur', () => {
            expense.category = categoryInput.value;
            updateExpense(expense.id, expense);
        });

        amountInput.addEventListener('blur', () => {
            expense.amount = parseFloat(amountInput.value);
            updateExpense(expense.id, expense);
        });

        notesInput.addEventListener('blur', () => {
            expense.notes = notesInput.value;
            updateExpense(expense.id, expense);
        });

        dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') dateInput.blur();
        });

        categoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') categoryInput.blur();
        });

        amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') amountInput.blur();
        });

        notesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') notesInput.blur();
        });
    }

    // Delete selected expenses
    deleteButton.addEventListener('click', () => {
        const confirmed = confirm('Are you sure you want to delete selected expenses?');
        if (confirmed) {
            selectedExpenses.forEach(expenseId => {
                fetch(`http://localhost:3000/expenses/${expenseId}`, {
                    method: 'DELETE'
                })
                .then(() => {
                    expenses = expenses.filter(expense => expense.id !== expenseId);
                    selectedExpenses = [];
                    displayExpenses();
                    updateSummary();
                    updateChart();
                })
                .catch(error => {
                    console.error(`Error deleting expense: ${error}`);
                    alert('Error deleting expense');
                });
            });
        }
    });

    // Update chart with current expenses
    function updateChart() {
        const categories = ['Groceries', 'Transport', 'Personal Care', 'Entertainment', 'Utilities', 'Other'];
        const categoryTotals = categories.map(category => {
            return expenses.filter(expense => expense.category === category).reduce((acc, expense) => acc + expense.amount, 0);
        });

        if (expenseChartInstance) {
            expenseChartInstance.destroy();
        }

        expenseChartInstance = new Chart(expenseChart, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryTotals,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF6347', '#36A2EB', '#FF6384'],
                }],
            },
        });
    }

    // Initial setup
    sortOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const sortOption = e.target.dataset.sort;
            sortExpenses(sortOption);
        });
    });

    checkLoggedInStatus();
});
