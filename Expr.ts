import { Token } from './Token';

export type ExprType = "Binary" | "Grouping" | "Literal" | "Unary" | "Variable" | "Assign" | "Logical";

export interface Expr {
  type: ExprType;
  left?: Expr;
  operator?: Token;
  right?: Expr;
  expression?: Expr;
  value?: any;
  func?: () => any
}

export function BinaryExpr(left: Expr, operator: Token, right: Expr): Expr {
  return { type: "Binary", left, operator, right, func: () => Parenthesis(operator.lexeme, [left, right]) };
}

export function LogicalExpr(left: Expr, operator: Token, right: Expr): Expr {
  return { type: "Binary", left, operator, right, func: () => Parenthesis(operator.lexeme, [left, right]) };
}

export function AssignExpr(name: Token, assigment: Expr): Expr {
  return { type: "Assign", right: assigment, operator: name, func: () => Parenthesis(name.lexeme, [assigment]) }
}

export function ChengExpr(name: Token): Expr {
  return { type: "Variable", operator: name }
}

export function LiteralExpr(value: any): Expr {
  return { type: "Literal", value };
}

export function UnaryExpr(operator: Token, right: Expr): Expr {
  return { type: "Unary", operator, right, func: () => Parenthesis(operator.lexeme, [right]) };
}

export function GroupingExpr(expression: Expr): Expr {
  return { type: "Grouping", expression, func: () => Parenthesis("group", [expression]) };
}

export function PrintAST(expr: Expr) {
  return console.log(expr.func ? expr.func() : expr.value);
}

export function Parenthesis(name: string, expressions: Expr[]) {


  let content = "";

  content += "(";
  content += name;

  for (const expression of expressions) {
    content += " ";
    content += expression.func ? expression.func() : expression.value;
  }
  content += ")";

  return content
}


