// Get a reference to the database
var database = firebase.database();

// Default accounts
var defaultAccounts = {
  cash: {
    id: 'cash',
    name: 'Cash',
    amount: 0
  },
  savings: {
    id: 'savings',
    name: 'Savings',
    amount: 0
  }
};

// Function to fetch user accounts and display them
function fetchUserAccounts(userId) {
  var accountsRef = database.ref('accounts').child(userId);
  // Once aik dafa hoga bus
  accountsRef.once('value', function (data) {
    // variable named accounts by assigning it the value of data.val() if it exists, otherwise assigning it an empty object {}.
    var accounts = data.val() || {};
    var tableBody = document.querySelector('#account-table tbody');
    tableBody.innerHTML = '';

    var totalAmount = 0;
    // returns an array of a given object's own  property [key, value] pairs
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

// Function to update the total amount in the HTML
function updateTotalAmount(totalAmount) {
  var totalAmountElement = document.getElementById('total-amount');
  totalAmountElement.textContent = totalAmount.toFixed(2);
}

// Function to create a table row
function createTableRow(accountName, amount, accountId) {
  var row = document.createElement('tr');
  var accountNameCell = document.createElement('td');
  var amountCell = document.createElement('td');
  var deleteButtonCell = document.createElement('td');

  accountNameCell.textContent = accountName;
  amountCell.textContent = amount;

  // Check if the account is not a default account before creating the delete button
  if (!defaultAccounts.hasOwnProperty(accountId)) {
    var deleteButton = createDeleteButton(accountId);
    deleteButtonCell.appendChild(deleteButton);
  }

  row.appendChild(accountNameCell);
  row.appendChild(amountCell);
  row.appendChild(deleteButtonCell);

  // Set the data-account-id attribute to the account ID 
  row.setAttribute('data-account-id', accountId);
  return row;
}

// Function to update the dropdown with user and default accounts
function updateDropdown(accounts, userId) {
  var dropdownContent = document.getElementById('account-dropdown');
  dropdownContent.innerHTML = '';

  var addedDefaultAccounts = {}; // Keep track of added default accounts

  // Loop through user accounts and create dropdown options
  Object.entries(accounts).forEach(function ([accountId, account]) {
    var accountName = account.name;
    var option = createDropdownOption(accountName);
    dropdownContent.appendChild(option);

    // Add the account name to the addedDefaultAccounts object
    addedDefaultAccounts[accountName.toLowerCase()] = true;
  });

  // Loop through default accounts and create dropdown options if not already added
  Object.entries(defaultAccounts).forEach(function ([accountId, account]) {
    var accountName = account.name;

    // Check if the default account is already added
    if (!addedDefaultAccounts.hasOwnProperty(accountName.toLowerCase())) {
      var option = createDropdownOption(accountName);
      dropdownContent.appendChild(option);

      // Save default account to the database if it doesn't exist
      database.ref('accounts').child(userId).child(accountId).set(account);
    }
  });
}

// Function to create a dropdown option
function createDropdownOption(accountName, accountId, amount) {
  var option = document.createElement('a');
  option.href = '#';
  option.textContent = accountName;
  option.addEventListener('click', function () {
    // Set the selected account in the dropdown as the value for the input field
    var inputField = document.querySelector('.input-field-container input');

    // Set the selected account as the dropdown header text
    var dropdownHeader = document.querySelector('.dropdown-header');
    dropdownHeader.textContent = 'Paying from ' + accountName;

    if (amount) {
      // Update the input field value with the selected account amount
      //toFixed() method rounds the string to a specified number of decimals
      inputField.value = amount.toFixed(2);
    }
  });
  return option;
}


// Function to show the create account popup
function showCreateAccountPopup() {
  var popup = document.getElementById('create-account-popup');
  popup.style.display = 'block';

  // Reset the form fields
  document.getElementById('account-name').value = '';
  document.getElementById('account-amount').value = '';
}

// Function to close the create account popup
function closeCreateAccountPopup() {
  var popup = document.getElementById('create-account-popup');
  popup.style.display = 'none';
}

// Function to handle account creation form submission
function handleCreateAccountForm(event) {
  event.preventDefault();

  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  var userId = currentUser.userId;
  var accountName = document.getElementById('account-name').value;
  var accountAmount = parseFloat(document.getElementById('account-amount').value);

  if (isNaN(accountAmount)) {
    alert('Invalid amount. Please enter a valid number.');
    return;
  }

  // Check if the account being created is a default account
  if (defaultAccounts.hasOwnProperty(accountName.toLowerCase())) {
    alert('Cannot create a default account.');
    return;
  }

  var accountsRef = database.ref('accounts').child(userId);
  accountsRef.once('value', function (data) {
    var accounts = data.val() || {};

    // Loop through existing accounts and check if the name already exists
    var accountExists = Object.values(accounts).some(function (account) {
      return account.name.toLowerCase() === accountName.toLowerCase();
    });

    if (accountExists) {
      alert('An account with the same name already exists.');
      setTimeout(function () {
        // Close the popup
        closeCreateAccountPopup();
      }, 1000);
    } else {
      var account = {
        name: accountName,
        amount: accountAmount
      };

      // Generate a new ID using push() for user-created accounts
      var newAccountRef = accountsRef.push();

      newAccountRef.set(account)
        .then(function () {
          console.log('Account created and saved in the database.');

          // Display success message
          alert('Account created and saved in the database.');

          // Close the popup
          closeCreateAccountPopup();

          // Refresh the account list
          fetchUserAccounts(userId);
        })
        .catch(function (error) {
          console.error('Error creating account:', error);
        });
    }
  });
}

// Function to delete an account
function deleteAccount(accountId) {
  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  var userId = currentUser.userId;

  // Check if the account is a default account
  if (defaultAccounts.hasOwnProperty(accountId)) {
    alert('Cannot delete a default account.');
    return;
  }

  var accountRef = database.ref('accounts').child(userId).child(accountId);
  accountRef.remove()
    .then(function () {
      console.log('Account deleted from the database.');

      // Refresh the account list
      fetchUserAccounts(userId);
    })
    .catch(function (error) {
      console.error('Error deleting account:', error);
    });
}

// Function to create the delete button for an account
function createDeleteButton(accountId) {
  var deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('delete-button');
  deleteButton.addEventListener('click', function () {
    deleteAccount(accountId);
  });
  return deleteButton;
}

// Get the currently signed-in user
var currentUser = JSON.parse(localStorage.getItem('currentUser'));
var userId = currentUser.userId;

// Call the `fetchUserAccounts` function with the user ID
fetchUserAccounts(userId);

// Assume the user has signed in or signed up successfully
var userId = 'your_user_id';

// Call the `fetchUserAccounts` function with the user ID
fetchUserAccounts(userId);
// Add event listeners
document.getElementById('create-account-btn').addEventListener('click', showCreateAccountPopup);
document.querySelector('.close-btn').addEventListener('click', closeCreateAccountPopup);
document.getElementById('create-account-form').addEventListener('submit', handleCreateAccountForm);
