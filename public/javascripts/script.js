jQuery(document).ready(function ($) {
    console.log("Document ready");

    $(".tabs").tabs();
    $(".accordion").accordion();

    resizeFigures();
    $(window).resize(function () {
        $("figure").css("minHeight", "initial");
        resizeFigures();
    });
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
    
    console.log("Figures resized");
}

// Creating an asynchronous function to check if the credentials a user has supplied are available.
// Takes in three parametres. The requested username, requested url, and the callback function to which
// the response data should be returned when a response is received from the server
function checkCredentialsAvailable(username, url, cb) {
    console.log("Checking if the username - " + username + " and url - " + url + " are available");
    $.post("/checkCredentialsAvailable", { requestedUsername: username, requestedPortfolioURL: url }, function (serverResponse) {

        console.log("Username available = " + serverResponse.usernameAvailable + " and url available = " + serverResponse.portfolioURLAvailable);
        // Passing the response data back to the callback function
        cb(serverResponse);
    }, "json");
}
