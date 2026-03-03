package com.workflow.engine.core.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Adds HTTP Cache-Control headers to API responses.
 * <p>
 * Safe GET-only endpoints (projects, sprints, users/me) receive
 * {@code Cache-Control: max-age=60, private} so the browser reuses the
 * response for up to 60 seconds without making a round-trip to the backend.
 * <p>
 * All other endpoints (mutations, auth) get {@code no-store} so they are
 * never cached.
 */
public class CacheControlInterceptor implements HandlerInterceptor {

    // Path prefixes whose GET responses are safe to cache for 60 s
    private static final String[] CACHEABLE_PREFIXES = {
            "/api/organizations",
            "/api/projects",
            "/api/users/me",
            "/api/workflows",
    };

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response,
            Object handler) {

        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("GET".equalsIgnoreCase(method) && isCacheable(path)) {
            // Private = browser-only, not shared cache; max-age = 60 s
            response.setHeader("Cache-Control", "max-age=60, private");
        } else {
            // POST / PUT / DELETE and auth endpoints must never be cached
            response.setHeader("Cache-Control", "no-store");
        }

        return true; // continue chain
    }

    private boolean isCacheable(String path) {
        for (String prefix : CACHEABLE_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}
