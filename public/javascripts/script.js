jQuery(document).ready(function ($) {
    var originalPortfolioURL = $("#currentPortfolioURL").text();
    console.log("Document ready");
    $(".tabs").tabs();
    resizeFigures();
    $(window).resize(function () {
        $("figure").css("minHeight", "initial");
        resizeFigures();
    });
    $(".accordion").accordion();
    $("#sortable").sortable({
        cancel: "figcaption",
        stop: function (event, ui) {
            var mediaItemOrder = [];

            console.log("DROPPED");
            $.each($("figure"), function (index) {
                console.log($(this).find("figcaption").text() + " is at index " + index);
                mediaItemOrder.push({
                    mediaId: $(this).find("figcaption").siblings("button").attr("id"),
                    indexPosition: index
                });
            });
            console.log(mediaItemOrder);

            $.post("/admin/changeMediaOrder", { newOrder: JSON.stringify(mediaItemOrder) });
        }
    });
    //$( "#sortable" ).disableSelection();
    $("figcaption").blur(function (event) {
        var mediaItemId = $(event.target).siblings("button").attr("id");
        $.post("/admin/changeMediaTitle", { mediaId: mediaItemId, newTitle: $(event.target).text() });
    }).keypress(function (event) {
        console.log(event.which);
        if (event.which == 13) {
            event.preventDefault();
            $(event.target).blur();
        }
    });
    $(".deleteMedia").click(function (event) {
        $.post("/admin/deleteMedia", { mediaId: event.target.id }, function (responseData) {
            $(".row > div").find("button[id='" + responseData.mediaId + "']").parent().parent().remove();
        }, "json");
    });
    $("#editPortfolioURL").click(function (event) {

        $("#currentPortfolioURL")
            .prop("contenteditable", "true")
            .focus();

        $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");

        $(this).hide();
        $("#cancelPortfolioURL").show();
        $("#savePortfolioURL").show();

    });
    $("#cancelPortfolioURL").click(function (event) {

        $("#currentPortfolioURL")
            .removeAttr("contenteditable")
            .blur()
            .text(originalPortfolioURL);

        $("#portfolioURLStatusIcon").removeAttr("class");

        $(this).hide();
        $("#editPortfolioURL").show();
        $("#savePortfolioURL").hide();
    });
    $("#savePortfolioURL").click(function (event) {
        if ($("#currentPortfolioURL").text() != originalPortfolioURL) {
            var requestedURL = $("#currentPortfolioURL").text().toLowerCase();
            checkCredentialsAvailable(null, requestedURL, function (responseData) {
                if (responseData.portfolioURLAvailable) {
                    $.post("/admin/changePortfolioURL", { newPortfolioURL: $("#currentPortfolioURL").text() });
                    originalPortfolioURL = $("#currentPortfolioURL").text();
                    $("#portfolioLink")
                        .attr("href", responseData.url + $("#currentPortfolioURL").text())
                        .text(responseData.url + $("#currentPortfolioURL").text());
                } else {
                    $("#currentPortfolioURL").text(originalPortfolioURL);
                }
            });

        }

        $("#editPortfolioURL").show();
        $("#cancelPortfolioURL").hide();
        $("#savePortfolioURL").hide();
        $("#currentPortfolioURL").removeAttr("contenteditable");
        $("#portfolioURLStatusIcon").removeAttr("class");
    });

    $("#currentPortfolioURL").keyup(function (event) {

        var requestedURL = $("#currentPortfolioURL").text().toLowerCase();
        if ($(this).text() == originalPortfolioURL) {
            $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
            console.log("NO CHANGE");
        } else {
            console.log("about to check");
            checkCredentialsAvailable(null, requestedURL, function (responseData) {
                console.log(responseData.portfolioURLAvailable);
                if (responseData.portfolioURLAvailable) {
                    $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
                } else {
                    console.log("Portfolio URL not available");
                    $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ban-circle");
                }
            });
        }
    }).keypress(function(event){
        if (event.which == 13) {
            $("#savePortfolioURL").trigger("click");
            event.preventDefault();
            $(this).blur();
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
        $.post("/checkCredentialsAvailable", { requestedUsername: username, requestedPortfolioURL: url }, function (serverResponse) {

            // Passing the response data back to the callback function
            cb(serverResponse);
        }, "json");
    }
});

function resizeFigures() {
    var maxFigHeight = 0;
    $('figure').each(function () {
        maxFigHeight = maxFigHeight > $(this).height() ? maxFigHeight : $(this).height();
    });
    $(".swfContainer").css("height", $("figure img").height());
    $("figure").css("minHeight", maxFigHeight);

    $("video").each(function () {
        $(this).css("left", ($(this).parent().width() - $(this).width()) / 2);
    });
}
