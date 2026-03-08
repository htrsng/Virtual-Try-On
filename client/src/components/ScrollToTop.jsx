import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const previousHtmlBehavior = html.style.scrollBehavior;
        const previousBodyBehavior = body.style.scrollBehavior;

        // Force instant jump to top on route change (no smooth scroll animation).
        html.style.scrollBehavior = 'auto';
        body.style.scrollBehavior = 'auto';
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

        // Restore previous behavior for in-page interactions after first frame.
        requestAnimationFrame(() => {
            html.style.scrollBehavior = previousHtmlBehavior;
            body.style.scrollBehavior = previousBodyBehavior;
        });
    }, [pathname]);

    return null;
}

export default ScrollToTop;
