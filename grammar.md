expression -> literal
            | unary
            | binary
            | grouping ;

literal -> NUMBER  | STRING | CHOKWADI | KUNYEPA | HAPANA ;
grouping -> '(' expression ')' ;
unary -> ( '-' | '!' ) expression ;
binary -> expression operator expression ;
operator -> '+' | '-' | '*' | '/' | '>' | '>=' | '<' | '<=' | '==' | '!=' ;
