jQuery(document).ready(function ($) {
    console.log("Main JS script loaded");

    // Calling the jQuery UI tabs() method, to create tabbed portions of the pages i.e.
    // on the login screen, and in the admin panel
    $(".tabs").tabs();

    // Every time the page loads, getting the previous tab index for any jQuery UI tabs() elments on
    // the screen, so that if the page has just reloaded, or the user was directed back here, they
    // see the same layout
    $(".tabs").each(function (index) {
        // Getting the cookie data of this element's cookie, by passing it's id to the getCookieData() method 
        // I created below. This will return an object with two properties - exists and value
        var cookieData = getCookieData($(this).attr("id"));

        // If the cookie for this tab element already exists, getting it's value and setting the tabs element to this
        if (cookieData.exists) {
            $(this).tabs("option", "active", cookieData.value);
        } else {
            // Since the cookie does not already exist, creating a new one, with the same name as this tabs element
            // id, and the index value of the current tab it is on
            document.cookie = $(this).attr("id") + "=" + $(this).tabs("option", "active");
        }
    });

    // Everytime the window is resized, calling the same resizeFigures() method so that the figures
    // will be recalculated and the containers sized appropriatley
    $(window).resize(function () {

        // Calling the resizeFigures() method, as defined below. The purpose of this method is to
        // combat the issues with resizing of embedded objects (such as swfs and videos). As I wanted
        // to make each of these elements responsive (along with any other media elements on the page).
        // Each video and swf is wrapped in a container, and set to scale to the container's size. In order
        // to ensure that this container matches with the other figures on the screen, using this function
        // to find the largest figure, and then resizing all other figures and containers to match this.
        resizeFigures();
    });

    // Waiting until all elements on the page have loaded before resizing them
    window.onload = function () {
        console.log("Window Loaded");

        // Calling the resizeFigures() method, as defined below. The purpose of this method is to
        // combat the issues with resizing of embedded objects (such as swfs and videos). As I wanted
        // to make each of these elements responsive (along with any other media elements on the page).
        // Each video and swf is wrapped in a container, and set to scale to the container's size. In order
        // to ensure that this container matches with the other figures on the screen, using this function
        // to find the largest figure, and then resizing all other figures and containers to match this.
        resizeFigures();
    }

    // Every time an accordion is activated (i.e. clicked on) storing the current accordion index position in a
    // cookie so that if the page reloads, or the user is directed back here, they will see the same layout as before
    $(".accordion").on("accordionactivate", function (event, ui) {

        // Removing any warnings from form inputs, as when a user changes tabs they must no longer be trying to
        // submit a form
        $("form input").not("[type='submit']").removeClass("formWarning");

        // Setting the cookie with the same name as this accordion element's id to be equal to the number of the 
        // accordion heading it is now on
        document.cookie = $(event.target).attr("id") + "=" + $(event.target).accordion("option", "active"); + ";path=/";
    });

    // Every time a tab is activated (i.e. clicked on) storing the current tabs index position in a cookie so that
    // if the page reloads, or the user is directed back here, they will see the same layout as before
    $(".tabs").on("tabsactivate", function (event, ui) {

        // Resizing all figures again, as a change of tabs can cause the swfs to disappear
        resizeFigures();

        // Removing any warnings from form inputs, as when a user changes accordion headings they must no longer 
        // be trying to submit a form
        $("form input").not("[type='submit']").removeClass("formWarning");

        console.log("Changing " + $(event.target).attr("id") + " to " + $(event.target).tabs("option", "active"));

        // Setting the cookie with the same name as this tab element's id to be equal to the number of the tab
        // it is now on
        document.cookie = $(event.target).attr("id") + "=" + $(event.target).tabs("option", "active"); + ";path=/";
    });
});

// This function is called each time the page is reloaded, or the window is resized, to ensure that varying
// types of content are all sized the same i.e. images, video and swfs
function resizeFigures() {

    // Resetting each figure's minHeight to it's initial value, so that when the resizeFigures() funciton
    // runs, it is not basing it's new height value on the current dimensions of the figures
    $("figure").css("minHeight", "initial");
    $("figure video, figure object, .objectContainer").css("height", $("figure img").height());

    // Creating a temporary variable to store the largest height of the figures currently
    var maxFigHeight = 0;

    var maxImgHeight = 0;

    // Looping through each figure on the page, to find the current largest height
    $('figure').each(function () {
        // Using a ternary operator to test this figure's height against the current maximum figure height
        // detected. If this figure is taller, then updating maxFigHeight to reflect this, otherwise setting
        // maxFigHeight to equal it's current value
        maxFigHeight = maxFigHeight > $(this).height() ? maxFigHeight : $(this).height();
        maxImgHeight = maxImgHeight > $(this).find("img").outerHeight() ? maxImgHeight : $(this).find("img").outerHeight();
    });

    $("figure").css("minHeight", maxFigHeight * 1.02);
    $(".objectContainer, video, object").css("height", maxImgHeight);

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


function getCookieData(findCookie) {
    // Creating an array that stores all of the cookies of the session as seperate 
    // elements. Using .replace() to remove all spaces from this string of data, and 
    // the .split() method to set the points at which the string of cookies needs 
    // to be seperated i.e. after each ;
    var allCookies = document.cookie.replace(/ /g, "").split(";");
    var cookieData = {
        exists: false,
        value: ""
    }

    for (var i = 0; i < allCookies.length; i++) {
        if (allCookies[i].split("=")[0] == findCookie) {
            cookieData.exists = true;
            cookieData.value = allCookies[i].split("=")[1];
            console.log(findCookie + " exists = " + cookieData);
        }
    }

    return cookieData;
}