const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".cs": "C#",
  ".rb": "Ruby",
  ".php": "PHP",
  ".swift": "Swift",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".c": "C",
  ".h": "C/C++ Header",
  ".hpp": "C++ Header",
  ".md": "Markdown",
  ".mdx": "MDX",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".toml": "TOML",
  ".xml": "XML",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sql": "SQL",
  ".sh": "Shell",
  ".ps1": "PowerShell"
};

export function languageForExtension(extension: string): string | null {
  return LANGUAGE_BY_EXTENSION[extension.toLowerCase()] ?? null;
}

export function isSourceLanguage(language: string | null): boolean {
  return Boolean(language && !["Markdown", "JSON", "YAML", "TOML", "XML", "CSS", "SCSS"].includes(language));
}
