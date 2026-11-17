// Read-only diagnostics and a frozen animation profile exist only in the owned QA build.
export const qa3dEnabled = import.meta.env.MODE === 'qa' && import.meta.env.VITE_QA_3D === 'true';
export function staticQaRender() {
    return qa3dEnabled && new URLSearchParams(window.location.search).get('qa3d') === 'static';
}
