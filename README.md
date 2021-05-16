# Family Tree

A client side visualization tool for family trees obtained from Turkish e-Government "alt soy - üst soy sorgulama" pages.

After displaying your family tree in a tabular form at the e-Government page, copy the whole content of the page in any browser and paste it into the given text box.

## Technical Info

- Using Raphaëljs for visualization. 
- Using Grunt for deployment. TODO: Details
- Using [Macaw](http://download.macaw.co/) for the page design. 
    - Design file is located at the `/design` directory. After changing it, publish it under Macaw and manually modify the index.html and css files with the ones generated under `/design/altsoyustsoy` directory.
- I'm not very fluent in Javascript, so don't be surprised if you see some awkward methods of doing things which are really easy with a different method.

## Deployment Preparation
Call "grunt" at the terminal. It copies all output to the `docs` directory. 
It can also uglify all css and js and then replace the original references at the project with the uglified ones; however, this is deactivated for now.
If you wish to activate this, uncomment the corresponding lines in "Gruntfile.js".

## TODOs & Bugs & Known Issues 

1. Privacy part of the index page needs to be prepared.
2. Fancier images for tree nodes.