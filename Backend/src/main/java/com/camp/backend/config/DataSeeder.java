package com.camp.backend.config;

import com.camp.backend.entity.*;
import com.camp.backend.repository.*;
import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.annotation.Order;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    @Order(1)
    public CommandLineRunner fixTable(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50)");
                System.out.println("Modified users role column to VARCHAR");
            } catch (Exception e) {
                // Ignore if already changed or not possible
            }
        };
    }

    @Bean
    @Order(2)
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            CampsiteRepository campsiteRepository,
            EquipmentRepository equipmentRepository,
            ActivityRepository activityRepository,
            EventRepository eventRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Seed Admin User
            if (userRepository.findByEmail("admin@camp.com").isEmpty()) {
                User admin = new User();
                admin.setFullName("System Administrator");
                admin.setEmail("admin@camp.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(UserRole.ADMIN);
                userRepository.save(admin);
                System.out.println("✅ Admin user seeded: admin@camp.com / admin123");
            }

            // 1b. Seed Standard User
            if (userRepository.findByEmail("user@camp.com").isEmpty()) {
                User standardUser = new User();
                standardUser.setFullName("Standard Explorer");
                standardUser.setEmail("user@camp.com");
                standardUser.setPassword(passwordEncoder.encode("user123"));
                standardUser.setRole(UserRole.USER);
                userRepository.save(standardUser);
                System.out.println("✅ Standard user seeded: user@camp.com / user123");
            }

            // 1c. Seed Campsite Owner
            User campsiteOwner = userRepository.findByEmail("campsite@owner.com").orElse(null);
            if (campsiteOwner == null) {
                campsiteOwner = new User();
                campsiteOwner.setFullName("Campsite Business Owner");
                campsiteOwner.setEmail("campsite@owner.com");
                campsiteOwner.setPassword(passwordEncoder.encode("owner123"));
                campsiteOwner.setRole(UserRole.CAMPSITE_OWNER);
                campsiteOwner = userRepository.save(campsiteOwner);
                System.out.println("✅ Campsite Owner seeded: campsite@owner.com / owner123");
            }

            // 1d. Seed Equipment Owner
            User equipmentOwner = userRepository.findByEmail("equipment@owner.com").orElse(null);
            if (equipmentOwner == null) {
                equipmentOwner = new User();
                equipmentOwner.setFullName("Gear Shop Owner");
                equipmentOwner.setEmail("equipment@owner.com");
                equipmentOwner.setPassword(passwordEncoder.encode("owner123"));
                equipmentOwner.setRole(UserRole.EQUIPMENT_OWNER);
                equipmentOwner = userRepository.save(equipmentOwner);
                System.out.println("✅ Equipment Owner seeded: equipment@owner.com / owner123");
            }

            // 2. Seed Campsites
            if (campsiteRepository.count() == 0) {
                Campsite c1 = new Campsite();
                c1.setName("Majestic Forest");
                c1.setLocation("Aïn Draham, Tunisia");
                c1.setCapacity(50);
                c1.setNightlyPrice(45.5);
                c1.setImageUrl("https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800");
                c1.setOwner(campsiteOwner);
                c1.setApprovalStatus(ApprovalStatus.APPROVED);
                campsiteRepository.save(c1);

                Campsite c2 = new Campsite();
                c2.setName("Starlit Coast");
                c2.setLocation("Kelibia, Tunisia");
                c2.setCapacity(30);
                c2.setNightlyPrice(65.0);
                c2.setImageUrl("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800");
                c2.setOwner(campsiteOwner);
                c2.setApprovalStatus(ApprovalStatus.APPROVED);
                campsiteRepository.save(c2);
                
                System.out.println("✅ Default campsites seeded and assigned to campsite owner.");
            }

            // 3. Seed Equipment
            if (equipmentRepository.count() == 0) {
                Equipment e1 = new Equipment();
                e1.setName("Premium 4-Person Tent");
                e1.setDescription("Durable weather-resistent shelter for small groups.");
                e1.setQuantityInStock(15);
                e1.setUnitPrice(120.0);
                e1.setImageUrl("https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?auto=format&fit=crop&q=80&w=600");
                e1.setOwner(equipmentOwner);
                e1.setApprovalStatus(ApprovalStatus.APPROVED);
                equipmentRepository.save(e1);

                Equipment e2 = new Equipment();
                e2.setName("High-Power Camping Lantern");
                e2.setDescription("LED lighting with long battery life.");
                e2.setQuantityInStock(5);
                e2.setUnitPrice(35.0);
                e2.setImageUrl("https://images.unsplash.com/photo-1571401340621-3e472626e257?auto=format&fit=crop&q=80&w=600");
                e2.setOwner(equipmentOwner);
                e2.setApprovalStatus(ApprovalStatus.APPROVED);
                equipmentRepository.save(e2);
                
                System.out.println("✅ Inventory seeded and assigned to equipment owner.");
            }

            // 5. Seed Events
            Event ev1 = null;
            if (eventRepository.count() == 0) {
                ev1 = new Event();
                ev1.setTitle("Annual Summer Jamboree");
                ev1.setDescription("The biggest camping gathering of the year!");
                ev1.setLocation("Majestic Forest");
                ev1.setStartAt(LocalDateTime.now().plusWeeks(2));
                ev1.setEndAt(LocalDateTime.now().plusWeeks(2).plusDays(3));
                ev1 = eventRepository.save(ev1);
                System.out.println("✅ Community events seeded.");
            } else {
                ev1 = eventRepository.findAll().get(0);
            }

            // 4. Seed Activities (Now using saved event reference if available)
            if (activityRepository.count() == 0) {
                Activity a1 = new Activity();
                a1.setName("Guided Forest Hike");
                a1.setDescription("Explore the lush greenery with expert guides.");
                if (ev1 != null) a1.setEvent(ev1);
                activityRepository.save(a1);

                Activity a2 = new Activity();
                a2.setName("Stargazing Night");
                a2.setDescription("Observe the cosmos away from city lights.");
                if (ev1 != null) a2.setEvent(ev1);
                activityRepository.save(a2);
                
                System.out.println("✅ Activities seeded.");
            }

            // 6. Fix Ownership for existing NULL owners (Legacy data)
            final User finalCampsiteOwner = campsiteOwner;
            campsiteRepository.findAll().stream()
                .filter(c -> c.getOwner() == null)
                .forEach(c -> {
                    c.setOwner(finalCampsiteOwner);
                    campsiteRepository.save(c);
                });

            final User finalEquipmentOwner = equipmentOwner;
            equipmentRepository.findAll().stream()
                .filter(e -> e.getOwner() == null)
                .forEach(e -> {
                    e.setOwner(finalEquipmentOwner);
                    equipmentRepository.save(e);
                });
            
            System.out.println("✅ Ownership auto-fixed for legacy records.");
        };
    }
}
