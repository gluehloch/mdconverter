const glob = require("glob");
const fs = require('fs');
const showdown = require('showdown');
const path = require('path');

const options = {};
const testFolder = './';
// const pattern = "**/*.md";
const pattern = "*.md";

const converter = new showdown.Converter();

// options is optional
glob(pattern, options, function (er, files) {
    files.forEach(file => {
        console.log("Verarbeite: " + file);
        var text = fs.readFileSync(file, 'utf-8');
        md = converter.makeHtml(text);

        var outputf = path.basename(file, path.extname(file)) + '.html'; // options.outputext;
		fs.writeFileSync(outputf, md, 'utf-8');
    });
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.
})

/*
fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
        console.log(file);
    });
});
*/

var text = '# hello, markdown!';
var html = converter.makeHtml(text);

console.log(html);