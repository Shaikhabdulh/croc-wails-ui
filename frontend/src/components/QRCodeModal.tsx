import { X } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  codePhrase: string;
  qrCodeUrl: string;
}

export function QRCodeModal({ isOpen, onClose, codePhrase, qrCodeUrl }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close QR Modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Scan to Receive</h3>

          <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-200">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Croc Transfer QR Code" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center text-xs text-slate-400">QR Code not available</div>
            )}
          </div>

          <div className="w-full text-center">
            <p className="text-xs text-slate-500 mb-1">Code Phrase</p>
            <p className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 py-1 px-3 rounded-lg border border-slate-200 select-all">
              {codePhrase}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
