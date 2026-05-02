package com.camp.backend.service;

import com.camp.backend.entity.EquipmentOrder;
import com.camp.backend.entity.EquipmentOrderStatus;
import com.camp.backend.repository.EquipmentOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class OrderScheduler {

    @Autowired
    private EquipmentOrderRepository orderRepository;
    @Autowired
    private EmailService emailService;
    @Scheduled(cron = "0 0 0 * * ?")
    public void updateDeliveredOrders() {

        List<EquipmentOrder> orders = orderRepository.findAll();

        for (EquipmentOrder order : orders) {

            if (order.getStatus().equals(EquipmentOrderStatus.PENDING)) {

                LocalDate orderDate = order.getCreatedAt().toLocalDate();
                LocalDate now = LocalDate.now();

                if (orderDate.plusDays(3).isBefore(now)) {
                    order.setStatus(EquipmentOrderStatus.APPROVED);
                    orderRepository.save(order);
                    if (order.getUser() != null && order.getUser().getEmail() != null) {
                        emailService.sendOrderCancelledEmail(
                                order.getUser().getEmail(),
                                order.getId()
                        );
                        System.out.println("Order cancelled + email sent: " + order.getId());

                    }
                }
            }
        }

        System.out.println("Scheduler executed ");
    }

}
