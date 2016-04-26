# PortfolioBuilder

Assignment-02 for the Server Side Programming module, as part of the Creative Mulitimedia B.Sc (hons) degree course in Limerick Institute of Technology, Clonmel.

Available on: http://portfoliobuilder.azurewebsites.net/

- App structure
    - Basis of app created using express-generator
    - Basis of website layout completed using a Bootstrap grid system
- Database
    - All users, portfolios media items are stored in a Mongo database (generated and run using the Mongoose module).
    - The database connection is shared among multiple routes through a custom module (see below)
    - Running a both a local database (for development purposes) and a MongoLabs database remotely (for use when the app is running live on Azure)
    - Population
        - Using the portfolio document as the main point of quering the database
        - The portfolio document contains the ObjectId of the owner, and an array of ObjectId's for the MediaItems which belong to it
        - Each time the portfolio model is queries, using the populate() method to source the relevant documents using their ObjectId to reference them
        - This appears to be much faster, and returns all the relevant data for the portfolio in one query
    - Mongoose Middleware
        - Each time a new media item is saved, it's object id will be added to the portfolio of it's owner
        - If a media item is deleted, it's object id will also be deleted from the portfolio document of it's owner
- Login
    - Users can log in to create a new portfolio using their Google account. Using the passport-google-oauth module to generate this functionality.
    - Users can create their own accounts on the server, by providing their own username and password, while also being able to choose their portfolio url.
    - When users are filling out the log in form, using an AJAX request to the server to check if the username and/or portfolioURL are available. Giving feedback to the user (i.e. to let them know if these credentials are available) through the use of glyphicons to the right of the relevant input fields
- Media Uploads
    - Media files can be uploaded to the server, using the multer module to parse the file data.
    - Media is stored in different directories based on it's mimetype i.e. images are stored in the 'file_uploads/images' directory
- Portfolio pages
    - Rows of user images are displayed using the grid system
    - Images are clickable/expandable throught the use of LightBox2. Currently, all images are stored in the one "set", and so can be scrolled through from within the one lightbox session.
- Admin page
    - Displaying the user's Google profile picture, or default profile picture
    - Allowing the user to upload multiple media items, with the option to give them a title
    - Media items can be reordered by dragging and dropping them around in the admin panel. Each time the media items order changes, an AJAX request is sent to the server to store their new index positions
    - Media item titles can be updated
    - Media items can be deleted by clicking the "x" in which appears in their top right corner
- Custom Modules
    - checkDirectories - An array of directory paths can be passed to this custom module, to check if they exist and create them if they do not. Utilises the file system module.
    - databaseModels - An object which contains all of the database models for the app i.e. User and Media items, so that they can be used for querying, adding, deleting and updating users throughout routes.
    - googlePassport - This module generates the basic setup for implementing Google passport, such as setting up the passport strategy (using keys generated from my Google Developer account - stored in environment variables for security purposes), the funciton called to autheticate a user's login with Google (once the callback has been received by the server). This function is triggered in the authentication.js route.
    - cryptoEncryption - An object containing two functions, one to encrypt text, and one to decrypt it. Using sample code from https://github.com/chris-rock/node-crypto-examples/blob/master/crypto-ctr.js as the basis of the encryption with Node.js's built in Crypto module.