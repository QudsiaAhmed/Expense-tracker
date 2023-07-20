// Database ka refrence
var database = firebase.database();

var signupForm = document.getElementById('signup-form');

// Add a submit event listener to the form
signupForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form default

    // User ki input values get horhi hy
    var name = signupForm.name.value;
    var email = signupForm.email.value;
    var password = signupForm.password.value;

    // Email already database mai exist krt hy
    database.ref('users')
        .orderByChild('email')
        .equalTo(email)
        .once('value')
        .then(function (check) {
            var users = check.val();
            if (users) {
                // email exist krti tou alert
                alert('Email already exists in the database. Please try another one.');
            } else {
                // Generate a unique user ID
                var userId = database.ref('users').push().key;
                // new user obj bnado with values
                var user = {
                    userId: userId,
                    name: name,
                    email: email,
                    password: password
                };

                // user ka data firebase kai database mai save karwadoo
                database.ref('users').push(user)
                    //then() method ke andar aapne success case ko handle kiya hai. Yahan par success message 
                    //"User data saved in database." console par print kiya ja raha hai.
                    .then(function () {
                        //  saved successfully
                        console.log('User data saved in  database.');
                        // Redirect the user to the sign-in page
                        window.location.href = 'SignIn.html';
                    })
                    .catch(function (error) {
                        // An error occurred
                        console.error('Error saving user data:', error);
                    });
            }
        })

});
