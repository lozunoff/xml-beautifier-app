# XML Beautifier App
A cross-platform desktop application for converts XML into a human readable format (pretty print).

# How to build app?
Download or clone this project:
```
$ git clone https://github.com/lozunoff/xml-beautifier-app.git
$ cd xml-beautifier-app
```
Install all dependencies:
```
$ npm i
```
Package the application for your platform:
```
$ npm run package
```
Package the application for another platform:
```
$ npx electron-forge package --arch=<architecture> --platform=<platform>
```
The application is ready to use. Run it from the folder "out/xml-beautifier-app-\<platform\>-\<arch\>/".

# Example
![example](src/img/readme.png)

# License
The app released under the [MIT License](https://github.com/lozunoff/xml-beautifier-app/blob/master/LICENSE).
