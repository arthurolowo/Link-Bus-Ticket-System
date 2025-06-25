import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

async function updateImports(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    if (file.isDirectory()) {
      await updateImports(join(dir, file.name));
      continue;
    }
    
    if (!file.name.endsWith('.tsx')) continue;
    
    const filePath = join(dir, file.name);
    let content = await readFile(filePath, 'utf8');
    
    // Calculate relative path to src directory
    const relativePath = relative(dir, 'src').replace(/\\/g, '/');
    
    // Update imports
    content = content
      .replace(/from "@\/lib\/utils"/g, `from "${relativePath}/lib/utils"`)
      .replace(/from "@\/components\/ui\/([^"]+)"/g, (_, name) => {
        const isInUiDir = dir.includes('components/ui') || dir.includes('components\\ui');
        return isInUiDir ? `from "./${name}"` : `from "./ui/${name}"`;
      })
      .replace(/from "@\/hooks\/([^"]+)"/g, `from "${relativePath}/hooks/$1"`)
      .replace(/from "@\/types"/g, `from "${relativePath}/types"`);
    
    await writeFile(filePath, content);
  }
}

updateImports('src'); 