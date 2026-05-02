package com.camp.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOrderCancelledEmail(String toEmail, Long orderId) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("Order Cancelled ❌");

            String html = """
                    <div style="font-family:Arial;">
                        <h2 style="color:red;">Order Cancelled</h2>
                        <p>Your order <b>#%d</b> has been automatically cancelled.</p>
                        <p>If this is a mistake, please contact support.</p>
                    </div>
                    """.formatted(orderId);

            helper.setText(html, true);

            mailSender.send(message);

        } catch (Exception e) {
            System.out.println("Email failed: " + e.getMessage());
        }
    }
}
