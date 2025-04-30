import { parseArgs } from 'util'
import { TokenType, Token } from './Token';
import { AssignExpr, BinaryExpr, ChengExpr, GroupingExpr, LiteralExpr, LogicalExpr, PrintAST, UnaryExpr, type Expr } from './Expr';
import { BlockStmt, ChengStmt, DaiStmt, DhindaStmt, ExpressionStmt, StmtType, type Stmt } from './Stmt';
import { env } from 'process';

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    file: {
      type: "string",
      short: "f",
      long: "file",
      description: "The file to execute"
    }
  },
  strict: true,
  allowPositionals: true
})

class RuntimeException extends Error {
  token: Token;
  constructor(operator: Token, message: string) {
    super(message);
    this.name = "RuntimeException";
    this.token = operator;
  }
}

class Environment {

  private enclosing?: Environment = undefined;

  private variables: Map<string, any> = new Map()
  private tokens: Map<string, Token> = new Map();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  get(name?: Token): any {

    if (name === undefined) {
      return undefined;
    }


    if (this.variables.has(name.lexeme)) {
      return this.variables.get(name.lexeme);
    }

    if (this.enclosing !== undefined) {
      if (this.enclosing.variables.has(name.lexeme)) {
        return this.enclosing.variables.get(name.lexeme);
      }
    }


    throw new RuntimeException(name, `Undefined variable '${name.lexeme}.'`)

  }

  assign(name: Token, value: any) {
    if (!this.variables.has(name.lexeme)) {
      throw new RuntimeException(name, `Undefined variable '${name.lexeme}'`)
    }

    this.variables.set(name.lexeme, value);
  }

  define(name: Token, value: any): void {
    if (this.variables.has(name.lexeme)) {
      const token = this.tokens.get(name.lexeme);
      console.error(`previous definition of '${name.lexeme}' at [line ${token?.line}]`)
      throw new RuntimeException(name, `redefinition of '${name.lexeme}'`)

    }

    this.tokens.set(name.lexeme, name);
    this.variables.set(name.lexeme, value);
  }
}

function CheckNumberOperand(token: Token, operand: any) {
  if (typeof operand === "number") return;
  throw new RuntimeException(token, "Operand must be a number.");
}

function CheckNumberOperands(token: Token, left: any, right: any) {

  if (typeof left === "number" && typeof right === "number") return;

  throw new RuntimeException(token, "Operands must be numbers");

}

function ParseError(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
    report(token.line, " at end", message)
  } else {
    report(token.line, " at '" + token.lexeme + "'", message)
  }
}

class Scanner {
  source: string = "";
  tokens: Token[] = [];
  line: number = 1;
  start: number = 0;
  current: number = 0;
  keywords = new Map<string, TokenType>([
    ["kirasi", TokenType.KIRASI],
    ["kana", TokenType.KANA],
    ["ne", TokenType.NE],
    ["kunyepa", TokenType.KUNYEPA],
    ["basa", TokenType.BASA],
    ["chin", TokenType.CHIN],
    ["dai", TokenType.DAI],
    ["hapana", TokenType.HAPANA],
    ["dhinda", TokenType.DHINDA],
    ["dzoka", TokenType.DZOKA],
    ["mubereki", TokenType.MUBEREKI],
    ["ino", TokenType.INO],
    ["chokwadi", TokenType.CHOKWADI],
    ["cheng", TokenType.CHENG],
    ["apo", TokenType.APO],
    ["pamwe", TokenType.PAMWE]
  ])


  constructor(source: string) {
    this.source = source;
  }

  private advance() {
    this.current++;
    return this.source.charAt(this.current - 1);
  }

