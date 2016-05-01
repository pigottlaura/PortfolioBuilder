jQuery(document).ready(function ($) {
    console.log("Login script loaded");

    // Creating an array that stores all of the cookies of the session as seperate 
    // elements. Using .replace() to remove all spaces from this string of data, and 
    // the .split() method to set the points at which the string of cookies needs 
    // to be seperated i.e. after each ;
    var allCookies = document.cookie.replace(/ /g, "").split(";");

    // Looping through the array of cookie name value pairs
    for (var i = 0; i < allCookies.length; i++) {
        var cookieValue = allCookies[i].split("=")[1];

        if (allCookies[i].indexOf("#createOrLoginAccount") == 0) {
            console.log("changing index of create/login to " + cookieValue);
            $("#createOrLoginAccount").tabs("option", "active", cookieValue);
        }
    }

    $("#createAccount").find("input[name='username'], input[name='portfolioURL']").change(function () {

        $("input[name='username'], input[name='portfolioURL']").val(function () {
            return $(this).val().toLowerCase().replace(/ /g, "");
        });

        var formUsername = $("input[name='username']").val().toLowerCase();

        if ($("input[name='portfolioURL']").val() == "") {
            $("input[name='portfolioURL']").val(formUsername.replace(/ /g, "")).removeClass("formWarning");
        }

        var formPortfolioUrl = $("input[name='portfolioURL']").val().toLowerCase();

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

    $("#createAccount").submit(function (event) {
        // Creating a boolean which will be used to determine if this form should be allowed to 
        // submit or not. This will only be set to true if all required form fields have a value
        // supplied in them, and the password/confirmPassword field's values match
        var allowSubmit = false;

        var allRequiredFieldsSupplied = checkAllFieldsSupplied(this);

        var username = $(this).find("input[name='username']").val().toLowerCase();
        var portfolioURL = $(this).find("input[name='portfolioURL']").val().toLowerCase();

        if (allRequiredFieldsSupplied) {
            console.log("All fields supplied");
            if ($(this).find("input[name='password']").val() == $(this).find("input[name='confirmPassword']").val()) {
                console.log("passwords match");
                allowSubmit = true;
            } else {
                console.log("passwords don't match");
            }
        } else {
            console.log("missing fields");
        }

        console.log("about to return from function");
        return allowSubmit;
    });

    $("#loginAccount").submit(function (event) {
        // Creating a boolean which will be used to determine if this form should be allowed to 
        // submit or not. This will only be set to true if all required form fields have a value
        // supplied in them, and the password/confirmPassword field's values match
        var allowSubmit = false;

        var allRequiredFieldsSupplied = checkAllFieldsSupplied(this);

        var username = $(this).find("input[name='loginUsername']").val().toLowerCase();

        if (allRequiredFieldsSupplied) {
            console.log("All fields supplied");
            allowSubmit = true;
        } else {
            console.log("missing fields");
        }

        console.log("about to return from function");
        return allowSubmit;
    });

    $("form input").not("[type='submit']").keyup(function (event) {
        if ($(this).val().length > 0) {
            $(this).removeClass("formWarning");
        }
    });
});

function checkAllFieldsSupplied(form) {
    var allRequiredFieldsSupplied = true;

    console.log("About to check this form - " + $(form).attr("id"));

    // Checking all input fields within this form, to ensure that none are left empty.
    // Excluding the submit input from this search, as this cannot take a user defined
    // value.
    $(form).find("input").not("[type='submit']").each(function (index, element) {
        if ($(element).val() == "") {
            allRequiredFieldsSupplied = false;
            $(element).addClass("formWarning");
        } else {
            $(element).removeClass("formWarning");
        }
    });

    console.log("allRequiredFieldsSupplied = " + allRequiredFieldsSupplied);
    return allRequiredFieldsSupplied;
}