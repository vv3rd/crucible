
main = do
    fileText <- readFile "main.hs"
    let indentedLines = map markIndent fileLines where
          markIndent = ("----" ++)
          fileLines = lines fileText

    putStrLn $ unlines indentedLines  
