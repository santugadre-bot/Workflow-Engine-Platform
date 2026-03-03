package com.workflow.engine;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class DbVerificationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void verifyDatabase() {
        System.out.println("--- DATABASE VERIFICATION START ---");
        try {
            List<Map<String, Object>> tables = jdbcTemplate.queryForList(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            System.out.println("Tables found in public schema:");
            for (Map<String, Object> table : tables) {
                String tableName = (String) table.get("table_name");
                Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
                System.out.println("  - " + tableName + " (rows: " + count + ")");

                if (tableName.equalsIgnoreCase("users")) {
                    List<String> emails = jdbcTemplate.queryForList("SELECT email FROM users", String.class);
                    System.out.println("    Registered Emails: " + emails);
                }
            }
            System.out.println("--- DATABASE VERIFICATION SUCCESS ---");
        } catch (Exception e) {
            System.err.println("--- DATABASE VERIFICATION FAILURE ---");
            e.printStackTrace();
        }
    }
}
