import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: ReactNode;
}

export default function Portal({ children }: PortalProps) {
    const el = useRef(document.createElement('div'));

    useEffect(() => {
        const portalRoot = document.body;
        portalRoot.appendChild(el.current);

        return () => {
            portalRoot.removeChild(el.current);
        };
    }, []);

    return createPortal(children, el.current);
}