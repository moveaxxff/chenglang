import { type } from "os";
import type { Expr } from "./Expr";

export enum StmtType {
  Expression,
  Dhinda
}

export interface Stmt {

  type: StmtType;
  expr: Expr;
}

export function DhindaStmt(expr: Expr): Stmt {

  return { type: StmtType.Dhinda, expr };

}

export function ExpressionStmt(expr: Expr): Stmt {

  return { type: StmtType.Expression, expr };

}
