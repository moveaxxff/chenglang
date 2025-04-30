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

export interface _Stmt {

  type: StmtType;
  expr?: Expr;
  name?: Token;
}

export interface BlockStmt {
  children: Stmt[];
}

export interface ExprStmt {
  expr: Expr;
}

export interface DaiStmt extends ExprStmt {
  thenStmt: Stmt;
  branchStmt?: Stmt;
}

export interface ChengStmt extends ExprStmt {
  name: Token;
}


export type Stmt = BlockStmt | DaiStmt | ExprStmt | ChengStmt;

export function BlockStmt(statements: Stmt[]): Stmt {
  return { children: statements };
}

export function DaiStmt(expr: Expr, thenStmt: Stmt, branchStmt?: Stmt): Stmt {
  return { expr, thenStmt, branchStmt };
}

export function DhindaStmt(expr: Expr): Stmt {

  return { expr };

}

export function ExpressionStmt(expr: Expr): Stmt {

  return { expr };

}

export function ChengStmt(name: Token, expr: Expr): Stmt {
  return { name: name, expr, }
}
