import React, { useEffect, useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { FileText, X } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';

interface WeeklyReport {
    id: string;
    week_start: string;
    week_end: string;
    content: string;
    ai_rating: number;
    ai_feedback: string;
    submitted_at: string;
}

const WeeklyReportHistory: React.FC = () => {
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const { fetchReports, employee } = useWorkAuth();

    useEffect(() => {
        const loadReports = async () => {
            if (employee) {
                setLoading(true);
                const fetchedReports = await fetchReports(employee.id);
                setReports(fetchedReports);
                setLoading(false);
            }
        };
        loadReports();
    }, [employee, fetchReports]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6 bg-background-light rounded-lg mt-6 border border-neutral-700">
            <h2 className="text-2xl font-bold text-white mb-4">Report History</h2>
            <div className="space-y-3">
                {reports.length > 0 ? (
                    reports.map(report => (
                        <div key={report.id} onClick={() => setSelectedReport(report)} className="bg-neutral-800 p-4 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">Week of {new Date(report.week_start).toLocaleDateString()}</p>
                                <p className="text-sm text-neutral-400">Submitted on {new Date(report.submitted_at).toLocaleDateString()}</p>
                            </div>
                            <div className={`text-2xl font-bold ${report.ai_rating > 60 ? 'text-success' : 'text-secondary'}`}>
                                {report.ai_rating}%
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-neutral-400 text-center py-8">No reports submitted yet.</p>
                )}
            </div>

            {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
        </div>
    );
};

const ReportModal = ({ report, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-background-light rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-y-auto border border-neutral-700">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Report for week of {new Date(report.week_start).toLocaleDateString()}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-6">
                <div className="mb-6">
                    <h4 className="font-bold text-lg text-white mb-2">AI Evaluation</h4>
                    <div className="flex items-start space-x-4 bg-neutral-800 p-4 rounded-lg">
                        <div className={`text-5xl font-bold ${report.ai_rating > 60 ? 'text-success' : 'text-secondary'}`}>
                            {report.ai_rating}
                        </div>
                        <p className="text-neutral-300">{report.ai_feedback}</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-white mb-2">Your Submission</h4>
                    <div className="text-neutral-300 whitespace-pre-wrap bg-neutral-800 p-4 rounded-lg max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800">{report.content}</div>
                </div>
            </div>
        </div>
    </div>
);

export default WeeklyReportHistory;
