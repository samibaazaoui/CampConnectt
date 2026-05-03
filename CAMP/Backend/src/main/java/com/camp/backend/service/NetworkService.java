package com.camp.backend.service;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class NetworkService {

    @Value("${app.base-url:}")
    private String configuredBaseUrl;

    @Value("${server.port:8080}")
    private int serverPort;

    public String resolveBaseUrl() {
        // If explicitly configured to something other than localhost, use it
        if (configuredBaseUrl != null && !configuredBaseUrl.isBlank()
                && !configuredBaseUrl.contains("localhost")
                && !configuredBaseUrl.contains("127.0.0.1")) {
            return configuredBaseUrl;
        }
        // Auto-detect local network IP
        try {
            for (NetworkInterface iface : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (iface.isLoopback() || !iface.isUp()) continue;
                for (InetAddress addr : Collections.list(iface.getInetAddresses())) {
                    if (addr.isLoopbackAddress()) continue;
                    String ip = addr.getHostAddress();
                    // Only IPv4
                    if (!ip.contains(":")) {
                        return "http://" + ip + ":" + serverPort;
                    }
                }
            }
        } catch (Exception ignored) {}
        // Fallback to localhost
        return "http://localhost:" + serverPort;
    }
}
