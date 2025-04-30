expression -> literal
            | unary
            | binary
            | grouping 
            | equality ;

literal -> NUMBER  | STRING | CHOKWADI | KUNYEPA | HAPANA ;
grouping -> '(' expression ')' ;
unary -> ( '-' | '!' ) expression ;
binary -> expression operator expression ;
operator -> '+' | '-' | '*' | '/' | '>' | '>=' | '<' | '<=' | '==' | '!=' ;
primary -> literal | grouping | IDENTIFIER ;
unary -> ( '-' | '!' ) unary 
       | primary ;
factor -> factor ( '/' | '*' ) unary 
       | unary ;
factor -> unary ( ( "/" | "*" ) unary )* ;


expression -> assignment ;

assignment -> IDENTIFIER "=" assignment | logic_kana ; 

equality -> comparison ( ( "!=" | "==" ) comparison )* ;
comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term -> factor ( ( "-" | "+" ) factor )* ;
factor -> unary ( ( "/" | "*" ) unary )* ;
unary -> ( "!" | "-" ) unary 
       | primary ;
primary -> literal | grouping ;
comma-series -> unary "(" expression, ( "," expression )* ")"
tenary -> comparison "?" expression ":" expression tenary

program     ->  declaration* EOF ;

declaration -> chengDecl 
             | statement ;
statement   -> exprStmt
             | daiStmt 
             | printStmt 
             | block ;

daiStmt     -> "dai"  expression* statement ( "pamwe"  statement )? ; 
logic_kana  -> logic_ne ( "kana" logic_ne )* ;
logic_ne    -> equality ( "ne" equality )* ;

block       -> "{" declaration* "}" ;
exprStmt    -> expression ";" ;
printStmt   -> "dhinda" expression ";" ;
chengDecl   -> "cheng" IDENTIFIER ( "="  expression )? ";" ;
