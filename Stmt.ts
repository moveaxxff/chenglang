import type { Omit } from "@prisma/client/runtime/library";
import type { Expr } from "./Expr";
import type { Token } from "./Token";
import type { Expression } from "typescript";



export interface BlockStmt {
  type: "Block";
  children: Stmt[];
}

export interface ExprStmt {
  type: "Expression";
  expr: Expr;
}

export interface DhindaStmt extends Omit<ExprStmt, "type"> {
  type: "Dhinda";
}

export interface DaiStmt extends Omit<ExprStmt, "type"> {
  type: "Dai";
  thenStmt: Stmt;
  branchStmt?: Stmt;
}

export interface ChengStmt extends Omit<ExprStmt, "type"> {
  type: "Cheng";
  name: Token;
}


export type Stmt = BlockStmt | DaiStmt | ExprStmt | ChengStmt | DhindaStmt;

export function BlockStmt(statements: Stmt[]): Stmt {
  return { type: "Block", children: statements };
}

export function DaiStmt(expr: Expr, thenStmt: Stmt, branchStmt?: Stmt): Stmt {
  return { type: "Dai", expr, thenStmt, branchStmt };
}

export function DhindaStmt(expr: Expr): Stmt {

  return { type: "Dhinda", expr };

}

export function ExpressionStmt(expr: Expr): Stmt {

  return { type: "Expression", expr };

}

export function ChengStmt(name: Token, expr: Expr): Stmt {
  return { type: "Cheng", name: name, expr, }
}
