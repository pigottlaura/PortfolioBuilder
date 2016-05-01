jQuery(document).ready(function ($) {
    console.log("Login script loaded");

    // Everytime the username or password field of the create account form are changed, sending AJAX requests
    // to the server to see if these credentials are available
    $("#createAccount").find("input[name='username'], input[name='portfolioURL']").change(function () {

        // Altering the value of these two inputs, to ensure they contain no spaces (replacing them 
        // globally) and are in lower case
        $("input[name='username'], input[name='portfolioURL']").val(function () {
            return $(this).val().toLowerCase().replace(/ /g, "");
        });

        // Getting the value of the form username
        var formUsername = $("input[name='username']").val().toLowerCase();

        // Checking if the portfolio URL is currently empty
        if ($("input[name='portfolioURL']").val() == "") {

            // Defaulting the portfolio URL to be equal to the user's username. Whether or not this url
            // is available or not will be checked following this
            $("input[name='portfolioURL']").val(formUsername.replace(/ /g, "")).removeClass("formWarning");
        }

        // Getting the portfolio URL after the above check, as it may have changed
        var formPortfolioUrl = $("input[name='portfolioURL']").val().toLowerCase();

        // Calling the check credentials available function from the main script file, to sending
        // an AJAX request to the server, and update the glyphicons beside each of the form inputs 
        // accordinly i.e. to show if they are available or not
        checkCredentialsAvailable(formUsername, formPortfolioUrl, function (responseData) {
            if (responseData.usernameAvailable) {
                console.log("Username available");
                $("#usernameStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
            } else {
                console.log("Username not available");
                $("#usernameStatusIcon").attr("class", "glyphicon glyphicon-ban-circle");
            }

            if (responseData.portfolioURLAvailable) {
                console.log("Portfolio URL available");
                $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
            } else {
                console.log("Portfolio URL not available");
                $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ban-circle");
            }
        });
    });

    // Validating the create account form before it can be submitted to the server
    $("#createAccount").submit(function (event) {

        // Creating a boolean which will be used to determine if this form should be allowed to 
        // submit or not. This will only be set to true if all required form fields have a value
        // supplied in them, and the password/confirmPassword field's values match
        var allowSubmit = false;

        // Passing this form into the checkAllFieldsSupplied method declared below. This will return
        // a boolean value
        var allRequiredFieldsSupplied = checkAllFieldsSupplied(this);

        // Getting the form username and portfolio url
        var username = $(this).find("input[name='username']").val().toLowerCase();
        var portfolioURL = $(this).find("input[name='portfolioURL']").val().toLowerCase();

        // If all fields required were supplied (as defined above)
        if (allRequiredFieldsSupplied) {
            console.log("All fields supplied");

            // Checking that the password and confirm password fields match. Also checking this server side
            if ($(this).find("input[name='password']").val() == $(this).find("input[name='confirmPassword']").val()) {
                console.log("passwords match");

                // This form is allowed to submit
                allowSubmit = true;
            } else {
                console.log("passwords don't match");
            }
        } else {
            console.log("missing fields");
        }

        console.log("about to return from function");

        // Returning the value of allowSubmit to the function. If false, the form will not be sent to the server
        return allowSubmit;
    });

    // VA
    $("#loginAccount").submit(function (event) {
        // Creating a boolean which will be used to determine if this form should be allowed to 
        // submit or not. This will only be set to true if all required form fields have a value
        // supplied in them, and the password/confirmPassword field's values match
        var allowSubmit = false;

        // Passing this form into the checkAllFieldsSupplied method declared below. This will return
        // a boolean value
        var allRequiredFieldsSupplied = checkAllFieldsSupplied(this);
        
        // Getting the form username
        var username = $(this).find("input[name='loginUsername']").val().toLowerCase();

        // If all fields required were supplied (as defined above)
        if (allRequiredFieldsSupplied) {
            console.log("All fields supplied");
            allowSubmit = true;
        } else {
            console.log("missing fields");
        }

        console.log("about to return from function");
        
        // Returning the value of allowSubmit to the function. If false, the form will not be sent to the server
        return allowSubmit;
    });
    
    // Removing warnings from form inputs (if they exist) when the user types into them
    $("form input").not("[type='submit']").keyup(function (event) {
        
        // As long as the new lenght of the input value is greater than 0
        if ($(this).val().length > 0) {
            $(this).removeClass("formWarning");
        }
    });
});

// Used by multiple forms to check if all their fields have been supplied. Accepts one argument, 
// which references the form it is about to check
function checkAllFieldsSupplied(form) {
    
    // Defaulting all fields supplied to true, until proven otherwise below
    var allRequiredFieldsSupplied = true;

    console.log("About to check this form - " + $(form).attr("id"));

    // Checking all input fields within this form, to ensure that none are left empty.
    // Excluding the submit input from this search, as this cannot take a user defined
    // value.
    $(form).find("input").not("[type='submit']").each(function (index, element) {
        
        // If this input value is empty
        if ($(element).val() == "") {
            
            // All required fields is now false
            allRequiredFieldsSupplied = false;
            
            // Adding a warning class to any fields that are empty
            $(element).addClass("formWarning");
        } else {
            
            // This input has a value. Removing the form warnin class (if it exists on the element)
            $(element).removeClass("formWarning");
        }
    });

    console.log("allRequiredFieldsSupplied = " + allRequiredFieldsSupplied);
    
    // Returning the boolean value which represents whether or not all form fields contained a value
    return allRequiredFieldsSupplied;
}