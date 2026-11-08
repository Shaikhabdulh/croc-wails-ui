import { X, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  codePhrase: string;
  qrCodeUrl: string;
}

export function QRCodeModal({ isOpen, onClose, codePhrase, qrCodeUrl }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl border border-slate-200/90 text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close QR Modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center space-y-5 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <QrCode className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Scan with Mobile</h3>
          </div>

          <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-slate-50 p-3 border border-slate-200/80 shadow-inner">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Croc Transfer QR Code"
                className="h-full w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center text-xs text-slate-400">QR Code not available</div>
            )}
          </div>

          <div className="w-full text-center space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Or enter code phrase manually</p>
            <div className="font-mono text-sm font-bold text-slate-900 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200 select-all shadow-2xs">
              {codePhrase}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
