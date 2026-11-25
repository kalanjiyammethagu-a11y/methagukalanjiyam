import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = path.resolve(rootDir, "src", specifier.slice(2));
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const parentDir = path.dirname(new URL(context.parentURL).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
      const base = path.resolve(parentDir, specifier);
      if (!existsSync(base)) {
        for (const ext of [".ts", ".tsx", "/index.ts"]) {
          if (existsSync(`${base}${ext}`)) {
            return { url: pathToFileURL(`${base}${ext}`).href, shortCircuit: true };
          }
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
