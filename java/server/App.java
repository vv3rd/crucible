import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;

public class App {
    private static int port = 8080;

    public static void main(String[] args) {
        System.out.printf("Hello world!");

        ServerSocket ss = null;
        Socket socket = null;
        InputStream input$ = null;
        OutputStream output$ = null;

        try {
            ss = new ServerSocket(port);
            socket = ss.accept();
            input$ = socket.getInputStream();
            output$ = socket.getOutputStream();

            final String CRLF = "\n\r";

            String html = readFile("index.html");

            String http =
                    "HTTP/1.1 200 OK"
                            + CRLF
                            + "Content-Length: "
                            + html.getBytes().length
                            + CRLF
                            + CRLF
                            + html
                            + CRLF
                            + CRLF;

            output$.write(http.getBytes());

            input$.close();
            output$.close();
            socket.close();
            ss.close();
        } catch (IOException e) {
        }
    }

    private static String readFile(String filePath) throws IOException {
        BufferedReader br = new BufferedReader(new FileReader(filePath));
        try {
            StringBuilder sb = new StringBuilder();
            String line = br.readLine();

            while (line != null) {
                sb.append(line);
                sb.append(System.lineSeparator());
                line = br.readLine();
            }
            String everything = sb.toString();

            return everything;
        } catch (Exception e) {
            throw new RuntimeException("Ughhh", e);
        } finally {
            br.close();
        }
    }
}
