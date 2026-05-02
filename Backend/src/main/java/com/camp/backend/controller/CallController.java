package com.camp.backend.controller;

import com.camp.backend.dto.CallRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class CallController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call")
    public void call(CallRequest req) {
        messagingTemplate.convertAndSend("/topic/call/" + req.getReceiverId(), req);
    }

    @MessageMapping("/signal")
    public void signal(CallRequest req) {
        messagingTemplate.convertAndSend("/topic/signal/" + req.getReceiverId(), req);
    }
}