document.addEventListener('DOMContentLoaded', () => {
    const addExpensBtn = document.getElementById('expenseBtn')
    const addExpensesSection = document.getElementById('addExpensesSection')
    const addExpenseForm = document.getElementById('addExpenseForm')
    const viewExpensesSection = document.getElementById('viewExpensesSection')
    const expensesList = document.getElementById('expensesList')
    const deleteButton = document.getElementById('deleteButton')
    const sortButton = document.querySelector('#sortButton');
    const sortOptions = document.querySelectorAll('#sortButton + .dropdown-menu a');



    fetchExpenses();
    displayCurrentdate();
    addExpenseForm.addEventListener('submit', handleSubmit)
    deleteButton.addEventListener('click', deleteSelectedExpenses);
    sortOptions.forEach(option => {
        option.addEventListener('click', (e) => sortExpenses(e.target.dataset.sort));
    });
    summary()
    let selectedExpenses = []
    let expenses = []
    function fetchExpenses() {
        fetch('http://localhost:3000/expenses')
            .then(res => res.json())
            .then(expenses => {
                this.expenses = expenses; // Store the fetched data in a variable
                displayExpenses();
            })
            .catch(error => console.error(`Fetching Error: ${error}`))
    }

    function totalExpenditure(category = null) {
        return new Promise((resolve, reject) => {
            fetch('http://localhost:3000/expenses')
                .then(res => res.json())
                .then(expenses => {
                    let filteredExpenses = expenses;
                    if (category !== null) {
                        filteredExpenses = expenses.filter(expense => expense.category === category);
                    }

                    const totalExpenses = filteredExpenses.reduce((total, expense) => {
                        return total + parseFloat(expense.amount);
                    }, 0);

                    resolve(totalExpenses);
                })
                .catch(error => {
                    console.error(`Error getting total:`, error);
                    reject(error);
                });
        });
    }

    function summary() {
        totalExpenditure().then(total => {
            const currentExpense = document.getElementById('currentExpense');
            currentExpense.textContent = `Total expense: $${total.toFixed(2)}`;

            const totalSum = document.getElementById('totalSum');
            totalSum.textContent = `Total expense: $${total.toFixed(2)}`;

            totalExpenditure('Groceries').then(groceriesTotal => {
                const groceries = document.getElementById('groceries');
                groceries.textContent = `Total Groceries: $${groceriesTotal.toFixed(2)}`;
            });
            totalExpenditure('Transport').then(transportTotal => {
                const transport = document.getElementById('transport');
                transport.textContent = `Total Transport: $${transportTotal.toFixed(2)}`;
            });
            totalExpenditure('Personal Care').then(personalCareTotal => {
                const personalCare = document.getElementById('personal-care');
                personalCare.textContent = `Total Personal Care: $${personalCareTotal.toFixed(2)}`;
            });
            totalExpenditure('Entertainment').then(entertainmentTotal => {
                const entertainment = document.getElementById('entertainment');
                entertainment.textContent = `Total Entertainment: $${entertainmentTotal.toFixed(2)}`;
            });
            totalExpenditure('Utilities').then(utilitiesTotal => {
                const utilities = document.getElementById('utilities');
                utilities.textContent = `Total Utilities: $${utilitiesTotal.toFixed(2)}`;
            });
            totalExpenditure('Other').then(otherTotal => {
                const other = document.getElementById('other');
                other.textContent = `Total other: $${otherTotal.toFixed(2)}`;
            });
        });
    }
    
    function sortExpenses(sortOption) {
        switch (sortOption) {
            case 'dateN':
                this.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'dateO':
                this.expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'amountL':
                this.expenses.sort((a, b) => a.amount - b.amount);
                break;
            case 'amountH':
                this.expenses.sort((a, b) => b.amount - a.amount);
                break;
            case 'category':
                this.expenses.sort((a, b) => a.category.localeCompare(b.category));
                break;
        }
        displayExpenses();
    }

    function displayExpenses() {
        const table = document.querySelector('table');
        const tbody = table.querySelector('tbody')
        tbody.innerHTML = ' '
        this.expenses.forEach(expense => { displayExpenseItem(expense) })
    }

    function handleSubmit(event) {
        event.preventDefault();
        const categorySelect = document.getElementById('formSelect');
        const category = categorySelect.options[categorySelect.selectedIndex].text
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        const newExpense = {
            category,
            description,
            amount,
            date
        }
        postExpenses(newExpense)

        addExpenseForm.reset()

    }
    function postExpenses(newExpense) {
        fetch('http://localhost:3000/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(newExpense)
        })
            .then(res => res.json())
            .then(expense => displayExpenseItem(expense))
            .catch(error => console.error(`Posting Error: ${error}`))
    }

    function displayExpenseItem(expense) {
        const table = document.querySelector('table')
        const tbody = table.querySelector('tbody')
        const tableBody = document.createElement('tr')
        tableBody.dataset.id = expense.id

        const selectCell = document.createElement('td')
        const selectCheckbox = document.createElement('input')
        selectCheckbox.type = 'checkbox';
        selectCheckbox.addEventListener('change', (event) => {
            toggleExpenseSelection(expense.id, event.target.checked);
        });
        selectCell.appendChild(selectCheckbox);
        tableBody.appendChild(selectCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = expense.category;
        categoryCell.addEventListener('dblclick', editCCell)
        tableBody.appendChild(categoryCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = expense.description;
        descriptionCell.addEventListener('dblclick', editDCell)
        tableBody.appendChild(descriptionCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = expense.amount;
        amountCell.addEventListener('dblclick', editACell)
        tableBody.appendChild(amountCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = expense.date;
        dateCell.addEventListener('dblclick', editDateCell)
        tableBody.appendChild(dateCell);

        tbody.appendChild(tableBody)
        function editDCell() {
            const editItem = document.createElement('input')
            editItem.type = 'text'
            editItem.value = descriptionCell.textContent
            descriptionCell.replaceWith(editItem)

            editItem.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newval = editItem.value

                    if (newval) {
                        editItem.replaceWith(newval)

                        fetch(`http://localhost:3000/expenses/${expense.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({ description: newval })
                        })
                            .then(res => res.json())
                            .then(() => { descriptionCell.textContent = newval })
                    }
                    else {
                        editItem.replaceWith(descriptionCell)

                    }
                }
            })
        }
        function editACell() {
            const editItem = document.createElement('input')
            editItem.type = 'number'
            editItem.value = amountCell.textContent
            amountCell.replaceWith(editItem)
            editItem.classList.add('td')

            editItem.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newval = editItem.value

                    if (newval) {
                        editItem.replaceWith(newval)
                        fetch(`http://localhost:3000/expenses/${expense.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({ amount: newval })
                        })
                            .then(res => res.json())
                            .then(() => { amountCell.textContent = newval })
                    }
                    else {
                        editItem.replaceWith(amountCell)
                    }
                }
            })
        }
        function editCCell() {
            const editItem = document.createElement('select');
            editItem.innerHTML = `
                <option selected>Select Expense Category</option>
                <option value="1">Groceries</option>
                <option value="2">Transport</option>
                <option value="3">Personal Care</option>
                <option value="4">Entertainment</option>
                <option value="5">Utilities</option>
                <option value="6">Other</option>
            `;
            editItem.className = 'form-select';
            editItem.id = 'formSelect';
            editItem.ariaLabel = 'Default select example';
            editItem.value = categoryCell.textContent;
            categoryCell.replaceWith(editItem);

            editItem.addEventListener('change', () => {
                const newval = editItem.options[editItem.selectedIndex].text;

                if (newval) {
                    const newCategoryCell = document.createElement('div');
                    newCategoryCell.textContent = newval;
                    editItem.replaceWith(newCategoryCell);

                    fetch(`http://localhost:3000/expenses/${expense.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({ category: newval }),
                    })
                        .then((res) => res.json())
                        .then(() => {
                            categoryCell.textContent = newval;
                        });
                }
            });
        }
        function editDateCell() {
            const editItem = document.createElement('input')
            editItem.type = 'date'
            editItem.value = dateCell.textContent
            dateCell.replaceWith(editItem)

            editItem.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newval = editItem.value

                    if (newval) {
                        editItem.replaceWith(newval)
                        fetch(`http://localhost:3000/expenses/${expense.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({ date: newval })
                        })
                            .then(res => res.json())
                            .then(() => { dateCell.textContent = newval })
                    }
                    else {
                        editItem.replaceWith(dateCell)
                    }
                }
            })
        }
    }

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

    function deleteSelectedExpenses() {
        selectedExpenses.forEach(expenseId => {
            const row = table.querySelector(`tr[data-id="${expenseId}"]`);
            deleteExpense(expenseId, row);
        });
        selectedExpenses = [];
        deleteButton.disabled = true;
    }

    function deleteExpense(expenseId, row) {
        try {
            fetch(`http://localhost:3000/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
                .then(res => res.json())
                .then(() => {
                    row.remove();
                })
                .catch(error => {
                    console.error(`Deleting Error: ${error}`);
                    alert('Error deleting expense. Please try again later.');
                });
        } catch (error) {
            console.error(`Error occurred: ${error}`);
            alert('An error occurred. Please try again later.');
        }
    }

    function displayCurrentdate() {
        const currentDate = document.getElementById('currentDate')
        //Creating the date object
        const date = new Date();
        //Format the date
        const formattedDate = new Intl.DateTimeFormat('en-US').format(date)
        //Display current date in the page
        currentDate.textContent = `Date: ${formattedDate}`
    }

})