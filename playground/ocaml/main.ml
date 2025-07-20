let hello = "hello "
let world = "world"

let get_number () = 123

let _ = get_number ();;
let _ = print_endline world


type 'a parser = Parser of (string -> string * 'a)

