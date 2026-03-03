import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbConnectivityCheck {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/workflow_engine";
        String user = "postgres";
        String password = "santu@8496";

        try (Connection conn = DriverManager.getConnection(url, user, password);
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")) {

            System.out.println("Tables in 'workflow_engine' (schema = public):");
            while (rs.next()) {
                System.out.println("- " + rs.getString("table_name"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