  private string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == '\n') this.line++;
      this.advance();
    }
    if (this.isAtEnd()) {
      error(this.line, "Unterminated string.");
      return;
    }
    this.advance();
    const text = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, text);
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9';
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '?':
        this.addToken(TokenType.QUESTION_MARK)
        break;
      case ':':
        this.addToken(TokenType.COLON);
        break;
      case '*':
        this.addToken(TokenType.STAR);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case '"':
        this.string();
        break;
      case '/':
        if (this.match('/')) {
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('*')) {
          while (this.peek() != '*' && this.peekNext() != '/' && !this.isAtEnd()) {
            if (this.peek() == '\n') this.line++;
            this.advance();
          }
          if (this.isAtEnd()) {
            error(this.line, "Unterminated block comment.");
            return;
          }
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          error(this.line, "Unexpected character.");
        }
    }
  }

  isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
  }

  identifier() {

    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    const tokenType: TokenType | undefined = this.keywords.get(text);
    this.addToken(tokenType ?? TokenType.IDENTIFIER)
  }

  isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0'
    return this.source.charAt(this.current + 1);
  }

  number() {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() == '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
  }

  peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  match(c: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != c) return false;
    this.current++;
    return true;
  }

  isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType, literal?: any) {
    this.tokens.push(new Token(type, this.source.substring(this.start, this.current), this.line, literal));
  }
  scanTokens(): Token[] {

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", this.line, null));
    return this.tokens;
  }

}

class Parser {
  current: number = 0;
  tokens: Token[] = [];
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private expression(): Expr {
    return this.assignment();
  }


