import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;

public class App {
    private static int port = 8080;

    private static String CRLF = "\n\r";

    public static void main(String[] args) {

        ServerSocket socketServer = null;
        Socket socket = null;
        InputStream inStream = null;
        OutputStream outStream = null;

        try {
            System.out.println("Listening on port: " + port);

            socketServer = new ServerSocket(port);
            socket = socketServer.accept();
            inStream = socket.getInputStream();
            outStream = socket.getOutputStream();

            System.out.println("Accepted connection");

            String html = readFile("index.html");

            StringBuilder response = new StringBuilder();
            response.append("HTTP/1.1 200 OK");
            response.append(CRLF);
            response.append("Content-Length: " + html.getBytes().length);
            response.append(CRLF + CRLF);
            response.append(html);
            response.append(CRLF + CRLF);

            outStream.write(response.toString().getBytes());

            inStream.close();
            outStream.close();
            socket.close();
            socketServer.close();
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
