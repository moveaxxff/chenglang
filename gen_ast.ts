import { OutputFileType } from 'typescript';
import { parseArgs } from 'util'

const { positionals, values } = parseArgs({
  args: Bun.argv,
  options: {
    file_name: {
      type: "string",
      short: "f",
      long: "file_name",
      description: "file output"
    }
  },
  strict: true,
  allowPositionals: true
})

function defineType(output: string, className: string, baseName: string, fields: string) {

  output += "\nexport class " + className + " extends " + baseName + " {\n";

  for (const field of fields.split(",")) {
    const name = field.split(":")[0]?.trim();
    const type = field.split(":")[1]?.trim();
    if (name && type) {
      output += "   " + name + ": " + type + ";\n";
    }
  }
  output += "\n";
  output += "   " + "constructor" + "(" + fields + ")" + "{\n";

  output += "     super();\n";

  for (const field of fields.split(",")) {
    const name = field.split(":")[0]?.trim();
    if (name) {
      output += "     this." + name + " = " + name + ";\n";
    }
  }

  output += "   }\n";
  output += "\n}\n";

  return output;
}

async function defineAst(outputDir: string, baseName: string, types: string[]) {
  const path = `${outputDir}/${baseName}.ts`;

  let output = "import { Token } from './Token';\n\n";

  output += "export abstract class " + baseName + " {\n";

  output += "}\n";
  for (const type of types) {
    const className = type.split("|")[0]?.trim();
    const fields = type.split("|")[1]?.trim();

    if (className && fields) {
      output = defineType(output, className, baseName, fields);
    }

  }


  await Bun.write(path, output);

}

async function main() {

  if (!values.file_name) {
    console.error("Please provide an output file name");
    return;
  }

  await defineAst(values.file_name, "Expr", [
    "Binary | left: Expr, operator: Token, right: Expr",
    "Grouping | expression: Expr",
    "Literal | value: any",
    "Unary | operator: Token, right: Expr"
  ])

}

main();

