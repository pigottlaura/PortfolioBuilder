jQuery(document).ready(function ($) {
    // Storing the current value of the portfolio URL, so that if the user edits it later on, and
    // wants to undo this action, it's original value can be restored
    var originalPortfolioURL = $("#currentPortfolioURL").text();

    var openOptionsOnTab = 0;

    var cookieData = getCookieData($("#adminOptionsAccordion").attr("id"));

    if (cookieData.exists) {
        openOptionsOnTab = parseInt(cookieData.value);
    }
    
    $("#adminOptionsAccordion").accordion({
        active: openOptionsOnTab
    });

    // Using the jQuery UI sortable() function, to make the contents of the div which contains the 
    // users media items sortable i.e. they can be reordered by dragging and dropping. Setting the
    // containment to 'parent' so that these elements cannot be dragged outside the box. Setting the
    // cursor to 'move' so that it's symbol changes while the user is dragging. Setting the 'cancel'
    // function to be invoked if the user tries to drag an element while over it's caption, select
    // category dropdown or the options within it, as this should not be detected as a dragging event
    // but as a click.
    $("#sortable").sortable({
        containment: "parent",
        cursor: "move",
        cancel: "figcaption, select, option",
        stop: function (event, ui) {

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

    $("#sortable figure").each(function (index) {
        var mediaCategoryClass = "mediaCategory" + index;

        $(this).find(".categoryOptions").append("<select class='mediaCategory " + mediaCategoryClass + "'></select>");

        $("." + mediaCategoryClass).append("<option value='none' selected>-Category-</option>");

        $(".category").each(function (index) {
            $("." + mediaCategoryClass).append("<option value='" + $(this).text() + "'>" + $(this).text() + "</option>");
            console.log($(".category").data("category"));
            if ($(this).text() == $("." + mediaCategoryClass).parent().data("category")) {
                console.log("")
                $("." + mediaCategoryClass).val($(this).text());
            }
        });
    });

    $("#sortable figure select").change(function (event) {
        $.post("/admin/changeMediaCategory", { mediaItem: $(event.target).parent().parent().parent().attr("id"), category: $(event.target).val() });
    });

    $("figcaption").blur(function (event) {
        var mediaItemId = $(event.target).parent().attr("id");
        $.post("/admin/changeMediaTitle", { mediaId: mediaItemId, newTitle: $(event.target).text() });
    });

    $("figcaption, p, input").keypress(function (event) {
        console.log(event.which);
        if (event.which == 13) {
            if (event.target.id == "newCategory") {
                $("#addCategory").trigger("click");
            } else if (event.target.id == "currentPortfolioURL") {
                $("#savePortfolioURL").trigger("click");
            }
            event.preventDefault();
            $(event.target).blur();
        }
    });

    $("#contact textarea").change(function (event) {
        $("#contact p").trigger("blur");
    });

    $("#contact p").blur(function (event) {
        $.post("/admin/changeContactDetails", {
            name: $("#contactName").text(),
            email: $("#contactEmail").text(),
            info: $("#contactInfo").val(),
            phone: $("#contactPhone").text()
        });
    });

    $("#contactPicture").click(function (event) {
        $("#settings").trigger("click");
    });

    $(".deleteMedia").click(function (event) {
        $(event.target).removeClass("glyphicon-trash").addClass("glyphicon-hourglass").unbind("click");

        $.post("/admin/deleteMedia", { mediaId: event.target.id }, function (responseData) {
            $(".row > div").find("span[id='" + responseData.mediaId + "']").parent().parent().parent().parent().remove();
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
    });

    $("#addCategory").click(function (event) {
        $.post("/admin/addNewCategory", { newCategory: $("#newCategory").val() }, function (serverResponse) {
            $("#categories").append("<div class='row'><div class='col-xs-10'>" + serverResponse.newCategory + "</div><div class='col-xs-2'><button class='deleteCategory' id='" + serverResponse.newCategory + "'>x</button></div>");
            $("#newCategory").val("").focus();

            $(".mediaCategory").each(function (index) {
                $(this).append("<option value='" + serverResponse.newCategory + "'>" + serverResponse.newCategory + "</option>");
                if ($(this).parent().data("category") == serverResponse.newCategory) {
                    $(this).val(serverResponse.newCategory);
                }
            });
            console.log("New category added");
        }, "json");
    });

    // Dynamically generated element were not being detected by .click(). using on() instead
    $("#categories").on("click", ".deleteCategory", function (event) {
        $.post("/admin/deleteCategory", { deleteCategory: $(event.target).attr("id") }, function (serverResponse) {
            $(".mediaCategory option").each(function (index) {
                console.log("option = " + $(this).text() + "; deleted = " + serverResponse.deletedCategory);
                if ($(this).text() == serverResponse.deletedCategory) {
                    $(this).removeAttr("selected").remove();
                    $(this).parent().val('none');
                    console.log("removed option");
                }
            });
            $("#" + serverResponse.deletedCategory).parent().parent().remove();
        }, "json");
    });

    $("input[type='file']").change(function (event) {
        if ($(event.target).val().length > 0) {
            $(event.target).removeClass("formWarning");
        }
    });

    $("#uploadMedia, #changeContactPicture").submit(function (event) {
        var allowSubmit = false
        if ($(event.target).find("input[type='file']").val().length > 0) {
            allowSubmit = true;
            
            if($(event.target).attr("id") == "changeContactPicture"){
                document.cookie = "adminPagesTabs=1";
            } else if($(event.target).attr("id") == "uploadMedia"){
                document.cookie = "adminPagesTabs=0";
            }
        } else {
            $(event.target).find("input[type='file']").addClass("formWarning");
            console.log("No file specified");
        }

        return allowSubmit;
    });
});