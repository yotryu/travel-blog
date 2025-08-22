import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import minimist from 'minimist';

// source: https://gist.github.com/kethinov/6658166
// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + file).isDirectory()) {
      filelist = walkSync(dir + file + '/', filelist);
    }
    else {
      filelist.push(dir + file);
    }
  });
  return filelist;
};

// generate smaller images
let argv = minimist(process.argv.slice(2));
let imageList = walkSync(argv.inputDir + '/', null);
let force = argv.force;
let widths = argv.widths.split(',');


imageList.forEach(i => {
    let ext = path.extname(i);
    if (ext != ".jpg" && ext != ".png" && ext != ".jpeg")
    {
        // not a supported file
        return;
    }

    if (i.includes("_w"))
    {
        // already resized
        return;
    }

    let basePath = path.dirname(i) + "/" + path.basename(i).split('.')[0];

    widths.forEach(w =>
    {
        let newPath = basePath + "_w" + w + ext;
        let width = parseInt(w);
        if (force || !fs.existsSync(newPath))
        {
            sharp(i).resize(width).toFile(newPath);
        }
    });
});