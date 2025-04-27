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
primary -> literal | grouping ;
unary -> ( '-' | '!' ) unary 
       | primary ;
factor -> factor ( '/' | '*' ) unary 
       | unary ;
factor -> unary ( ( "/" | "*" ) unary )* ;

expression -> equality ;
equality -> comparison ( ( "!=" | "==" ) comparison )* ;
comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term -> factor ( ( "-" | "+" ) factor )* ;
factor -> unary ( ( "/" | "*" ) unary )* ;
unary -> ( "!" | "-" ) unary 
       | primary ;
primary -> literal | grouping ;
comma-series -> unary "(" expression, ( "," expression )* ")"
tenary -> comparison "?" expression ":" expression tenary

program     ->  statement* EOF ;
statement   -> exprStmt
             | printStmt;
exprStmt    -> expression ";" ;
printStmt   -> "dhinda" expression ";" ;
