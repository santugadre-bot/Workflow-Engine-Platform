
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class CheckPostgres {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/workflow_engine";
        String user = "postgres";
        String password = "santu@8496";

        System.out.println("Connecting to " + url + " as " + user);

        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(url, user, password)) {
                if (conn != null) {
                    System.out.println("SUCCESS: Connected to the database!");
                } else {
                    System.out.println("FAILURE: Failed to make connection!");
                }
            } catch (SQLException e) {
                System.out.println("FAILURE: SQL Exception: " + e.getMessage());
                e.printStackTrace();
            }
        } catch (ClassNotFoundException e) {
            System.out.println("FAILURE: PostgreSQL Driver not found!");
            e.printStackTrace();
        } catch (Exception e) {
            System.out.println("FAILURE: Unexpected Exception: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
