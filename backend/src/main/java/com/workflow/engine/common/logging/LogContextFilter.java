package com.workflow.engine.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class LogContextFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_MDC_KEY = "requestId";
    private static final String USER_ID_MDC_KEY = "userId";
    private static final String ORGANIZATION_ID_MDC_KEY = "organizationId";
    private static final Pattern ORGANIZATION_ID_PATTERN = Pattern.compile("/api/organizations/([^/]+)");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // 1. Generate/Track Request ID
            String requestId = request.getHeader("X-Request-ID");
            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString();
            }
            MDC.put(REQUEST_ID_MDC_KEY, requestId);
            response.setHeader("X-Request-ID", requestId);

            // 2. Extract Organization ID from URI if present
            String uri = request.getRequestURI();
            Matcher matcher = ORGANIZATION_ID_PATTERN.matcher(uri);
            if (matcher.find()) {
                MDC.put(ORGANIZATION_ID_MDC_KEY, matcher.group(1));
            }

            // 3. User ID is typically populated after JWT filter
            // But we can check here or let it be populated in a later filter/manual calls
            // For now, try to get it if SecurityContext is already populated (less likely
            // at this stage unless filter order is specific)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof com.workflow.engine.auth.entity.User user) {
                MDC.put(USER_ID_MDC_KEY, user.getId().toString());
            }

            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
