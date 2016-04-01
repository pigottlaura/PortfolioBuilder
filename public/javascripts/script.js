jQuery(document).ready(function($) {
    console.log("Document ready");
    $(".tabs").tabs();

    $("#createAccount input").change(function() {
        
        $("input[name='username'], input[name='portfolioURL']").val(function(){
            return $(this).val().toLowerCase().replace(/ /g, "");
        });
        
        var username = $("input[name='username']").val().toLowerCase();
        var url = $("input[name='portfolioURL']").val().toLowerCase();
        
        if ($("input[name='portfolioURL']").val() == "") {
            $("input[name='portfolioURL']").val(username.replace(/ /g, ""));
        }
        
        $.post("/checkCredentialsAvailable", { requestedUsername: username, requestedPortfolioURL: url }, function(responseData) {
            console.log(responseData);

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


        }, "json");
    });
});