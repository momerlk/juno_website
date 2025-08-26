import React, { useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';

const NotificationCenter: React.FC = () => {
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingReminder, setLoadingReminder] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { sendDailySummary, sendWeeklyReminder } = useWorkAuth();

    const handleSendSummary = async () => {
        setLoadingSummary(true);
        setStatus(null);
        const success = await sendDailySummary();
        if (success) {
            setStatus({ type: 'success', message: 'Daily summary notifications sent successfully!' });
        } else {
            setStatus({ type: 'error', message: 'Failed to send daily summary notifications.' });
        }
        setLoadingSummary(false);
    };

    const handleSendReminder = async () => {
        setLoadingReminder(true);
        setStatus(null);
        const success = await sendWeeklyReminder();
        if (success) {
            setStatus({ type: 'success', message: 'Weekly report reminders sent successfully!' });
        } else {
            setStatus({ type: 'error', message: 'Failed to send weekly report reminders.' });
        }
        setLoadingReminder(false);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center"><Bell className="mr-3 text-primary"/>Notification Center</h2>
            
            {status && (
                <div className={`flex items-center p-4 mb-4 text-sm rounded-lg ${status.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {status.type === 'success' ? <CheckCircle className="mr-3"/> : <AlertCircle className="mr-3"/>}
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background-light p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-lg font-semibold text-white mb-2">Daily Task Summaries</h3>
                    <p className="text-sm text-neutral-400 mb-4">Manually trigger WhatsApp messages to all employees with their task summary for the day.</p>
                    <button 
                        onClick={handleSendSummary}
                        disabled={loadingSummary}
                        className="w-full flex items-center justify-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50">
                        <Send size={16} className="mr-2"/>
                        {loadingSummary ? 'Sending...' : 'Send Daily Summaries'}
                    </button>
                </div>
                <div className="bg-background-light p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-lg font-semibold text-white mb-2">Weekly Report Reminders</h3>
                    <p className="text-sm text-neutral-400 mb-4">Manually trigger WhatsApp reminders to employees who have not yet submitted their weekly report.</p>
                    <button 
                        onClick={handleSendReminder}
                        disabled={loadingReminder}
                        className="w-full flex items-center justify-center bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 disabled:opacity-50">
                        <Send size={16} className="mr-2"/>
                        {loadingReminder ? 'Sending...' : 'Send Weekly Reminders'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
