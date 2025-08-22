import fs from 'fs';
import path from 'path';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

let allCollections = JSON.parse(fs.readFileSync(import.meta.dirname + "/static/collections/all.json"));
let allPosts = [];

allCollections.forEach(i => {
	i.posts.forEach(p => {
		allPosts.push(`/blog/post/${p}`);
	});
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ["/", ...allPosts]
		},
		paths: {
			base: process.argv.includes('dev') ? '' : "/travel-blog"
		}
	}
};

export default config;
