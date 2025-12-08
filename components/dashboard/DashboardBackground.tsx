'use client';

export function DashboardBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-slate-50" />

            {/* Subtle Mesh Gradient Blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }}
            />
        </div>
    );
}
