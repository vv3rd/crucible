module Texel
  ( Texel
  , fromChar
  , fromFirst
  , toString
  )
where

data Texel = Texel
  { texelSymbol :: Char
  , precedingAnsi :: String
  , followingAnsi :: String
  }

fromChar char = Texel char "" ""
fromFirst [char] = fromChar char

toString = concat . map (\texel -> precedingAnsi texel ++ [texelSymbol texel] ++ followingAnsi texel)

