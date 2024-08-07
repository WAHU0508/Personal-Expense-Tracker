document.addEventListener('DOMContentLoaded', () => {
    //Get Elements from the html
    const addExpenseForm = document.getElementById('addExpenseForm');
    const deleteButton = document.getElementById('deleteButton');
    const sortOptions = document.querySelectorAll('#sortButton + .dropdown-menu a');
    const expenseChart = document.getElementById('expenseChart').getContext('2d');
    const myMonthlyBudget = document.getElementById('monthlyBudget');
    const remainingBudgetDisplay = document.getElementById('remainingBudget');

    //Store selected expenses to delete them, expenses keyed in and initialize budget limit
    let selectedExpenses = [];
    let expenses = [];
    let monthlyBudget = 20000;

    // Fetch expenses and display them
    fetchExpenses();
    // Display current date
    displayCurrentDate();

    // Add event listeners for form submissions, delete button, sort options, and budget form
    addExpenseForm.addEventListener('submit', handleSubmit);
    deleteButton.addEventListener('click', deleteSelectedExpenses);
    sortOptions.forEach(option => {
        option.addEventListener('click', (e) => sortExpenses(e.target.dataset.sort));
    });
    budgetForm.addEventListener('submit', handleBudgetSubmit);

    // Initialize the expense chart
    initializeChart();

    // Fetch expenses from server
    function fetchExpenses() {
        fetch('http://localhost:3000/expenses')
            .then(res => res.json())
            .then(data => {
                expenses = data; // Store the fetched data
                displayExpenses();
                updateSummary();
            })
            .catch(error => console.error(`Fetching Error: ${error}`));
    }

    // Calculate total expenditure and get total expenses filtered by category
    function totalExpenditure(category = null) {
        return new Promise((resolve, reject) => {
            fetch('http://localhost:3000/expenses')
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

    // Update summary information for total expenses for all categories
    function updateSummary() {
        totalExpenditure().then(total => {
            document.getElementById('currentExpense').textContent = `Total expense: $${total.toFixed(2)}`;
            document.getElementById('totalSum').textContent = `Total expense: $${total.toFixed(2)}`;
            calculateRemainingBudget(total);
        });

        totalExpenditure('Groceries').then(groceriesTotal => {
            document.getElementById('groceries').textContent = `Groceries: $${groceriesTotal.toFixed(2)}`;
        });
        totalExpenditure('Transport').then(transportTotal => {
            document.getElementById('transport').textContent = `Transport: $${transportTotal.toFixed(2)}`;
        });
        totalExpenditure('Personal Care').then(personalCareTotal => {
            document.getElementById('personal-care').textContent = `Personal Care: $${personalCareTotal.toFixed(2)}`;
        });
        totalExpenditure('Entertainment').then(entertainmentTotal => {
            document.getElementById('entertainment').textContent = `Entertainment: $${entertainmentTotal.toFixed(2)}`;
        });
        totalExpenditure('Utilities').then(utilitiesTotal => {
            document.getElementById('utilities').textContent = `Utilities: $${utilitiesTotal.toFixed(2)}`;
        });
        totalExpenditure('Other').then(otherTotal => {
            document.getElementById('other').textContent = `Other: $${otherTotal.toFixed(2)}`;
        });
    }

    // Calculate and display the remaining budget
    function calculateRemainingBudget(totalExpenses) {
        // Function to update remaining budget
        const updateRemainingBudget = () => {
            const remainingBudget = monthlyBudget - totalExpenses;
            remainingBudgetDisplay.textContent = `Remaining Budget: $${remainingBudget.toFixed(2)}`;
        };
    
        // Initial fetch to get the budget from the server and set up the event listener
        fetch('http://localhost:3000/budget/1')
            .then(res => res.json())
            .then(data => {
                monthlyBudget = parseFloat(data.monthlyBudget); // Initialize monthlyBudget from the server data
                myMonthlyBudget.textContent = data.monthlyBudget;
    
                // Initial update of the remaining budget
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
                                        'Accept': 'application/json'
                                    },
                                    body: JSON.stringify({ monthlyBudget: newBudget })
                                })
                                    .then(res => res.json())
                                    .then(budget => {
                                        monthlyBudget = parseFloat(budget.monthlyBudget); // Update monthlyBudget variable
                                        myMonthlyBudget.textContent = budget.monthlyBudget;
                                        updateRemainingBudget(); // Update remaining budget after editing
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
    
    

    // Sort expenses based on selected option and display them
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

    // Display the sort expenses in the table
    function displayExpenses() {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        expenses.forEach(expense => {
            const row = createExpenseRow(expense);
            tbody.appendChild(row);
        });

        updateChart(); // Update the chart after displaying expenses
    }

    // Handle expense form submission
    function handleSubmit(event) {
        event.preventDefault();
        const categorySelect = document.getElementById('formSelect');
        const category = categorySelect.options[categorySelect.selectedIndex].text;
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        const newExpense = {
            category,
            description,
            amount,
            date
        };

        postExpense(newExpense);
        addExpenseForm.reset();
    }

    // Post new expense to server
    function postExpense(newExpense) {
        fetch('http://localhost:3000/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(newExpense)
        })
            .then(res => res.json())
            .then(expense => {
                expenses.push(expense); // Add new expense to local array
                displayExpenses();
                updateSummary(); // Update summary after adding new expense
            })
            .catch(error => console.error(`Posting Error: ${error}`));
    }

    // Create a table row for an expense
    function createExpenseRow(expense) {
        const row = document.createElement('tr');
        row.dataset.id = expense.id;

        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => toggleExpenseSelection(expense.id, checkbox.checked));
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = expense.category;
        categoryCell.addEventListener('dblclick', () => editCell(categoryCell, 'category', expense));
        row.appendChild(categoryCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = expense.description;
        descriptionCell.addEventListener('dblclick', () => editCell(descriptionCell, 'description', expense));
        row.appendChild(descriptionCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = expense.amount;
        amountCell.addEventListener('dblclick', () => editCell(amountCell, 'amount', expense));
        row.appendChild(amountCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = expense.date;
        dateCell.addEventListener('dblclick', () => editCell(dateCell, 'date', expense));
        row.appendChild(dateCell);

        return row;
    }

    // Edit a table cell
    function editCell(cell, key, expense) {
        const oldValue = cell.textContent;
        const input = document.createElement('input');
        input.type = key === 'amount' ? 'number' : key === 'date' ? 'date' : 'text';
        input.value = oldValue;

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const newValue = input.value.trim();
                if (newValue !== oldValue) {
                    updateExpense(expense.id, { [key]: newValue });
                } else {
                    cell.textContent = newValue;
                    input.replaceWith(cell);
                }
            }
        });

        cell.textContent = '';
        cell.appendChild(input);
        input.focus();
    }

    // Update an expense on the server once editing takes place
    function updateExpense(expenseId, updates) {
        fetch(`http://localhost:3000/expenses/${expenseId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updates)
        })
            .then(res => res.json())
            .then(updatedExpense => {
                const index = expenses.findIndex(expense => expense.id === updatedExpense.id);
                if (index !== -1) {
                    expenses[index] = updatedExpense;
                    displayExpenses();
                    updateSummary(); // Update summary after updating expense
                }
            })
            .catch(error => console.error(`Error updating expense: ${error}`));
    }

    // Toggle the selection of an expense in order to delete entry
    function toggleExpenseSelection(expenseId, isSelected) {
        if (isSelected) {
            selectedExpenses.push(expenseId);
        } else {
            const index = selectedExpenses.indexOf(expenseId);
            if (index !== -1) {
                selectedExpenses.splice(index, 1);
            }
        }
        deleteButton.disabled = selectedExpenses.length === 0;
    }

    // Delete selected expenses
    function deleteSelectedExpenses() {
        selectedExpenses.forEach(expenseId => {
            deleteExpense(expenseId);
        });
        selectedExpenses = [];
        deleteButton.disabled = true;
    }

    // Update server when an entry is deleted by user
    function deleteExpense(expenseId) {
        fetch(`http://localhost:3000/expenses/${expenseId}`, {
            method: 'DELETE'
        })
            .then(() => {
                expenses = expenses.filter(expense => expense.id !== expenseId);
                displayExpenses();
                updateSummary(); // Update summary after deleting expense
            })
            .catch(error => console.error(`Error deleting expense: ${error}`));
    }

    // Display the current date
    function displayCurrentDate() {
        const currentDate = document.getElementById('currentDate');
        const date = new Date();
        const formattedDate = new Intl.DateTimeFormat('en-US').format(date);
        currentDate.textContent = `Date: ${formattedDate}`;
    }

    // Initialize the expense chart. Sections of the pie chart initialization
    function initializeChart() {
        const categories = ['Groceries', 'Transport', 'Personal Care', 'Entertainment', 'Utilities', 'Other'];
        /*calculate the total amounts for each expense category by filtering 
        the expenses and then reducing them to get the sum*/
        const amounts = categories.map(category =>
            expenses.filter(expense => expense.category === category)
                .reduce((total, expense) => total + parseFloat(expense.amount), 0)
        );

        const chart = new Chart(expenseChart, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Total Expenses by Category',
                    data: amounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Total Expenses by Category'
                    }
                }
            }
        });
    }

    // Update the expense chart
    function updateChart() {
        const categories = ['Groceries', 'Transport', 'Personal Care', 'Entertainment', 'Utilities', 'Other'];
        const amounts = categories.map(category =>
            expenses.filter(expense => expense.category === category)
                .reduce((total, expense) => total + parseFloat(expense.amount), 0)
        );

        const chart = new Chart(expenseChart, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Total Expenses by Category',
                    data: amounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Total Expenses by Category'
                    }
                }
            }
        });
    }
});
