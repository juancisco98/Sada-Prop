import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, X } from 'lucide-react';
import { Appointment } from '../types';

interface VisitFeedbackModalProps {
    appointment: Appointment;
    clientName: string;
    propertyAddress: string;
    onClose: () => void;
    onConfirm: (interestRating: number, priceRating: number, feedbackComment: string, comentarios: string) => void;
}

const VisitFeedbackModal: React.FC<VisitFeedbackModalProps> = ({
    appointment,
    clientName,
    propertyAddress,
    onClose,
    onConfirm
}) => {
    const [interestRating, setInterestRating] = useState(0);
    const [priceRating, setPriceRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [comentarios, setComentarios] = useState(appointment.comentariosPostVisita || '');

    const handleSubmit = () => {
        if (interestRating === 0) {
            alert('Por favor califica el interés del cliente.');
            return;
        }
        onConfirm(interestRating, priceRating || interestRating, feedbackComment, comentarios);
    };

    return (
        <div className="fixed inset-0 z-[1300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" /> Valoración de Visita
                        </h2>
                        <p className="text-sm text-blue-600 mt-1">{propertyAddress}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full text-blue-700 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2 text-sm">¿Qué le pareció la propiedad a?</p>
                        <h3 className="text-2xl font-bold text-gray-900">{clientName}</h3>
                    </div>

                    {/* Interest Rating */}
                    <div className="space-y-2 text-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interés del Cliente</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={`i-${star}`}
                                    onClick={() => setInterestRating(star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= interestRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Perception Rating */}
                    <div className="space-y-2 text-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Percepción del Precio</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={`p-${star}`}
                                    onClick={() => setPriceRating(star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= priceRating ? 'fill-blue-400 text-blue-400' : 'text-gray-200'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Comment */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">¿Qué le pareció al interesado?</span>
                        </div>
                        <textarea
                            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none h-20 placeholder-gray-400"
                            placeholder="Le gustó la ubicación pero le pareció chico..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                        />
                    </div>

                    {/* Post-visit Notes */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Comentarios Post-Visita</span>
                        </div>
                        <textarea
                            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none h-16 placeholder-gray-400"
                            placeholder="Notas privadas sobre la visita..."
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 shadow-xl transition-all active:scale-[0.98]"
                    >
                        Guardar Valoración
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisitFeedbackModal;
