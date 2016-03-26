# PortfolioBuilder

Assignment-02 for the Server Side Programming module, as part of the Creative Mulitimedia B.Sc (hons) degree course in Limerick Institute of Technology, Clonmel.

- App structure
    - Basis of app created using express-generator
- Media Uploads
    - Media files can be uploaded to the server, using the multer module to parse the file data.
    - Media is stored in different directories based on it's mimetype i.e. images are stored in the 'file_uploads/images' directory
- Custom Modules
    - checkDirectories - An array of directory paths can be passed to this custom module, to check if they exist and create them if they do not. Utilises the file system module.