  private ne(): Expr {
    let expr = this.equality();

    while (this.match([TokenType.NE])) {
      const operator = this.previous();
      const right = this.equality();
      expr = LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private kana(): Expr {
    let expr = this.ne();

    while (this.match([TokenType.KANA])) {
      const operator = this.previous();
      const right = this.ne();
      expr = LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private assignment(): Expr {

    const expr: Expr = this.kana();


    if (this.match([TokenType.EQUAL])) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr.type === "Variable") {
        const name = expr.operator;
        if (name === undefined) {
          throw new Error("Chenglang error.");
        }
        return AssignExpr(name, value);
      }


      throw new RuntimeException(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private equality(): Expr {
    let expr: Expr = this.comparison();

    while (this.match([TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL])) {
      let operator: Token = this.previous();
      let right: Expr = this.comparison();
      expr = BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr: Expr = this.term();

    while (this.match([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL])) {
      const operator: Token = this.previous();
      const right: Expr = this.term();
      expr = BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private match(types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private term(): Expr {
    let expr: Expr = this.factor();

    while (this.match([TokenType.MINUS, TokenType.PLUS])) {

      const operator: Token = this.previous();
      const right: Expr = this.factor();
      expr = BinaryExpr(expr, operator, right);
    }
    return expr;
  }

  private factor(): Expr {
    let expr: Expr = this.unary();
    while (this.match([TokenType.SLASH, TokenType.STAR])) {
      const operator: Token = this.previous();
      const right: Expr = this.unary();
      expr = BinaryExpr(expr, operator, right);
    }

    return expr;

  }

  private tenary(): Expr {
    let left = this.expression();
    while (this.match([TokenType.QUESTION_MARK, TokenType.COLON])) {

      const token: Token = this.previous();
      const right = this.expression();
      left = BinaryExpr(left, token, right);
    }

    return left;
  }

  private unary(): Expr {

    if (this.match([TokenType.BANG, TokenType.MINUS])) {
      const operator: Token = this.previous();
      const right: Expr = this.unary();
      return UnaryExpr(operator, right);
    }

    return this.primary();

  }

  private commaSeries() {
    let expr = this.tenary();
    while (this.match([TokenType.COMMA])) {
      expr = this.tenary();
    }
    return expr;
  }

  private primary(): Expr {

    if (this.match([TokenType.KUNYEPA])) return LiteralExpr(false);
    if (this.match([TokenType.CHOKWADI])) return LiteralExpr(true);
    if (this.match([TokenType.HAPANA])) return LiteralExpr(null);

    if (this.match([TokenType.NUMBER, TokenType.STRING])) {
      return LiteralExpr(this.previous().literal)
    }

    if (this.match([TokenType.IDENTIFIER])) {
      return ChengExpr(this.previous());
    }

    if (this.match([TokenType.COMMA])) {
      return this.commaSeries()
    }


    if (this.match([TokenType.LEFT_PAREN])) {
      const expr: Expr = this.commaSeries();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression");
      return GroupingExpr(expr);
    }

    throw ParseError(this.peek(), "Expect expression.");

  }

  statement(): Stmt {

    if (this.match([TokenType.DAI])) return this.daiStatement();
    if (this.match([TokenType.DHINDA])) return this.dhindaStatement();
    if (this.match([TokenType.LEFT_BRACE])) {
      return BlockStmt(this.block());
    };

    return this.expressionStatement();

  }

  daiStatement(): Stmt {
    const condition = this.expression();

    let daiStmt: Stmt = this.statement();
    let pamweStmt: Stmt | undefined = undefined;

    if (this.match([TokenType.PAMWE])) {
      pamweStmt = this.statement();
    }

    return DaiStmt(condition, daiStmt, pamweStmt);
  }

  private block(): Stmt[] {

    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE)) {
      const declaration = this.declaration();
      if (declaration !== null) {
        statements.push(declaration);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

    return statements;
  }

  private dhindaStatement(): Stmt {
    const value = this.commaSeries();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return DhindaStmt(value);
  }




  private expressionStatement(): Stmt {
    const value = this.commaSeries();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return ExpressionStmt(value);
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {

      const declaration = this.declaration();
      if (declaration) {
        statements.push(declaration);
      }
    }

    return statements;

  }

  private declaration(): Stmt | null {

    try {
      if (this.match([TokenType.CHENG])) {
        return this.chengDeclaration();
      }
      return this.statement()
    } catch (e) {
      this.synchronize();
      return null;
    }
  }

  private chengDeclaration(): Stmt {

    const name: Token = this.consume(TokenType.IDENTIFIER, "Expect a variable name");

    let initializer: Expr | undefined = undefined;

    if (this.match([TokenType.EQUAL])) {
      initializer = this.commaSeries();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after cheng declaration.");

    if (initializer === undefined)
      error(name.line, "initializer is undefined")

    return ChengStmt(name, initializer)

  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw ParseError(this.peek(), message);
  }

  private synchronize(): void {

    this.advance()

    while (!this.isAtEnd()) {

      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.KIRASI:
        case TokenType.BASA:
        case TokenType.CHENG:
        case TokenType.CHIN:
        case TokenType.DAI:
        case TokenType.APO:
        case TokenType.DHINDA:
        case TokenType.DZOKA:
          return;
      }
      this.advance();
    }

  }



  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current += 1;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens.at(this.current) as Token;
  }

  private next(): Token {
    return this.tokens.at(this.current + 1) as Token;
  }

  private previous(): Token {
    return this.tokens.at(this.current - 1) as Token;
  }

}

function error(line: number, message: string) {
  report(line, "", message);
}

function report(line: number, where: string, message: string) {
  console.error(`[Line ${line}] Error ${where}: ${message}`)
}

function RuntimeError(error: RuntimeException) {
  console.error(`${error.message} [line ${error?.token?.line}]`)
}

function InterpretStmts(stmts: Stmt[]): void {

  const environment = new Environment();

  for (const stmt of stmts) {
    InterpretStmt(stmt, { environment });
  }

  console.log(environment)
}

function InterpretStmt(stmt: Stmt, { environment }: { environment: Environment }): void {


  switch (stmt.type) {
    case StmtType.Dai:

      if (stmt.thenStmt === undefined)
        return;

      if (InterpretExpr({ environment }, stmt.expr)) {
        InterpretStmt(stmt.thenStmt, { environment });
      } else if (stmt.branchStmt !== undefined) {
        InterpretStmt(stmt.branchStmt, { environment });
      }
      break;
    case StmtType.Block:
      const blockEnv = new Environment(environment);
      if (stmt.children === undefined) return;
      for (const child of stmt.children) {
        InterpretStmt(child, { environment: blockEnv });
      }
      break;
    case StmtType.Cheng:
      const value = InterpretExpr({ environment }, stmt.expr);
      if (stmt.name && value) {
        environment.define(stmt.name, value)
      }
      break;
    case StmtType.Expression:
      InterpretExpr({ environment }, stmt.expr)
      break;
    case StmtType.Dhinda:
      console.log(InterpretExpr({ environment }, stmt.expr));
      break;
  }

}

function InterpretExpr({ environment }: { environment: Environment }, expr?: Expr): any {

  const isEqual = (a: any, b: any) => {
    return a === b;
  }

  if (expr === undefined) {
    return undefined;
  }



  switch (expr.type) {
    case 'Logical':
      if (expr.left === undefined)
        return undefined;
      if (expr.right === undefined)
        return undefined;
      if (expr.operator === undefined)
        return undefined

      const left = InterpretExpr({ environment }, expr.left);
      if (expr.operator.type === TokenType.KANA) {
        if (left) return left;
      } else {
        if (!left) return left;
      }
      const right = InterpretExpr({ environment }, expr.right);
      return right;
    case 'Assign':
      if (expr.operator === undefined)
        return undefined;
      if (expr.right === undefined)
        return undefined;
      return environment.assign(expr.operator, InterpretExpr({ environment }, expr.right));
    case 'Variable':
      return environment.get(expr.operator);
    case 'Literal':
      return expr.value;
    case 'Grouping':
      {
        if (expr?.expression !== undefined) {
          return InterpretExpr({ environment }, expr.expression)
        } else {
          return undefined
        }
      }
    case 'Binary':
      {
        let left: Expr | undefined = undefined;
        let right: Expr | undefined = undefined;
        if (expr.left !== undefined) {
          left = InterpretExpr({ environment }, expr.left)
        }

        if (expr.right !== undefined) {
          right = InterpretExpr({ environment }, expr.right);
        }

        if (left !== undefined && right !== undefined) {

          if (expr.operator === undefined)
            return undefined;
          if (expr.operator.type === undefined)
            return undefined;
          switch (expr.operator.type) {

            case TokenType.GREATER:
              return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
              return Number(left) >= Number(right);
            case TokenType.LESS:
              return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
              return Number(left) <= Number(right);
            case TokenType.STAR:
              CheckNumberOperands(expr.operator, left, right);
              return Number(left) * Number(right);
            case TokenType.SLASH:
              CheckNumberOperands(expr.operator, left, right);
              return Number(left) / Number(right);
            case TokenType.MINUS:
              CheckNumberOperands(expr.operator, left, right);
              return Number(left) - Number(right);
            case TokenType.EQUAL_EQUAL:
              return isEqual(left, right);
            case TokenType.BANG_EQUAL:
              return !isEqual(left, right);
            case TokenType.PLUS:
              {
                if (typeof left === "boolean" && typeof right === "string")
                  return Boolean(left) + String(right);
                if (typeof left === "string" && typeof right === "boolean")
                  return String(left) + Boolean(right);
                if (typeof left === "number" && typeof right === "string")
                  return Number(left) + String(right);
                if (typeof left === "string" && typeof right === "number")
                  return String(left) + Number(right);
                if (typeof left === "number" && typeof right === "number")
                  return Number(left) + Number(right);
                if (typeof left === "string" && typeof right === "string")
                  return String(left) + String(right);
              }
          }
        }
      }
      return undefined;
    case 'Unary':
      {
        let right: Expr | undefined = undefined;
        if (expr.right !== undefined) {
          right = InterpretExpr({ environment }, expr.right)
        }
        if (right !== undefined) {

          if (expr.operator === undefined)
            return null;
          if (expr.operator.type === undefined)
            return null

          switch (expr.operator.type) {
            case TokenType.MINUS:
              CheckNumberOperand(expr.operator, right);
              return -Number(right)
            case TokenType.BANG:
              return !Boolean(right)
          }
        }
      }
  }

  return undefined
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  const expression = parser.parse();

  if (expression) {

    try {
      InterpretStmts(expression);
    } catch (e) {
      RuntimeError(e as RuntimeException);
    }

  }

}

async function main() {

  if (!values.file) {
    console.error("Please provide a file to execute");
    return;
  }


  const file = Bun.file(values.file);
  const source = await file.text();
  run(source);

}

main();

