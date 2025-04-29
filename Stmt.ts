import { type } from "os";
import type { Expr } from "./Expr";
import type { Token } from "./Token";

export enum StmtType {
  Expression,
  Dhinda,
  Cheng,
  Block,
  Dai
}

export interface Stmt {

  type: StmtType;
  expr?: Expr;
  name?: Token;
  children?: Stmt[]
  thenStmt?: Stmt;
  branchStmt?: Stmt;
}


export function BlockStmt(statements: Stmt[]): Stmt {
  return { type: StmtType.Block, children: statements };
}

export function DaiStmt(expr: Expr, thenStmt: Stmt, branchStmt?: Stmt): Stmt {
  return { type: StmtType.Dai, expr, thenStmt, branchStmt };
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
