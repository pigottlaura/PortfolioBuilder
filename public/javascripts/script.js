jQuery(document).ready(function($) {
    console.log("Document ready");
    $(".tabs").tabs();

    $("input[name='username']").change(function() {
        var username = $(this).val().toLowerCase();

        $.post("/checkUsernameAvailable", { requestedUsername: username }, function(usernameAvailable) {
            if (usernameAvailable == "true") {
                if ($("input[name='portfolioURL']").val() == "") {
                    $("input[name='portfolioURL']").val(username.replace(/ /g, ""));
                }
                $("#usernameStatusIcon").attr("class", "glyphicon glyphicon-ok-circle");
                $("#usernameStatus").text("available");
            } else {
                console.log("Username not available");
                $("#usernameStatusIcon").attr("class", "glyphicon glyphicon-ban-circle");
                $("#usernameStatus").text("not available");
            }

        });
    });
});