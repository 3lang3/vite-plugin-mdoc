import fs from 'fs';
import path from 'path';
import { createFilter } from '@rollup/pluginutils'
import { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { DemoType, Options } from './types';
import { markdownToDoc } from './markdownToDoc';

const PLUGIN_NAME = 'vite-plugin-react-mdoc';
const FILE_PATH_EXPORT_NAME = '___vitePluginReactMdocCodestring___';

let config: ResolvedConfig;

const cache: Map<string, DemoType[]> = new Map();
const importedIdSet: Map<string, string> = new Map();

const plugin = (userOptions: Options = {}): Plugin => {
  let server: ViteDevServer;
  let reactBabelPlugin: Plugin;

  const filter = createFilter(
    userOptions.include || /\.md$/,
    userOptions.exclude,
  )

  return {
    name: PLUGIN_NAME,
    configResolved(resolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
      reactBabelPlugin = resolvedConfig.plugins.find(el => el.name === 'vite:react-babel');
    },
    configureServer(_server) {
      server = _server;
    },
    resolveId(id) {
      const mat = id.match(/\.md\.VDOCDemo\d+\.(.*)\.(jsx|tsx)$/);
      if (mat && mat.length > 2) {
        const [, sourceIdBase64] = mat
        const sourceId = Buffer.from(sourceIdBase64, 'base64').toString('ascii')
        const idPath: string = id.startsWith(sourceId)
          ? id
          : path.join(config.root, id.substring(1));
        return idPath;
      }
    },
    load(id) {
      const mat = id.match(/\.md\.VDOCDemo(\d+)(\..*)\.(jsx|tsx)$/);
      if (mat && mat.length >= 2) {
        const [, index, sourceId, suffix] = mat;
        id = id.replace(sourceId, '');
        const mdFileName = id.replace(`.VDOCDemo${index}.${suffix}`, '');
        const demos = cache.get(mdFileName);
        const demo = demos?.[+index - 1];

        if (!demo) return null

        if (demo.filePath) {
          return {
            code: `import ${demo.name}, { ${FILE_PATH_EXPORT_NAME} } from '${
              demo.filePath
            }';\nexport default ${
              demo.name
            };\nexport const previewerProps = { code: ${FILE_PATH_EXPORT_NAME}, language: '${
              demo.language
            }', title: '${demo.title}', dependencies: ${JSON.stringify(demo.dependencies)} }`,
            map: { mappings: '' },
          };
        }

        return {
          code: `${demo.code};\nexport const previewerProps = {code: ${JSON.stringify(
            demo.code,
          )}, language: '${demo.language}', title: '${demo.title}', dependencies: ${JSON.stringify(
            demo.dependencies,
          )} }`,
          map: { mappings: '' },
        };
      }

      if (importedIdSet.has(id)) {
        const idSource = fs.readFileSync(id, 'utf8');
        return `${idSource}\n export const ${FILE_PATH_EXPORT_NAME} = ${JSON.stringify(idSource)}`;
      }
    },
    async transform(code, id) {
      if (filter(id)) {
        const { code: content, demos } = await markdownToDoc(code, id, reactBabelPlugin, config);
        cache.set(id, demos);
        demos.forEach(demo => {
          if (demo.filePath) {
            importedIdSet.set(demo.filePath, id);
          }
        });
        return { code: content };
      }
    },
    async handleHotUpdate(ctx) {
      if (filter(ctx.file)) {
        const source = await ctx.read();
        const { demos } = await markdownToDoc(source, ctx.file, reactBabelPlugin, config);
        cache.set(ctx.file, demos);
        const updateModules: ModuleNode[] = [];
        demos.forEach(demo => {
          if (demo.filePath) return;
          const mods = server.moduleGraph.getModulesByFile(demo.id) || [];
          updateModules.push(...mods);
        });
        return [...ctx.modules, ...updateModules];
      }
    },
  };
};

export default plugin;
