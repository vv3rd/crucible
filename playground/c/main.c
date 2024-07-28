#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int
main() {
  int sockfd = socket(AF_INET, SOCK_STREAM, 0);
  struct sockaddr_in addr = {
    AF_INET,
    htons(8080),
    0,
  };
  
  bind(sockfd, &addr, sizeof(addr));
  listen(sockfd, 10);
  int clienfd = accept(sockfd, 0, 0);


}
