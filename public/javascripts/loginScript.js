jQuery(document).ready(function ($) {
    console.log("Document Ready");
    $("#createAccount input").change(function () {

        $("input[name='username'], input[name='portfolioURL']").val(function () {
            return $(this).val().toLowerCase().replace(/ /g, "");
        });

        var formUsername = $("input[name='username']").val().toLowerCase();

        if ($("input[name='portfolioURL']").val() == "") {
            $("input[name='portfolioURL']").val(formUsername.replace(/ /g, ""));
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
        var allRequiredFieldsSupplied = true;

        var username = $(this).find("input[name='username']").val().toLowerCase();
        var portfolioURL = $(this).find("input[name='portfolioURL']").val().toLowerCase();

        // Checking all input fields within this form, to ensure that none are left empty.
        // Excluding the submit input from this search, as this cannot take a user defined
        // value.
        $(this).find("input").not("[type='submit']").each(function (index, element) {
            if ($(element).val() == "") {
                allRequiredFieldsSupplied = false;
                $(element).addClass("formWarning");
            } else {
                $(element).removeClass("formWarning");
            }
        });

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
});