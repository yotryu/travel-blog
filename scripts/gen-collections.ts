import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

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

interface Collection {
    id: string;
    title: string;
    parent: string;
    posts: string[];
}

interface PostImage {
    src: string;
    size: number;
}

interface Post {
    id: string;
    collection: string;
    title: string;
    content: string;
    images: PostImage[];
}

let folderPath = import.meta.dirname + "/../static/collections";
let postsPath = import.meta.dirname + "/../static/posts";
let allFile = folderPath + "/all.json"

if (!fs.existsSync(folderPath))
{
    fs.mkdirSync(folderPath);
}

// load existing data
let existingData: Collection[] = [];

if (fs.existsSync(allFile))
{
    existingData = JSON.parse(fs.readFileSync(allFile, 'utf8')) as Collection[];
}

// collect current collections available by scanning all posts
let fileList = walkSync(postsPath + '/', null);
let postCollections: Collection[] = [];

fileList.forEach((i) =>
{
    let data = JSON.parse(fs.readFileSync(i, 'utf8')) as Post;
    if (postCollections.findIndex(c => c.id == data.collection) < 0)
    {
        postCollections.push({
            id: data.collection,
            title: data.collection,
            parent: "",
            posts: []
        });
    }

    let collection = postCollections.find(c => c.id == data.collection);
    collection?.posts.push(path.basename(i).split('.')[0]);
});

postCollections.forEach(c =>
{
    let index = existingData.findIndex(i => i.id == c.id);
    if (index < 0)
    {
        // add new collections to all
        existingData.push(c);
    }
    else
    {
        // update existing collection's posts
        existingData[index].posts = c.posts;
    }
});

// remove unused collections from all
existingData = existingData.filter(i => postCollections.findIndex(c => i.id == c.id) >= 0);

// write new all file
fs.writeFileSync(allFile, JSON.stringify(existingData, null, 4));