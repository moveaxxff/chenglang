import { type } from "os";
import type { Expr } from "./Expr";
import type { Token } from "./Token";

export enum StmtType {
  Expression,
  Dhinda,
  Cheng,
  Block
}

export interface Stmt {

  type: StmtType;
  expr?: Expr;
  name?: Token;
  children?: Stmt[]
}

export function BlockStmt(statements: Stmt[]): Stmt {
  return { type: StmtType.Block, children: statements };
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
