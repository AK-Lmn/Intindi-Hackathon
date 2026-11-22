const fenceLabels = new Map([
  ["js", "JavaScript"], ["javascript", "JavaScript"], ["jsx", "JSX"],
  ["ts", "TypeScript"], ["typescript", "TypeScript"], ["tsx", "TSX"],
  ["py", "Python"], ["python", "Python"], ["sql", "SQL"],
  ["html", "HTML"], ["css", "CSS"], ["json", "JSON"],
  ["sh", "Shell"], ["bash", "Shell"], ["shell", "Shell"],
  ["ps1", "PowerShell"], ["powershell", "PowerShell"],
  ["go", "Go"], ["rs", "Rust"], ["rust", "Rust"],
  ["java", "Java"], ["c", "C"], ["cpp", "C++"],
  ["cs", "C#"], ["csharp", "C#"], ["rb", "Ruby"], ["ruby", "Ruby"],
  ["php", "PHP"], ["kt", "Kotlin"], ["kotlin", "Kotlin"], ["swift", "Swift"],
]);

const jsxComponent = /<[A-Z][\w.]*(?:\s[^<>]*)?\/\s*>|<([A-Z][\w.]*)(?:\s[^<>]*)?>[\s\S]*?<\/\1\s*>/;
const jsxAttribute = /<[a-z][\w-]*\s+[^<>]*(?:\bclassName\s*=|\b[\w-]+\s*=\s*\{)[^<>]*>/;
const jsxExpression = /<[a-z][\w-]*(?:\s[^<>]*)?>\s*\{[^{}\r\n]+\}\s*<\/[a-z][\w-]*>/;
const typescriptSyntax = /^\s*(?:(?:export\s+)?interface\s+\w+(?:\s+extends\s+[^\n{]+)?\s*\{|(?:export\s+)?type\s+\w+\s*=|(?:const|let)\s+\w+\s*:\s*(?:string|number|boolean|unknown|never|[A-Z]\w*(?:\.\w+)?)(?:\[\])?[ \t]*(?:=|;?[ \t]*$)|(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^\r\n]*\)\s*:\s*\w)/m;

const signatures: ReadonlyArray<readonly [string, RegExp]> = [
  ["Python", /^#![^\r\n]*\bpython(?:\d+(?:\.\d+)*)?\b/],
  ["HTML", /^(?:<!doctype\s+html\b|<!--|<(?:html|head|body|main|div|span|p|form|button|script|section|a|img)(?:\s[^<>]*)?\/?>)/i],
  ["PHP", /^<\?php\b/i],
  ["Shell", /^#![^\r\n]*\b(?:bash|zsh|sh)\b|^\s*(?:export\s+[A-Z_]\w*=|set\s+-[a-z]+\s*$)/m],
  ["PowerShell", /^\s*(?:\$[\w:]+\s*=\s*)?(?:Get|Set|New|Remove|Write|Invoke|Test|Select|Import|Out)-[A-Z][A-Za-z]+\b/m],
  ["Python", /^\s*(?:(?:async\s+)?def\s+\w+\s*\([^\n]*\)(?:\s*->\s*[^:\n]+)?\s*:|elif\s+[^:\n]+:|for[ \t]+\w+[ \t]+in[ \t]+[^\r\n]+:[ \t]*$|import[ \t]+(?:os|sys|math|json|re|pathlib|typing|datetime|random|numpy|pandas)(?:[ \t]+as[ \t]+\w+)?[ \t]*(?:#.*)?$|from\s+[\w.]+\s+import\s+\w+|print\([ \t]*f["']|\w+[ \t]*=[ \t]*(?:int|float)\([ \t]*input\()/m],
  ["SQL", /^\s*(?:select\b[\s\S]*?\bfrom\s+[\w"`\[]|select\s+(?:\d+|null)\s*;?$|insert\s+into\b|update\s+\S+\s+set\b|delete\s+from\b|create\s+table\b|with[ \t]+\w+[ \t]+as[ \t]*\([ \t\r\n]*select\b)/im],
  ["Swift", /^[ \t]*(?:import[ \t]+(?:Foundation|SwiftUI|UIKit)[ \t]*$|@(?:State|Binding|Published)\b|func[ \t]+\w+[ \t]*\([^\r\n)]*\)[ \t]*->[ \t]*\w)/m],
  ["Go", /^\s*(?:package\s+main\s*$|func\s+\w+\s*\(|fmt\.(?:Println|Printf|Sprintf)\()/m],
  ["Rust", /^\s*(?:fn\s+\w+\s*\(|let\s+mut\s+\w+|use\s+std::|(?:println|vec|format)!\s*[(\[])/m],
  ["C++", /^\s*#include\s*<(?:iostream|vector|string|memory|algorithm)>|\bstd::\w+/m],
  ["C", /^\s*#include\s*<(?:stdio|stdlib|stdint|string)\.h>|^\s*int\s+main\s*\(\s*void\s*\)/m],
  ["Java", /^\s*(?:import\s+java\.|(?:public\s+)?static\s+void\s+main\s*\(\s*String\s*\[\s*\]|System\.out\.)/m],
  ["C#", /^\s*(?:using\s+System\b|Console\.(?:WriteLine|ReadLine)\s*\()/m],
  ["Kotlin", /^[ \t]*(?:(?:suspend[ \t]+)?fun[ \t]+\w+[ \t]*\(|import[ \t]+kotlin\.)/m],
  ["Ruby", /^\s*(?:puts\s+["']|require_relative\s+["'])/m],
  ["TypeScript", typescriptSyntax],
  ["JavaScript", /^\s*(?:(?:export\s+)?(?:const|let|var)\s+\w+\s*=|(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(|console\.(?:log|error|warn|info)\s*\(|import[ \t]+[^\r\n]+[ \t]+from[ \t]+["']|export[ \t]+default[ \t]+)|\.(?:map|filter|reduce|forEach)\(\s*\(?[\w\s,]+\)?\s*=>/m],
  ["CSS", /^\s*(?:@media\s+[^\n{]+|[:.#][\w-]+|body|html)\s*\{\s*[\w-]+\s*:/m],
];

export function detectCodeLanguage(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  const fence = text.match(/^(?:`{3,}|~{3,})[ \t]*([\w+#-]+)[ \t]*\r?\n/);
  if (fence) return fenceLabels.get(fence[1].toLowerCase()) ?? null;
  const snippet = text.replace(/^(?:```|~~~)[ \t]*\r?\n/, "").replace(/\r?\n(?:```|~~~)$/, "");

  if (/^[\[{]/.test(snippet)) {
    try {
      JSON.parse(snippet);
      // A bare numeric array also works in several programming languages.
      if (snippet.startsWith("{") || /^\[\s*\{/.test(snippet)) return "JSON";
    } catch {
      // Check non-JSON syntax below.
    }
  }

  if (jsxComponent.test(snippet) || jsxAttribute.test(snippet) || jsxExpression.test(snippet)) {
    return typescriptSyntax.test(snippet) ? "TSX" : "JSX";
  }

  return signatures.find(([, pattern]) => pattern.test(snippet))?.[0] ?? null;
}
