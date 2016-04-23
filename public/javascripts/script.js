jQuery(document).ready(function ($) {
    console.log("Document ready");
    $(".tabs").tabs();
    resizeFigures();
    $(window).resize(function(){
        resizeFigures();
    });
    $("#currentPortfolioURL").click(function (event) {
        // Determining which button was clicked on, based on the text of the element
        // which was clicked on
        if ($(event.target).text() == "Edit") {
            // The user wants to edit their current portfolioURL
            
            // Hiding the current link to the user's portfolio
            $(this).find("a").hide();
            
            // Setting the value of the form input to be equal to the current value of the
            // users portfolioURL. Then displaying this input (so the user can edit this value)
            $(this).find("form input").val($(this).find("a").text()).show();
            
            // Changing the text of the element that was clicked on to be undo (i.e. reusing the
            // same button for undo and edit, as they do not carry any additional information
            // other than letting us know what was clicked on)
            $(event.target).text("Undo");
            
            // Locating the save button within this div, and displaying it
            $(this).find(".save").show();
            
        } else if ($(event.target).text() == "Undo") {
            // The user wants to disgard the changes they just made to their portfolioURL
            
            // Clearing the value of the form input, and then hiding it, so that he user's changes
            // will be disgarded
            $(this).find("form input").val("").hide();
            
            // Changing the text of the element that was clicked on to be edit (i.e. reusing the
            // same button for undo and edit, as they do not carry any additional information
            // other than letting us know what was clicked on)
            $(event.target).text("Edit");
            
            // Displayign the current link to the user's portfolio
            $(this).find("a").show();
                            
            // Locating the save button within this div, and hiding it
            $(this).find(".save").hide();
            
        } else if ($(event.target).text() == "Save") {
            
            // Calling the asynchronous checkCredentialsAvailable() method, passing it in the 
            checkCredentialsAvailable(null, $(this).find("form input").val(), function(responseData){
                if(responseData.portfolioURLAvailable){
                    $("#currentPortfolioURL form").submit();
                    $("#currentPortfolioURL a").text(responseData.portfolioURL);
                }
            }); 
        }
    });

    $("#createAccount input").change(function () {

        $("input[name='username'], input[name='portfolioURL']").val(function () {
            return $(this).val().toLowerCase().replace(/ /g, "");
        });

        var formUsername = $("input[name='username']").val().toLowerCase();
        var formPortfolioUrl = $("input[name='portfolioURL']").val().toLowerCase();

        if ($("input[name='portfolioURL']").val() == "") {
            $("input[name='portfolioURL']").val(formUsername.replace(/ /g, ""));
        }

        checkCredentialsAvailable(formUsername, formPortfolioUrl, function (responseData) {
            if (responseData.usernameAvailable) {
                $("#usernameStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
            } else {
                console.log("Username not available");
                $("#usernameStatusIcon").attr("class", "glyphicon glyphicon-ban-circle");
            }

            if (responseData.portfolioURLAvailable) {
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

    $("#changePortfolioURL").click(function () {
        console.log("click");
    });

    // Creating an asynchronous function to check if the credentials a user has supplied are available.
    // Takes in three parametres. The requested username, requested url, and the callback function to which
    // the response data should be returned when a response is received from the server
    function checkCredentialsAvailable(username, url, cb) {
        $.post("/checkCredentialsAvailable", { requestedUsername: username, requestedPortfolioURL: url }, function (responseData) {

            // Passing the response data back to the callback function
            cb(responseData);
        }, "json");
    }
});

function resizeFigures(){
    var maxFigHeight = 0;
    $('figure').each(function() {
        maxFigHeight = maxFigHeight > $(this).height() ? maxFigHeight : $(this).height();
    });
    $(".swfContainer").css("height", $("figure img").height());
    $("figure").css("height", maxFigHeight);
}
