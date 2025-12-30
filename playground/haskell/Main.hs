{-# LANGUAGE DuplicateRecordFields #-}
-- {-# LANGUAGE NoFieldSelectors #-}

import Data.Char
import Data.List
import Text.Printf
import Texel qualified as Texel
import Texel (Texel)

main = putStrLn
  $ intercalate "\n" . map Texel.toString
  $ withThinBorder
  $ [Texel.fromChar 'G' : map Texel.fromChar "REEN TEXT", map Texel.fromChar "BOTTOM TEXT"]

ansiEsc = '\ESC'
ansiReset = ansiEsc : "[0m"

ansiColor :: Color -> String
ansiColor (RgbColor (r, g, b)) = ansiEsc : printf "[38;2;%i;%i;%im" r g b

ansiColorGreen = ansiColor $ RgbColor (64, 130, 109)

data Color = RgbColor (Int, Int, Int)

-- On a surface level a Box is just a 2d array of Texels
-- A Texel is a Char surrounded by ansi sequences
-- To render a box I must map Texels to string and join 2d
-- with newlines.
-- I wan't to separate original content of the box from the
-- styling symbols and ansi sequences. Meaning that Box should
-- be: a 2d array of Texels AND an underlying content.
-- This pattern of having a computation along side some other thing (like a log)
-- is kind of what Writer monad is for. I should look into usefulness of
-- writer moand for this case.
data Box = Box
  { text :: String
  , view :: [[Texel]]
  , size :: (Int, Int)
  }

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

withBorder:: BorderTemplate Texel -> [[Texel]] -> [[Texel]]
withBorder template lines = borderTop ++ map bordered lines ++ borderBottom
  where
    ((tl, tc, tr), (cl, cc, cr), (bl, bc, br)) = template
    maxLength = maximum (map length lines)
    boxWidth = maxLength + 2
    borderTop     = [tl : replicate boxWidth tc ++ [tr]]
    borderBottom  = [bl : replicate boxWidth bc ++ [br]]
    bordered line = [cl, cc] ++ line ++ replicate (maxLength - length line) cc ++ [cc, cr]

type BorderTemplate a =
  ( (a, a, a)
  , (a, a, a)
  , (a, a, a) )

borderTemplate :: String -> String -> String -> BorderTemplate Texel
borderTemplate row1 row2 row3 =
  let
    cells [cell1, cell2, cell3] = (Texel.fromChar cell1, Texel.fromChar cell2, Texel.fromChar cell3)
  in
  ( cells row1
  , cells row2
  , cells row3
  )

-- | Assumes h s l are within set [0..1] where hue is a fraction of a circle instead of degree
rgbFromHsl :: (Float, Float, Float) -> (Float, Float, Float)
rgbFromHsl (h, 0, l) = (l * 255, l * 255, l * 255)
rgbFromHsl (h, s, l) = (r * 255, g * 255, b * 255)
  where
    q = if l < 0.5 then l * (1 + s) else l + s - l * s
    p = 2 * l - q
    r = channelFromHue p q (h + 1/3)
    g = channelFromHue p q (h)
    b = channelFromHue p q (h - 1/3)
    channelFromHue p q t
      | t < 0 = channelFromHue p q (t + 1)
      | t > 1 = channelFromHue p q (t - 1)
      | t < 1/6 = p + (q - p) * 6 * t
      | t < 1/2 = q
      | t < 2/3 = p + (q - p) * (2/3 - t) * 6
      | otherwise = p


