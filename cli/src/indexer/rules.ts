export function getTypescriptRules(): string {
	return `id: ts-jsdoc
language: TypeScript
rule:
  kind: comment
  regex: "^\\\\/\\\\*\\\\*"
---
id: ts-export
language: TypeScript
rule:
  kind: export_statement
  has:
    kind: function_declaration
    stopBy: end
---
id: ts-export
language: TypeScript
rule:
  kind: export_statement
  has:
    kind: class_declaration
    stopBy: end
---
id: ts-export
language: TypeScript
rule:
  kind: export_statement
  has:
    kind: interface_declaration
    stopBy: end
---
id: ts-export
language: TypeScript
rule:
  kind: export_statement
  has:
    kind: type_alias_declaration
    stopBy: end
---
id: ts-export
language: TypeScript
rule:
  kind: export_statement
  has:
    kind: lexical_declaration
    stopBy: end
---
id: ts-export
language: TypeScript
rule:
  kind: export_statement
  has:
    kind: enum_declaration
    stopBy: end
---
id: ts-function
language: TypeScript
rule:
  kind: function_declaration
---
id: ts-class
language: TypeScript
rule:
  kind: class_declaration
---
id: ts-interface
language: TypeScript
rule:
  kind: interface_declaration`;
}

export function getPythonRules(): string {
	return `id: py-function
language: Python
rule:
  kind: function_definition
---
id: py-class
language: Python
rule:
  kind: class_definition
---
id: py-decorated
language: Python
rule:
  kind: decorated_definition`;
}

export function getRulesForLanguage(language: string): string | null {
	switch (language) {
		case "typescript":
		case "javascript":
			return getTypescriptRules();
		case "python":
			return getPythonRules();
		default:
			return null;
	}
}
