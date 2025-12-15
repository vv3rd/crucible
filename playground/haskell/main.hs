
main = do
    putStrLn $ unlines $ withBoldBorder $ withEqualPadding ["Greetings","World"]

withEqualPadding = withBorder paddingTemplate

withThinBorder = withBorder borderTemplateThin

withBoldBorder =  withBorder borderTemplateBold

borderTemplateThin = borderTemplate
   "┌─┐"
   "│ │"
   "└─┘" 

borderTemplateBold = borderTemplate
   "╔═╗"
   "║ ║"
   "╚═╝"

paddingTemplate = borderTemplate
   "   "
   "   "
   "   "

withBorder:: BorderTemplate -> [String] -> [String]
withBorder template lines = borderTop ++ map bordered lines ++ borderBottom
  where
    ((tl, tc, tr), (cl, cc, cr), (bl, bc, br)) = template
    maxLength = maximum (map length lines)
    boxWidth = maxLength + 2
    borderTop     = [tl : replicate boxWidth tc ++ [tr]]
    borderBottom  = [bl : replicate boxWidth bc ++ [br]]
    bordered line = [cl, cc] ++ line ++ replicate (maxLength - length line) cc ++ [cc, cr]

type BorderTemplate =
  ( (Char, Char, Char)
  , (Char, Char, Char)
  , (Char, Char, Char) )

borderTemplate :: String -> String -> String -> BorderTemplate
borderTemplate row1 row2 row3 =
  let
    cells [cell1, cell2, cell3] = (cell1, cell2, cell3)
  in
  ( cells row1
  , cells row2
  , cells row3
  )

