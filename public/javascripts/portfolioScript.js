jQuery(document).ready(function ($) {
    
    // Every time the portfolioCategory select option changes value, adjusting which media items
    // should be displayed/hidden
    $("#portfolioCategory").change(function (event) {
        
        // Looping through each figure on the page
        $("figure").each(function (event) {
            
            if ($("#portfolioCategory").val() == "all") {
                
                // If the select option the user has selected is "all", then show all media items (figures)
                $(this).parent().show();
            } else {
                // Otherwise, if the category data attribute of the current figure is the same as the category
                // specified in the select options, then display this figure
                if ($(this).data("category") == $("#portfolioCategory").val()) {
                    
                    // Displaying this figure's parent (i.e. the column it exists in)
                    $(this).parent().show();
                } else {
                    // This figure's category is not currently needed.
                    // Hiding this figure's parent (i.e. the column it exists in)
                    $(this).parent().hide();
                }
            }

        });
        
        // Resizing all the figures left on screen, as a change in the layout of media items can result in swfs
        // or video sizes becoming unstable
        resizeFigures();
    });
});