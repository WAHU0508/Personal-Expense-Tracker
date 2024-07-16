document.addEventListener('DOMContentLoaded', () => {
    const addExpensBtn = document.getElementById('expenseBtn')
    const addExpensesSection = document.getElementById('addExpensesSection')
    const addExpenseForm = document.getElementById('addExpenseForm')
    const viewExpensesSection = document.getElementById('viewExpensesSection')
    const expensesList = document.getElementById('expensesList')
    const deleteButton = document.getElementById('deleteButton')
    const sortButton = document.querySelector('#sortButton');
    const sortOptions = document.querySelectorAll('#sortButton + .dropdown-menu a');

    displayCurrentdate();
    editUserName();
    fetchExpenses();
    addExpenseForm.addEventListener('submit', handleSubmit)
    deleteButton.addEventListener('click', deleteSelectedExpenses);
    sortOptions.forEach(option => {
        option.addEventListener('click', (e) => sortExpenses(e.target.dataset.sort));
    });

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
        table.innerHTML = ' '
        this.expenses.forEach(expense => {displayExpenseItem(expense)})
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
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
        categorySelect.selectedIndex = 0;

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
        const thead = document.createElement('thead')
        thead.innerHTML = `
             <tr>
                <th></th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
            </tr>
        `
        table.appendChild(thead)

        const tbody = document.createElement('tbody')
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
        tableBody.appendChild(categoryCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = expense.description;
        tableBody.appendChild(descriptionCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = expense.amount;
        tableBody.appendChild(amountCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = expense.date;
        tableBody.appendChild(dateCell);

        tbody.appendChild(tableBody)
        table.appendChild(tbody)
        
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

    function editUserName() {
        //get username element
        const userName = document.getElementById('userName')
        //check if there is a stored name in local storage
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            //if there is a stored name display it
            userName.textContent = storedName;
        }
        //add a double click event listener to edit the name
        userName.addEventListener('dblclick', (e) => {
            //create an input element
            const editName = document.createElement('input')
            editName.type = 'text'
            editName.value = userName.textContent;
            userName.replaceWith(editName)
            // Add a keypress event listener to the input element
            editName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newval = editName.value;
                    if (newval) {
                        editName.replaceWith(newval)
                        localStorage.setItem('userName', newval);
                    }
                    else {
                        editName.replaceWith(userName);
                    }
                }
            })
        })
    }
})