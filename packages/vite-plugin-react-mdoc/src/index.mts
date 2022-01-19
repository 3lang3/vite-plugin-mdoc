import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import rehype from './remark/rehype.mjs';
import rehypeRaw from 'rehype-raw'
import slug from './remark/slug.mjs';
import language from './remark/language.mjs';
import meta from './remark/meta.mjs';
import pre from './remark/pre.mjs';
import code from './remark/code.mjs';
import jsxify from './remark/jsxify.mjs';

const ROOT = process.cwd();

const mdpath = path.join(ROOT, './src/demo.md');

const source = fs.readFileSync(mdpath, 'utf-8').toString();

const pluginOptions = {
  previewLangs: ['jsx', 'tsx'],
}

main();

async function main() {
  const processor = await unified()
    .use(remarkParse)
    .use(slug)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(meta)
    .use(language)
    .use(rehype)
    .use(rehypeRaw)
    .use(pre)
    .use(code)
    .data('fileAbsPath', mdpath)
    .data('viteConfig', 'a')
    .data('pluginOptions', pluginOptions);

  processor.use(jsxify);

  const file = processor.processSync(source);

  console.log(String(file));
}
