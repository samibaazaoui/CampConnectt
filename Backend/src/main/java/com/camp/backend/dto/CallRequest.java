package com.camp.backend.dto;

import lombok.Data;

@Data
public class CallRequest {
    private Long callerId;
    private Long receiverId;
    private String callerName;
    private String type; // CALL, ACCEPTED, REJECTED, OFFER, ANSWER, ICE
    private Object data;

    // getters / setters
}