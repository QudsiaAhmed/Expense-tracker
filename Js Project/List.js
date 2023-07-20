// Get a reference to the database
var database = firebase.database();

// Default Categories
var defaultCategories = ['Food', 'Groceries', 'Petrol', 'Bills'];

// Function to create default categories for the user
function createDefaultCategories(userId) {
  var userCategoriesRef = database.ref('categories').child(userId);

  defaultCategories.forEach(function (category) {
    userCategoriesRef.push({ name: category })
      .then(function () {
        console.log('Default category saved for the user.');
      })
      .catch(function (error) {
        console.error('Error saving category:', error);
      });
  });
}

// Function to check if a category exists for the user
function checkCategoryExists(userId, category) {
  return new Promise(function (resolve, reject) {
    var userCategoriesRef = database.ref('categories').child(userId);

    userCategoriesRef.orderByChild('name').equalTo(category).once('value', function (data) {
      if (data.exists()) {
        resolve(true); // Category exists
      } else {
        resolve(false); // Category does not exist
      }
    });
  });
}


// Function to add a new category for the user
function addCategory(userId, category) {
  checkCategoryExists(userId, category).then(function (categoryExists) {
    if (categoryExists) {
      alert('Category already exists.');
      closeAddCategoryPopup(); // Close the popup
    } else {
      var userCategoriesRef = database.ref('categories').child(userId);
      userCategoriesRef.push({ name: category })
        .then(function () {
          console.log('Category added for the user.');
          fetchUserCategories(userId); // Refresh categories after adding a new one
          closeAddCategoryPopup(); // Close the popup
        })
        .catch(function (error) {
          console.error('Error adding category:', error);
        });
    }
  });
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

        // Skip empty or undefined categories
        if (categoryName && categoryName.trim() !== '') {
          var li = document.createElement('li');
          li.textContent = categoryName;
          li.addEventListener('click', function () {
            // Remove outline from previously selected category
            var previousSelection = categoriesList.querySelector('.selected');
            if (previousSelection) {
              previousSelection.classList.remove('selected');
            }

            // Add outline to the selected category
            li.classList.add('selected');

            // Set the selected category as the value for the input field
            var categoryInput = document.getElementById('category-input');
            categoryInput.value = categoryName;
          });
          categoriesList.appendChild(li);
        }
      });
    }

    // Display default categories only if no user categories are present
    if (!categories) {
      defaultCategories.forEach(function (category) {
        var li = document.createElement('li');
        li.textContent = category;
        li.addEventListener('click', function () {
          // Remove outline from previously selected category
          var previousSelection = categoriesList.querySelector('.selected');
          if (previousSelection) {
            previousSelection.classList.remove('selected');
          }

          // Add outline to the selected category
          li.classList.add('selected');

          // Set the selected category as the value for the input field
          var categoryInput = document.getElementById('category-input');
          categoryInput.value = category;
        });
        categoriesList.appendChild(li);
      });
    }

    // Check if there's a selected category and add outline
    var selectedCategory = categoriesList.querySelector('.selected');
    if (selectedCategory) {
      selectedCategory.classList.add('selected');
    }
  });
}


// Function to handle the form submission for adding a category
function handleAddCategoryForm(event) {
  event.preventDefault();

  var currentUser = JSON.parse(localStorage.getItem('currentUser'));
  var userId = currentUser.userId;
  var categoryInput = document.getElementById('category-input');
  var category = categoryInput.value.trim();

  if (category !== '') {
    addCategory(userId, category);
    categoryInput.value = '';

    // Remove outline from previously selected category
    var previousSelection = document.querySelector('#categoriesList li.selected');
    if (previousSelection) {
      previousSelection.classList.remove('selected');
    }

    // Add outline to the selected category
    var selectedCategory = document.querySelector(`#categoriesList li:contains('${category}')`);
    if (selectedCategory) {
      selectedCategory.classList.add('selected');
    }
  } else {
    alert('Please enter a category.');
  }
}

// Get the currently signed-in user
var currentUser = JSON.parse(localStorage.getItem('currentUser'));
var userId = currentUser.userId;

// Check if the user has default categories already
var userCategoriesRef = database.ref('categories').child(userId);
userCategoriesRef.once('value', function (data) {
  var categories = data.val();

  if (!categories) {
    // Create default categories if the user doesn't have any
    createDefaultCategories(userId);
  }

  // Fetch and display user categories
  fetchUserCategories(userId);
});
 

// Add event listener to the form for adding a category
var addCategoryForm = document.getElementById('add-category-form');
addCategoryForm.addEventListener('submit', handleAddCategoryForm);

// Function to show the add category popup
function showAddCategoryPopup() {
  var popup = document.getElementById('add-category-popup');
  popup.style.display = 'block';
}

// Function to close the add category popup
function closeAddCategoryPopup() {
  var popup = document.getElementById('add-category-popup');
  popup.style.display = 'none';
}

// Add event listeners
document.getElementById('add-category-btn').addEventListener('click', showAddCategoryPopup);
document.querySelector('.close-btn').addEventListener('click', closeAddCategoryPopup);
document.getElementById('add-category-form').addEventListener('submit', handleAddCategoryForm);
