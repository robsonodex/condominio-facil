'use client';
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export default function TurboPage() {
    const { user } = useUser();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);

    async function handle(type: 'visitante' | 'prestador' | 'encomenda') {
        try {
            // Capture from video stream
            if (!videoRef.current) {
                toast.error("Camera not active");
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(videoRef.current, 0, 0);

            const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7));
            if (!blob) return;

            const fd = new FormData();
            fd.append('photo', blob, 'photo.jpg');

            toast.info("Processando...");

            const upload = await fetch('/api/portaria/upload-photo', { method: 'POST', body: fd });
            if (!upload.ok) throw new Error('Upload failed');
            const { photo_url } = await upload.json();

            const res = await fetch('/api/portaria/turbo-entry', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ entry_type: type, photo_url })
            });

            if (res.ok) {
                toast.success("Entrada registrada!");
            } else {
                toast.error("Erro ao registrar");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro no sistema");
        }
    }

    // Initialize camera
    React.useEffect(() => {
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error("Camera error", e);
            }
        })();
        return () => {
            // cleanup tracks
        }
    }, []);

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-zinc-950 p-4">
            <h2 className="text-xl font-bold">Modo Turbo - Portaria</h2>
            <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                <Button className="h-20 text-xl" onClick={() => handle('visitante')}>Visitante</Button>
                <Button className="h-20 text-xl variant-secondary" onClick={() => handle('prestador')}>Prestador</Button>
                <Button className="h-20 text-xl variant-outline" onClick={() => handle('encomenda')}>Encomenda</Button>
            </div>
        </div>
    );
}
