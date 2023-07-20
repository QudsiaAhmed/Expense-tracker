// Function to update the user account balance
function updateAccountBalance(accountName, amount, type, userId) {
  var accountsRef = database.ref('accounts').child(userId);
  return accountsRef.once('value')
    .then(function (data) {
      var accounts = data.val();
      if (accounts) {
        var accountToUpdate = Object.values(accounts).find((account) => account.name === accountName);
        if (accountToUpdate) {
          if (type === 'expense' && accountToUpdate.amount < amount) {
            return Promise.resolve(false); // Not enough money in the account
          } else {
            accountToUpdate.amount = type === 'expense' ? accountToUpdate.amount - amount : accountToUpdate.amount + amount;
            return accountsRef.child(accountToUpdate.id).update({ amount: accountToUpdate.amount })
              .then(function () {
                console.log('Account balance updated:', accountToUpdate);
                return Promise.resolve(true); // Account balance updated successfully
              })
              .catch(function (error) {
                console.error('Error updating account balance:', error);
                return Promise.reject(new Error('Error updating account balance.'));
              });
          }
        } else {
          return Promise.resolve(false); // Account not found
        }
      } else {
        return Promise.resolve(false); // No accounts found
      }
    })
    .catch(function (error) {
      console.error('Error fetching user accounts:', error);
      return Promise.reject(new Error('Error fetching user accounts.'));
    });
}

// Function to save the transaction in the database
function saveTransaction(transaction, userId) {
  var transactionsRef = database.ref('transactions');
  transaction.userId = userId; // Update the user ID
  return transactionsRef.push(transaction)
    .then(function () {
      console.log('Transaction added and saved in the database.');
      return Promise.resolve();
    })
    .catch(function (error) {
      console.error('Error adding transaction:', error);
      return Promise.reject(new Error('Error adding transaction.'));
    });
}

// Function to handle the add transaction form submission
function handleAddTransactionForm(event) {
  event.preventDefault();

  var amountInput = document.querySelector('.input-field input');
  var amount = parseFloat(amountInput.value);
  var selectedAccount = document.querySelector('.dropdown-header');
  var selectedCategory = document.querySelector('#categoriesList li.active');
  var selectedType = document.querySelector('.income-expense-btns button.active');

  if (isNaN(amount)) {
    alert('Please enter a valid amount.');
    return;
  }

  const transaction = {
    amount,
    //? is used to check if selectedType or selectedType.dataset is not null or undefined. 
    //If it is, an empty string '' is assigned to selectedType.dataset.type. Otherwise, the value of
    // selectedType.dataset.type is assigned to selectedType.dataset.type.
    type: selectedType ? selectedType.dataset.type : '',
    category: selectedCategory ? selectedCategory.textContent.trim() : '',
    account: selectedAccount ? selectedAccount.textContent.replace('Paying from', '').trim() : '',
    userId: getUserId(), // Get the user ID
    date: formatDate(new Date()),
  };

  // Update the user account balance
  updateAccountBalance(transaction.account, transaction.amount, transaction.type, transaction.userId)
    .then(function (success) {
      if (success) {
        // Save the transaction in the database
        return saveTransaction(transaction, transaction.userId);
      } else {
        alert('Not enough money in the account. Transaction canceled.');
        return Promise.reject(console.log('Not enough money in the account.'));
      }
    })
    .then(function () {
      // Refresh the account list and transaction history
      fetchUserAccounts(transaction.userId);
      fetchTransactionHistory(transaction.userId);

      amountInput.value = '';
      selectedAccount.textContent = 'Paying from bank';
      selectedCategory = null;
      selectedType = null;

    })
    .catch(function (error) {
      console.error('Error handling add transaction form:', error);

    });
}

// Function to retrieve the user ID from your authentication system
function getUserId() {
  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  return currentUser.userId;
}

// Function to format a date as "YYYY-MM-DD"
//slice() method is a built-in JavaScript method that allows you to extract a portion of an array or a string and
// returns a new array or string containing the extracted elements
function formatDate(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

// Function to fetch user categories and display them
function fetchUserCategories(userId) {
  var userCategoriesRef = database.ref('categories').child(userId);
  var categoriesList = document.getElementById('categoriesList');
  categoriesList.innerHTML = '';

  userCategoriesRef.once('value', function (data) {
    var categories = data.val();
    if (categories) {
      Object.values(categories).forEach(function (categoryData) {
        var categoryName = categoryData.name;
        if (categoryName && categoryName.trim() !== '') {
          var li = document.createElement('li');
          li.textContent = categoryName;
          li.addEventListener('click', function () {
            var categoryListItems = document.querySelectorAll('#categoriesList li');
            categoryListItems.forEach(function (item) {
              item.classList.remove('active');
            });
            li.classList.add('active');
          });
          categoriesList.appendChild(li);
        }
      });
    }
  });
}

// Function to fetch and display transaction history for the currently signed-in user
function fetchTransactionHistory(userId) {
  var transactionTableBody = document.getElementById('transaction-table-body');
  transactionTableBody.innerHTML = '';
  var transactionsRef = database.ref('transactions');

  transactionsRef.orderByChild('userId').equalTo(userId).on('child_added', function (data) {
    var transaction = data.val();
    var row = document.createElement('tr');
    var categoryCell = document.createElement('td');
    var accountCell = document.createElement('td');
    var dateCell = document.createElement('td');
    var amountCell = document.createElement('td');

    categoryCell.textContent = transaction.category;
    accountCell.textContent = transaction.account;
    dateCell.textContent = transaction.date;

    amountCell.textContent = transaction.amount.toFixed(2);
    if (transaction.type === 'expense') {
      amountCell.classList.add('amount', 'expense');
    } else {
      amountCell.classList.add('amount', 'income');
    }

    row.appendChild(categoryCell);
    row.appendChild(accountCell);
    row.appendChild(dateCell);
    row.appendChild(amountCell);

    transactionTableBody.appendChild(row);
  });
}

// Function to fetch user accounts and display them
function fetchUserAccounts(userId) {
  var accountsRef = database.ref('accounts').child(userId);

  accountsRef.once('value', function (data) {
    var accounts = data.val() || {};
    var tableBody = document.querySelector('#account-table tbody');
    tableBody.innerHTML = '';
    var totalAmount = 0;

    Object.entries(accounts).forEach(function ([accountId, account]) {
      var accountName = account.name;
      var amount = account.amount;

      var row = createTableRow(accountName, amount, accountId);
      tableBody.appendChild(row);

      totalAmount += amount;
    });

    updateTotalAmount(totalAmount);
    updateDropdown(accounts, userId);
  });
}


// Get the currently signed-in user
var currentUser = JSON.parse(localStorage.getItem('currentUser'));
var userId = currentUser.userId;

// Fetch and display user categories
fetchUserCategories(userId);

// Fetch and display transaction history
fetchTransactionHistory(userId);

// Add event listener to the form for adding a transaction
var addTransactionForm = document.getElementById('transactionButton');
addTransactionForm.addEventListener('click', handleAddTransactionForm);

// Add click event listeners to the income and expense buttons
var incomeButton = document.querySelector('.income-btn');
var expenseButton = document.querySelector('.expense-btn');
incomeButton.addEventListener('click', function () {
  incomeButton.classList.add('active');
  expenseButton.classList.remove('active');
});
expenseButton.addEventListener('click', function () {
  expenseButton.classList.add('active');
  incomeButton.classList.remove('active');
});
