
export enum TokenType {
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
  QUESTION_MARK = "?",
  COLON = ":",

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
  BASA = "BASA", //func in english
  CHIN = "CHIN", //Chinangwa aka for
  DAI = "DAI", // if in english
  HAPANA = "HAPANA", // nil or null in english
  DHINDA = "DHINDA", // print in englis
  DZOKA = "DZOKA", // return in english
  MUBEREKI = "MUBEREKI", // super in english
  INO = "INO", // this in english
  CHENG = "CHENG", // let in english
  APO = "APO", // while in english
  PAMWE = "PAMWE", // else in english
  KUNYEPA = "KUNYEPA", // false in english 
  CHOKWADI = "CHOKWADI", // true in english
  EOF = "EOF"
}


export class Token {
  readonly literal: any;
  readonly line: number;
  readonly lexeme: string;
  readonly type: TokenType;
  constructor(type: TokenType, lexeme: string, line: number, literal: any) {
    this.line = line;
    this.lexeme = lexeme;
    this.type = type;
    this.literal = literal;
  }
}

