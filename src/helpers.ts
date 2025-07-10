import { basename } from "path";
import {
    CompilerOptions,
    createPrinter,
    EmitHint,
    findConfigFile,
    isArrowFunction,
    isFunctionExpression,
    isIdentifier,
    isRegularExpressionLiteral,
    isStringLiteral,
    NamedDeclaration,
    Node,
    parseJsonConfigFileContent,
    readConfigFile,
    sys,
    transpileModule,
} from "typescript";
import { TextDocument } from "vscode";
import { FunctionNode, RegexNode, StringNode } from "./shared";

export function hasName(node: NamedDeclaration, name: string) {
    return node.name && isIdentifier(node.name) && node.name.text === name;
}

export function isNotNull<T>(value: T): value is Exclude<T, null | undefined> {
    return value != null;
}

export function tryParseFunction(document: TextDocument, node: Node): FunctionNode | null {
    if (!isArrowFunction(node) && !isFunctionExpression(node)) return null;

    const code = createPrinter().printNode(EmitHint.Expression, node, node.getSourceFile());

    let compilerOptions: CompilerOptions = {};

    const tsConfigPath = findConfigFile(document.fileName, sys.fileExists);
    if (tsConfigPath) {
        const configFile = readConfigFile(tsConfigPath, sys.readFile);
        compilerOptions = parseJsonConfigFileContent(configFile.config, sys, basename(tsConfigPath)).options;
    }

    const res = transpileModule(code, { compilerOptions });
    if (res.diagnostics && res.diagnostics.length > 0) return null;

    return {
        type: "function",
        value: res.outputText,
    };
}

export function tryParseStringLiteral(node: Node): StringNode | null {
    if (!isStringLiteral(node)) return null;

    return {
        type: "string",
        value: node.text,
    };
}

export function tryParseRegularExpressionLiteral(node: Node): RegexNode | null {
    if (!isRegularExpressionLiteral(node)) return null;

    const m = node.text.match(/^\/(.+)\/(.*?)$/);
    return (
        m && {
            type: "regex",
            value: {
                pattern: m[1],
                flags: m[2],
            },
        }
    );
}
