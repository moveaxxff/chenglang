import { type } from "os";
import type { Expr } from "./Expr";
import type { Token } from "./Token";

export enum StmtType {
  Expression,
  Dhinda,
  Cheng
}

export interface Stmt {

  type: StmtType;
  expr?: Expr;
  name?: Token;
}

export function DhindaStmt(expr: Expr): Stmt {

  return { type: StmtType.Dhinda, expr };

}

export function ExpressionStmt(expr: Expr): Stmt {

  return { type: StmtType.Expression, expr };

}

export function ChengStmt(name: Token, initializer?: Expr) {
  return { name: name, type: StmtType.Cheng, expr: initializer, }
}
