jQuery(document).ready(function ($) {
    $("#portfolioCategory").change(function (event) {
        $("figure").each(function (event) {
            if ($("#portfolioCategory").val() == "all") {
                $(this).parent().show();
            } else {
                if ($(this).data("category") == $("#portfolioCategory").val()) {
                    $(this).parent().show();
                    console.log("IN category");
                } else {
                    $(this).parent().hide();
                    console.log("OUT of category");
                }
            }

        });
    });
});