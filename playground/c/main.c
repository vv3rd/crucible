#include <stdio.h>
int main() {
  int x = 69;
  int y = 23;
  int i = 0;
  while (i < x / y) {
    i++;
  }
  printf("%d", i);
}
