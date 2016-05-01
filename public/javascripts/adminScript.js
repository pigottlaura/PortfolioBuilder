jQuery(document).ready(function ($) {
    console.log("Admin Script Loaded");

    // Storing the current value of the portfolio URL, so that if the user edits it later on, and
    // wants to undo this action, it's original value can be restored
    var originalPortfolioURL = $("#currentPortfolioURL").text();

    // Creating a variable to store the number of which heading of the accordion should be opened 
    // when the page loads (based on the cookie stored for this element). Would prefer to be doing 
    // this the same way as with the .tabs() elements (i.e. in the main script file, looping through
    // them and setting their options accordingly) but if I do that with a .accordion() the result is
    // the accordion opening at it's default, and then quickly changing to the correct heading (which 
    // doesn't look very well)
    var openOptionsOnTab = 0;

    // Getting the cookie data of this element's cookie, by passing it's id to the getCookieData() method 
    // I created in the main script file. This will return an object with two properties - exists and value
    var cookieData = getCookieData("#adminOptionsAccordion");

    // If this cookie already exists, then this is the number of the accordion heading the user was on when the 
    // page last loaded, and hence should be the heading they are on when it reloads
    if (cookieData.exists) {
        openOptionsOnTab = parseInt(cookieData.value);
    } else {

        // Since this cookie does not already exist, creating a new one, with the name of the element and the 
        // default accordion heading value of 0 (i.e. the first heading in the accordion)
        document.cookie = "adminOptionsAccordion=0";
    }

    // Calling the jQuery UI accordion() method on the admin options panel, so that it will function as an 
    // accordion menu. Passing in options, in the form of an object, which use the value sourced from the relevant 
    // cookie above to activate the correct tab first (i.e. the one the user was last on), and setting the heightStyle
    // to be equal to content, so that each panel in the accordion can resize accordingly to fit it's own content
    $("#adminOptionsAccordion").accordion({
        active: openOptionsOnTab,
        heightStyle: "content"
    });

    // Using the jQuery UI sortable() function, to make the contents of the div which contains the 
    // users media items sortable i.e. they can be reordered by dragging and dropping. Setting the
    // containment to 'parent' so that these elements cannot be dragged outside the box. Setting the
    // cursor to 'move' so that it's symbol changes while the user is dragging. Setting the 'cancel'
    // function to be invoked if the user tries to drag an element while over it's caption, select
    // category dropdown or the options within it, as this should not be detected as a dragging event
    // but as a click.
    $("#sortable").sortable({
        grid: [1, 1],
        cursor: "move",
        cancel: "figcaption, select, option",
        stop: function (event, ui) {

            resizeFigures();

            // Creating a temporary array to store the id's and index positions of each of the media
            // items (figures) on the page, so that they can be passed to the server as one stringified
            // JSON object
            var mediaItemOrder = [];

            // Looping through each of the figures (media items) on the page
            $.each($("figure"), function (index) {
                //console.log($(this).find("figcaption").text() + " is at index " + index);

                // Pushing the media id and index position of this figure into the temporary array
                // created above, so that it can be sent, along with the rest of the media item's 
                // positions, to the server to be stored, so that the new order of these media items
                // will be saved in the database (so that in the admin panel, and on the portfolio
                // page, the media items will display in the order specified by the admin)
                mediaItemOrder.push({
                    mediaId: $(this).attr("id"),
                    indexPosition: index
                });
            });

            // Sending an AJAX POST request to the server, passing in the new order of the media items
            // (as stored in the temporary variable above). Stringifying these, so the array can be parsed
            // as JSON on the server side. This POST request will receive a response from the server, but as
            // this is only to end the request/response cycle, and will contain no additional data, not adding
            // a callback to the request.
            $.post("/admin/changeMediaOrder", { newOrder: JSON.stringify(mediaItemOrder) });
        }
    });

    // Generating a select option element above each of the media item figures on the page, so that the user can
    // assign different categories to each of them directly
    $("#sortable figure").each(function (index) {

        // Generating a new class name for this select option, using the index provided
        var mediaCategoryClass = "mediaCategory" + index;

        // Finding the div within this figure, which is a placeholder for where this select element should be added.
        // Assigning the mediaCategory class, along with it's own individual class (defined above)
        $(this).find(".categoryOptions").append("<select class='mediaCategory " + mediaCategoryClass + "'></select>");

        // Finding the new select element that was just created, and appending the default "none" option to it
        $("." + mediaCategoryClass).append("<option value='none' selected>-Category-</option>");

        // Looping through each category defined in the app (as listed in the categories section of the admin panel)
        $(".category").each(function (index) {

            // Appending a new option for each of the categories, to the new select option just created above. Setting
            // the value and the content to be equal to the name of the category
            $("." + mediaCategoryClass).append("<option value='" + $(this).text() + "'>" + $(this).text() + "</option>");

            // Checking if the name of this category matches with the select options parent element's data-category attribute
            // i.e. if this is the category of the current figure (which would have been added to the parent's data attribute
            // while rendering on the server)
            if ($(this).text() == $("." + mediaCategoryClass).parent().data("category")) {

                // Since this is the category of this figure, setting the value of this new select element to be 
                // equal to it (i.e. to reflect the media item's current category)
                $("." + mediaCategoryClass).val($(this).text());
            }
        });
    });

    // Checking if a user has clicked on a select element i.e. the category pickers for each media item
    $("#sortable figure select").click(function (event) {

        // Checking if this select element has more than just the default option
        if ($(event.target).find("option").length <= 1) {

            // Since there are currently no options in this select element, then there must be no categories 
            // in this portfolio, so triggering a click event on the categories section of the admin panel to
            // open the accordion menu accordingly, to encourage the user to add some categories
            $("#categorySettings").trigger("click");

            // Setting the location href to be equal to the categories heading id, so that if the user is too
            // far down the page to see the panel open, they will be scrolled back up to it
            location.href = "#categorySettings";
        }
    }).change(function (event) {
        // Every time a change occurs on a select element (i.e. a change of category) sending an AJAX POST request
        // to the server, with the id of the media item, and the new category to which it has been assigned. No data
        // is needed from the response, so not setting a callback for this request
        $.post("/admin/changeMediaCategory", { mediaItem: $(event.target).parent().parent().parent().attr("id"), category: $(event.target).val() });
    });

    // Each time a figcaption looses focus, triggering an AJAX post request to the server (i.e. to change that
    // media item's title)
    $("figcaption").blur(function (event) {
        $.post("/admin/changeMediaTitle", { mediaId: $(event.target).parent().attr("id"), newTitle: $(event.target).text() }, function () {
            // Once the server responds, calling the resizeFigures method (as declared in the main script file)
            // so that all the figures will be the same size
            resizeFigures();
        });
    });

    // Each time a keypress is detected on an element that accepts user input, checking if it was the enter key
    // that was pressed (so that this can then trigger these element's save/add options to be called). Also ensuring
    // that the enter key's default line break does not occur, as this would not be an acceptable input into these
    // fields
    $("figcaption, p, input").keypress(function (event) {

        // Checking if it was the enter key that was pressed
        if (event.which == 13) {

            // Checking if the current input field was "newCategory"
            if (event.target.id == "newCategory") {

                // Triggering a click on the addCategory button, so the new category can be added
                $("#addCategory").trigger("click");

            } else if (event.target.id == "currentPortfolioURL") {

                // If the current input field was for changing the user's portfolio url, then triggering
                // a click on the save button of this field so that it can be saved to the server
                $("#savePortfolioURL").trigger("click");
            }

            // Preventing the default behaviour of the enter key (i.e. not allowing it to add a line break to the 
            // input)
            event.preventDefault();

            // Removing focus from the element that triggered this event, so it's value will now be 
            // saved (either through the triggering of a click above, or through it loosing focus - as
            // seen below)
            $(event.target).blur();
        }
    });

    // Each time the value in the contact info text area is changed, triggering the paragraph within the same area
    // to lose focus, so that it's new value can be sent to the server (as seen below)
    $("#contact textarea").change(function (event) {
        // Only targeting the first returned paragraph, as if this query were to return more than one paragraph, 
        // multiple requests would be made to the server (i.e. one for each)
        $("#contact p").first().trigger("blur");
    });

    // When any paragraph in the contact details section of the admin panel looses focus (which could also include
    // the textarea, as seen above this triggers a blur event on a paragraph when it is changed - as it has not blur
    // event of it's own)
    $("#contact p").blur(function (event) {

        // Sending an AJAX request to the server with the current values of the user's name, email, info and phone.
        // The purpose of sending these all in one request, is that on the server side it is much faster to update
        // the document, than to find specific fields each time, so I just update these four for every request
        $.post("/admin/changeContactDetails", {
            name: $("#contactName").text(),
            email: $("#contactEmail").text(),
            info: $("#contactInfo").val(),
            phone: $("#contactPhone").text()
        });
    });

    // If a user clicks on their contact picture (while in the admin panel) triggering the admin settings accordion
    // to open on the contact picture panel, just incase they were clicking on it to try and change it.
    $("#contactPicture").click(function (event) {

        // Triggering a click on the contact picture settings heading of the admin accordion options so it will open
        $("#contactPictureSettings").trigger("click");

        // Setting the location href to be equal to the id of this heading, so that if the user is too far down the
        // screen to see it opening, they will be taken back up to the contact pictures settings panel
        location.href = "#contactPictureSettings";
    });

    // Everytime a media item's deleteMedia icon is clicked, sending a request to the server to remove it
    $(".deleteMedia").click(function (event) {

        // Swapping the deleteMedia button's icon from a trash can to an hour glass, so that if there is a time
        // delay, the user will know that the request is in progress. Also unbinding the click event from this button
        // so that only one delete request will be sent to the server (i.e. they cannot click it again)
        $(event.target).removeClass("glyphicon-trash").addClass("glyphicon-hourglass").unbind("click");

        // Sending an AJAX request to the server, with the id of the media item the user want to delete.
        $.post("/admin/deleteMedia", { mediaId: event.target.id }, function (responseData) {

            // As this was an AJAX request, there may be some time delay in the button being clicked, and the media
            // item being deleted from the server. Once the server response to say that this media item has been 
            // deleted (i.e. through the id on the response data object) I use the to find the deleteMedia button
            // that was originally clicked (by it's id - which was the media item's id), and then remove the div which
            // contains the figure, of the media item that was just removed. Removing this div from the DOM, so the 
            // deletion of this media item is reflected client side aswell, without having to reload the page
            $(".row > div").find("span[id='" + responseData.mediaId + "']").parent().parent().parent().parent().remove();
        }, "json");
    });

    // When a user clicks on the button to edit their portfolio URL. The reason I am using a button system for this
    // field, as opposed to the click and type method I use for everything else, is that I feel this is the most
    // significant input on the screen, as if someone were to inadvertantly change their portfolio URL, and employeer
    // may no longer be able to find it. This method allows them to cancel the edit, before it is sent to the server
    $("#editPortfolioURL").on("click", function (event) {

        // Setting the content editable property of the paragraph holding the URL to true (i.e. so it can be manipulated).
        // Calling focus on it, so the user knows it is now editable
        $("#currentPortfolioURL").prop("contenteditable", "true").focus();

        // Setting the status icons to default to OK, i.e. as the user already owns the url in this box, it is 
        // technically available (to them only)
        $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");

        // Hiding the "edit" button
        $(this).hide();

        // Displaying the cancel and save button
        $("#cancelPortfolioURL").show();
        $("#savePortfolioURL").show();

    });

    // When a user clicks the cancel button while editing their portfolio URL, it is reset to it's original value,
    // and no request is made to the server
    $("#cancelPortfolioURL").click(function (event) {

        // Removing the content editable attribute from the paragraph, and removing the focus from it, so the 
        // user can no longer type into it. Resetting the text value of this element to be equal to it's original
        // value
        $("#currentPortfolioURL").removeAttr("contenteditable").blur().text(originalPortfolioURL);

        // Removing all classes from the portfolio status icon, as this no longer needs to display whether or
        // not the url is available or not
        $("#portfolioURLStatusIcon").removeAttr("class");

        // Hiding the cancel button (which was just clicked on), as well as hiding the save button
        $(event.target).hide();
        $("#savePortfolioURL").hide();

        // Displaying the edit button again
        $("#editPortfolioURL").show();
    });

    // If a user chooses to save their edited portfolio url, first checking if it is available and then
    // sending it to the server to update their portfolio accordingly
    $("#savePortfolioURL").click(function (event) {

        // Checking that the new url is not equal to the existing one (i.e. no change was made)
        if ($("#currentPortfolioURL").text() != originalPortfolioURL) {

            // Adding an hour glass beside the portfolio link, so the user knows it is being updated
            $("#portfolioLinkStatus").addClass("glyphicon-hourglass");

            // Disabling the edit button, so the user cannot try to make an edit while the url is being
            // updated
            $("#editPortfolioURL").unbind("click");

            // Temporarily storing the requested URL, cast to lowercase and with all spaces removed from it
            var requestedURL = $("#currentPortfolioURL").text().toLowerCase().replace(/ /g, "");

            // Making an AJAX request to the server to see if this url is available (or if someone else has
            // already claimed it) using the checkCredentialsAvailable() method I declared in the main script
            // class. Passing in null for the username (as no username needs to be checked right now), the 
            // lowercase version of the url (with no spaces) and a callback to which the response data wil be passed
            // once the server responds
            checkCredentialsAvailable(null, requestedURL, function (responseData) {

                // Checking the response data to see if this url is currently available
                if (responseData.portfolioURLAvailable) {

                    // Sending an AJAX request to the server, with the requested url (as sourced from the 
                    // response data, to ensure that it hasn't changed since we last checked if it was available)
                    $.post("/admin/changePortfolioURL", { newPortfolioURL: responseData.portfolioURL });

                    // Setting the global originalPortfolioURL to be equal the the requested url, so that the
                    // next time the user makes a change to it, we can test it against its new current value
                    originalPortfolioURL = responseData.portfolioURL;

                    // Updating the link to the user's portfolio (at the top of the admin screen) to link to the 
                    // new portfolio url (preceeded by the website's url, which is also passed back in the response
                    // i.e. so that the link will look correct regardless of whether the app is running locally or remotely)
                    $("#portfolioLink")
                        .attr("href", responseData.url + responseData.portfolioURL)
                        .text(responseData.url + responseData.portfolioURL);

                    // Removing the hour glass beside the portfolio link
                    $("#portfolioLinkStatus").removeClass("glyphicon-hourglass");

                    // Enabling the edit button, so the user can edit the url again
                    $("#editPortfolioURL").bind("click");
                } else {

                    // As these credentials are not available, resetting the url input to be equal to it's previous value
                    $("#currentPortfolioURL").text(originalPortfolioURL);
                }
            });

        }

        // Displaying the edit button 
        $("#editPortfolioURL").show();

        // Hiding the cancel and save buttons
        $("#cancelPortfolioURL").hide();
        $("#savePortfolioURL").hide();

        // Removing the content editable attribute from the url input, as the user has finished editing it
        $("#currentPortfolioURL").removeAttr("contenteditable");

        // Removing all classes from the status icon, as it no longer needs to display feedback on whether this url
        // is available or not
        $("#portfolioURLStatusIcon").removeAttr("class");
    });

    // Each time the user releases a key while typing in the url input field, sending an AJAX request to the server
    // to check if it is available (i.e. so that the status icon can give them feedback on this before they decide to 
    // change their url)
    $("#currentPortfolioURL").keyup(function (event) {

        // Temporarily storing the requested URL, cast to lowercase and with all spaces removed from it
        var requestedURL = $("#currentPortfolioURL").text().toLowerCase().replace(/ /g, "");;

        // Checking if the new value of the url input is equal to it's previous value (i.e. no change occurred)
        if ($(this).text() == originalPortfolioURL) {

            // Setting the status icons to default to OK, i.e. as the user already owns the url in this box, it is 
            // technically available (to them only)
            $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
        } else {

            // Making an AJAX request to the server to see if this url is available (or if someone else has
            // already claimed it) using the checkCredentialsAvailable() method I declared in the main script
            // class. Passing in null for the username (as no username needs to be checked right now), the 
            // lowercase version of the url (with no spaces) and a callback to which the response data wil be passed
            // once the server responds
            checkCredentialsAvailable(null, requestedURL, function (responseData) {
                // Logging out the response data from the server, to see if the url is available or not
                console.log(responseData.portfolioURLAvailable);

                // Checking if the url is available or not
                if (responseData.portfolioURLAvailable) {

                    // Changing the status icon to a green circle, as this url is available 
                    $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
                } else {

                    // Changing the status icon to a red circle, as this url is not available
                    $("#portfolioURLStatusIcon").attr("class", "glyphicon glyphicon-ban-circle");
                }
            });
        }
    });

    // Each time a user adds a new category, a request is sent to the server to update the list of category's on this
    // portfolio. These category's are used on the admin panel to decide which options to display in the select elements
    // on each media item, and on the portfolio page to decide which options to give visitors to filter the users 
    // portfolio by
    $("#addCategory").on("click", function (event) {

        // Temporarily disabling this button, so that users can't accidentally send multiple requests to the server
        // while waiting for the first to go through
        $("#addCategory").unbind("click");

        // Sending an AJAX request to the server with the name of the new category
        $.post("/admin/addNewCategory", { newCategory: $("#newCategory").val() }, function (serverResponse) {

            // Since this is an asynchronous request, there will be a time delay between the user clicking the button, and
            // the category being added to the server, so waiting until the server resonds to add the new category to
            // the list of existing category's (directly above the add button)
            $("#categories").append("<div class='row'><div class='col-xs-10'>" + serverResponse.newCategory + "</div><div class='col-xs-2'><button class='deleteCategory' id='" + serverResponse.newCategory + "'>x</button></div>");

            // Returning the focus to the new category input, so that the user can continue to type and add new category's
            // without having to click into it again
            $("#newCategory").val("").focus();

            // Enabling the add category button, as the previous request has just completed
            $("#addCategory").bind("click");

            // Looping through each of the select elements on the media items, and adding this new category as an option
            $(".mediaCategory").each(function (index) {

                // Adding a new option to this select element, using the name returned in the response data, just incase 
                // multiple category's are added one after the other, and come back in the wrong order, I want to 
                // ensure I am adding the right one
                $(this).append("<option value='" + serverResponse.newCategory + "'>" + serverResponse.newCategory + "</option>");

                // Checking if the name of this category matches with the select options parent element's data-category attribute
                // i.e. if this is the category of the current figure (which would have been added to the parent's data attribute
                // while rendering on the server)                
                if ($(this).parent().data("category") == serverResponse.newCategory) {

                    // Since this is the category of this figure, setting the value of this select element to be 
                    // equal to it (i.e. to reflect the media item's current category)
                    $(this).val(serverResponse.newCategory);
                }
            });
        }, "json");
    });

    // Dynamically generated category's were not being detected by click(), so using on() instead (as these
    // new elements can then have the click event bound to them). Detecting clicks on their deleteCategory buttons,
    // so that a request can be sent to the server to delete them
    $("#categories").on("click", ".deleteCategory", function (event) {

        // Sending an AJAX request to the server, with the id of the delete button that was clicked (which will be
        // equal to the name of that category)
        $.post("/admin/deleteCategory", { deleteCategory: $(event.target).attr("id") }, function (serverResponse) {

            // Looping through the select elements of media item, so that this category can be removed from their
            // options, once the server responds
            $(".mediaCategory option").each(function (index) {

                // Checking if this category was the current category of this media item
                if ($(this).text() == serverResponse.deletedCategory) {

                    // Removing the selected attribute from the option, so that it no longer appears as the 
                    // selected option on this media item
                    $(this).removeAttr("selected").remove();

                    // Setting the value of this media item's select element to be "none" i.e. the default
                    // value for select elements
                    $(this).parent().val('none');

                    // Decided not to reset the category of this media item on the server, as if the user wants
                    // to re-add this category later on, the media items that were previously assoicated with it
                    // will automatically reset to it. Even though media items may maintain a category that doesn't
                    // exist, unless it is listed as a category of the portfolio it will not be listed as such, in 
                    // the admin panel nor the portfolio page (unless the category is added again)
                }
            });

            // Finding the category element in the list of category's in the admin panel, and removing it (based
            // on the category that the server has just deleted, incase responses come back in the wrong order)
            $("#" + serverResponse.deletedCategory).parent().parent().remove();
        }, "json");
    });

    // Checking the forms that contain file uploads, to ensure a file has been selected before 
    // the form can be sent to the server
    $("#uploadMedia, #changeContactPicture").submit(function (event) {
        // Creating a boolean which will be used to determine if this form should be allowed to 
        // submit or not. This will only be set to true if the form that triggered the event has
        // at least one file in it
        var allowSubmit = false

        // Finding the file input of the form that triggered this event, and checking if the length
        // of it's value is greater than 0 (i.e. does it have a file included)
        if ($(event.target).find("input[type='file']").val().length > 0) {

            // Changing allow submit to true, so that this form can be sent to the server
            allowSubmit = true;

            // Checking which form triggered the event
            if ($(event.target).attr("id") == "changeContactPicture") {

                // Since the user just uploaded a new contact picture, setting the cookie for the tab pages
                // in the admin panel to be 1 (i.e. so when the page reloads, the user can see the result in the
                // contact page)
                document.cookie = "adminPagesTabs=1";
            } else if ($(event.target).attr("id") == "uploadMedia") {

                // Since the user just uploaded a media item, setting the cookie for the tab pages
                // in the admin panel to be 0 (i.e. so when the page reloads, the user can see the results in the
                // home page)
                document.cookie = "adminPagesTabs=0";
            }
        } else {
            // Since the file input in this form contains no file, adding the form warning class to it so that
            // the user understands why the form would not submit
            $(event.target).find("input[type='file']").addClass("formWarning");
        }

        if (allowSubmit) {
            // Unbinding the click event from this form, so that the user cannot accidentally submit
            // it twice while it is still being processed (this will reset once the file has been uploaded
            // as the page will be refreshed)
            $(event.target).find("input[type=submit]").attr("disabled", "disabled");
        }

        // Returning the value of allowSubmit to the function, which will determine whether or not this form
        // can be submitted to the server
        return allowSubmit;
    });

    // If a user has no media items uploaded yet, a button will appear in the home panel to encourage them
    // to upload some media. When this button is clicked, triggering a click on the "upload media" section
    // of the accordion menu, so that if it is not already open, it will be activated
    $("#triggerUploadMedia").click(function (event) {
        $("#uploadMediaSettings").trigger("click");
    });
});