import { parseArgs } from 'util'

const { positionals, values } = parseArgs({
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

enum TokenType {
  LEFT_PAREN = "(",
  RIGHT_PAREN = ")",
  LEFT_BRACE = "{",
  RIGHT_BRACE = "}",
  COMMA = ",",
  DOT = ".",
  MINUS = "-",
  PLUS = "+",
  SEMICOLON = ";",
  SLASH = "/",
  STAR = "*",

  // One or two character tokens.
  BANG = "!",
  BANG_EQUAL = "!=",
  EQUAL = "=",
  EQUAL_EQUAL = "==",
  GREATER = ">",
  GREATER_EQUAL = ">=",
  LESS = "<",
  LESS_EQUAL = "<=",

  // Literals.
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",

  // Keywords.
  KIRASI = "KIRASI", //class in english
  KANA = "KANA", // or in english
  NE = "NE", //  AND in english
  MANYEPO = "MANYEPO", // false in english
  BASA = "BASA", //func in english
  CHIN = "CHIN", //Chinangwa aka for
  DAI = "DAI", // if in english
  HAPANA = "HAPANA", // nil or null in english
  DHINDA = "DHINDA", // print in englis
  DZOKA = "DZOKA", // return in english
  MUBEREKI = "MUBEREKI", // super in english
  INO = "INO", // this in english
  CHOKWADI = "CHOKWADI", // true in english
  CHENG = "CHENG", // let in english
  APO = "APO", // while in english

  EOF = "EOF"
}

class Token {
  readonly literal: any;
  readonly line: number;
  readonly lexeme: String;
  readonly type: TokenType;
  constructor(type: TokenType, lexeme: String, line: number, literal: any) {
    this.line = line;
    this.lexeme = lexeme;
    this.type = type;
    this.literal = literal;
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
    ["manyepo", TokenType.MANYEPO],
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
    ["apo", TokenType.APO]
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
        if (this.match('*')) {
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
        }
        break;
      case '/':
        if (this.match('/')) {
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
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
    if (this.keywords.has(text)) {
      this.addToken(this.keywords.get(text)!);
      return;
    }

    this.addToken(TokenType.IDENTIFIER)
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

function error(line: number, message: string) {
  report(line, "", message);
}

function report(line: number, where: string, message: string) {
  console.error(`[Line ${line}] Error ${where}: ${message}`)
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  for (const token of tokens) {
    console.log(token)
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

