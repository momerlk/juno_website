import React, { useState, useEffect } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { Send, Check, AlertCircle } from 'lucide-react';

interface WeeklyReport {
    id: string;
    ai_rating: number;
    ai_feedback: string;
    submitted_at: string;
}

const WeeklyReportForm: React.FC = () => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedReport, setSubmittedReport] = useState<WeeklyReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { submitWeeklyReport, fetchReports, employee } = useWorkAuth();

    const [hasSubmittedThisWeek, setHasSubmittedThisWeek] = useState(false);

    useEffect(() => {
        const checkSubmission = async () => {
            if(employee) {
                const reports = await fetchReports(employee.id);
                if (reports.length > 0) {
                    const lastReport = reports[0];
                    const lastSubmissionDate = new Date(lastReport.submitted_at);
                    const today = new Date();
                    const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));
                    if(lastSubmissionDate > oneWeekAgo) {
                        setHasSubmittedThisWeek(true);
                        setSubmittedReport(lastReport);
                    }
                }
            }
        };
        checkSubmission();
    }, [fetchReports, employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (content.length < 100) {
            setError('Report must be at least 100 characters long.');
            return;
        }
        setError(null);
        setIsSubmitting(true);
        const report = await submitWeeklyReport(content);
        if (report) {
            setSubmittedReport(report);
            setHasSubmittedThisWeek(true);
        } else {
            setError('Failed to submit report. Please try again.');
        }
        setIsSubmitting(false);
    };

    if (hasSubmittedThisWeek && submittedReport) {
        return (
            <div className="p-6 bg-background-light rounded-lg border border-neutral-700">
                <h2 className="text-2xl font-bold text-white mb-4">Weekly Report Submitted</h2>
                <div className="p-4 bg-success/10 rounded-lg text-center border border-success/20">
                    <Check className="mx-auto text-success mb-2" size={40}/>
                    <p className="text-white">You have already submitted your report for this week.</p>
                </div>
                <div className="mt-6">
                    <h3 className="font-bold text-lg text-white mb-2">AI Evaluation</h3>
                    <div className="flex items-center space-x-4 bg-neutral-800 p-4 rounded-lg">
                        <div className={`text-4xl font-bold ${submittedReport.ai_rating > 60 ? 'text-success' : 'text-secondary'}`}>
                            {submittedReport.ai_rating}
                        </div>
                        <p className="text-neutral-300 text-sm">{submittedReport.ai_feedback}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-background-light rounded-lg border border-neutral-700">
            <h2 className="text-2xl font-bold text-white mb-4">Submit Weekly Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What have you accomplished this week? What are your plans for the next week?"
                    className="w-full h-48 p-4 bg-background border border-neutral-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    minLength={100}
                    required
                />
                <div className="flex justify-between items-center">
                    <span className={`text-sm ${content.length < 100 ? 'text-error' : 'text-neutral-400'}`}>
                        {content.length} / 100 characters
                    </span>
                    <button type="submit" disabled={isSubmitting || content.length < 100} className="flex items-center bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Submitting...' : <><Send size={16} className="mr-2"/> Submit</>}
                    </button>
                </div>
                {error && <div className="flex items-center text-sm text-error"><AlertCircle size={16} className="mr-2"/>{error}</div>}
            </form>
        </div>
    );
};

export default WeeklyReportForm;
