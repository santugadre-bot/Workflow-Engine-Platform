package com.workflow.engine;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

@SpringBootTest
@ActiveProfiles("test")
public class UserCheckTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void listUsers() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("--- BCRYPT START ---");
        System.out.println("Hash for 'password': " + encoder.encode("password"));
        System.out.println("--- BCRYPT END ---");

        List<User> users = userRepository.findAll();
        System.out.println("--- USERS START ---");
        for (User user : users) {
            System.out.println(
                    "User: " + user.getEmail() + ", Active: " + user.isActive() + ", Role: " + user.getSystemRole());
        }
        System.out.println("--- USERS END ---");
    }
}
