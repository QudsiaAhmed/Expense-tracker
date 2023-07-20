// Get a reference to the database
var database = firebase.database();

// Get a reference to the signin form
var signinForm = document.getElementById('signin-form');

// Add a submit event listener to the form
signinForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    // Get the user's input values
    var email = signinForm.email.value;
    var password = signinForm.password.value;

    // Query the Firebase database to check if the user exists
    database.ref('users')
        .orderByChild('email')
        .equalTo(email)
        .once('value')
        .then(function (value) {
            var users = value.val();
            if (users) {
                // User exists
                var user = Object.values(users)[0]; // Assuming there's only one user with the given email
                if (user.password === password) {
                    // Correct password, redirect to the main page
                    window.location.href = 'index.html';

                    localStorage.setItem('currentUser', JSON.stringify(user));

                    // Display user name from local storage
                    var currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    var usernameFromLocalStorage = currentUser.username;
                    console.log('User name from local storage:', usernameFromLocalStorage);

                } else {
                    // Incorrect password, display an alert
                    alert('Invalid password. Please try again.');
                }
            } else {
                // User does not exist, display an alert
                alert('User does not exist. Please sign up.');
            }
        })
        .catch(function (error) {
            // An error occurred
            console.error('Error checking user existence:', error);
        });
});

console.log('Signed-up user name from local storage:', JSON.parse(localStorage.getItem('currentUser'))?.username);
