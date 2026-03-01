import React, { useState } from 'react';
import { X, Send, Loader2, Mail } from 'lucide-react';
import { sendEmail } from '../services/gmailService';
import { getGoogleToken } from '../services/googleTokenService';
import { GoogleAuthExpiredError } from '../utils/googleErrors';
import { toast } from 'sonner';

interface ComposeEmailModalProps {
    to: string;
    recipientName: string;
    onClose: () => void;
}

const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({ to, recipientName, onClose }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error('Completá el asunto y el mensaje.');
            return;
        }

        setIsSending(true);
        try {
            const token = await getGoogleToken();
            if (!token) {
                toast.error('No hay token de Google. Volvé a iniciar sesión.');
                return;
            }

            const success = await sendEmail({
                to,
                subject: subject.trim(),
                body: body.trim().replace(/\n/g, '<br>'),
            }, token);

            if (success) {
                toast.success(`Email enviado a ${recipientName}`);
                onClose();
            } else {
                toast.error('Error al enviar el email. Intentá de nuevo.');
            }
        } catch (e) {
            if (e instanceof GoogleAuthExpiredError) {
                toast.info('Tu sesión de Google expiró. Volvé a iniciar sesión para enviar emails.');
            } else {
                toast.error('Error al enviar el email.');
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Enviar Email</h2>
                            <p className="text-xs text-gray-500">Para: {recipientName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Para</label>
                        <input
                            type="email"
                            value={to}
                            disabled
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Asunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Asunto del email..."
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mensaje</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Escribí tu mensaje..."
                            rows={8}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !subject.trim() || !body.trim()}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {isSending ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComposeEmailModal;
