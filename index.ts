import { parseArgs } from 'util'
import { TokenType, Token } from './Token';
import { BinaryExpr, GroupingExpr, LiteralExpr, PrintAST, UnaryExpr, type Expr } from './Expr';
import { parse } from 'path';

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
    return this.equality();
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

      console.log(this.next())

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

    if (this.match([TokenType.LEFT_PAREN])) {
      const expr: Expr = this.tenary();

      if (this.match([TokenType.COMMA])) {
        return this.tenary()
      }

      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression");
      return GroupingExpr(expr);
    }

    throw ParseError(this.peek(), "Expect expression.");

  }

  parse(): Expr | null {

    try {
      return this.commaSeries();
    } catch (e) {
      return null;
    }

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

function InterpretExpr(expr: Expr): any {

  const isEqual = (a: any, b: any) => {
    return a === b;
  }

  switch (expr.type) {
    case 'Literal':
      return expr.value;
    case 'Grouping':
      {
        if (expr?.expression !== undefined) {
          return InterpretExpr(expr.expression)
        } else {
          return undefined
        }
      }
    case 'Binary':
      {
        let left: Expr | undefined = undefined;
        let right: Expr | undefined = undefined;
        if (expr.left !== undefined) {
          left = InterpretExpr(expr.left)
        }

        if (expr.right !== undefined) {
          right = InterpretExpr(expr.right);
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
              return Number(left) * Number(right);
            case TokenType.SLASH:
              return Number(left) / Number(right);
            case TokenType.MINUS:
              return Number(left) - Number(right);
            case TokenType.EQUAL_EQUAL:
              return isEqual(left, right);
            case TokenType.BANG_EQUAL:
              return !isEqual(left, right);
            case TokenType.PLUS:
              {
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
          right = InterpretExpr(expr.right)
        }
        if (right !== undefined) {

          if (expr.operator === undefined)
            return null;
          if (expr.operator.type === undefined)
            return null

          switch (expr.operator.type) {
            case TokenType.MINUS:
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
    console.log(expression)
    console.log(InterpretExpr(expression))
    PrintAST(expression)
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

