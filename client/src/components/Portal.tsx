import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: ReactNode;
}

export default function Portal({ children }: PortalProps) {
    const [el] = useState(() => document.createElement('div'));

    useEffect(() => {
        const portalRoot = document.body;
        portalRoot.appendChild(el);

        return () => {
            portalRoot.removeChild(el);
        };
    }, [el]);

    return createPortal(children, el);
}