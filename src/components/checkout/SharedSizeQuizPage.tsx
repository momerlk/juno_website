import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SharedSizeQuiz } from '../../api/sizingApi';
import type { SizingQuestion, SizingQuiz } from '../../api/api.types';

const optionValue = (option: string | { value?: string; label?: string }) => typeof option === 'string' ? option : option.value || option.label || '';
const optionLabel = (option: string | { value?: string; label?: string }) => typeof option === 'string' ? option : option.label || option.value || '';

const SharedSizeQuizPage: React.FC = () => {
  const { token = '' } = useParams();
  const [quiz, setQuiz] = useState<SizingQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const questions = quiz?.questions || [];
  const question = questions[step];
  const gender = answers.gender || 'women';
  const illustration = question?.illustrations?.[gender];

  useEffect(() => {
    void (async () => {
      const res = await SharedSizeQuiz.get(token);
      if (!res.ok) { setError((res.body as any)?.message || 'This size link is no longer available.'); setLoading(false); return; }
      setQuiz(res.body.quiz); setLoading(false);
    })();
  }, [token]);

  const canContinue = useMemo(() => Boolean(question && (question.optional || String(answers[question.id] || '').trim())), [answers, question]);
  const next = async () => {
    if (!question || !canContinue) return;
    if (step < questions.length - 1) { setStep((value) => value + 1); return; }
    setSubmitting(true); setError('');
    const res = await SharedSizeQuiz.complete(token, answers);
    setSubmitting(false);
    if (!res.ok) { setError((res.body as any)?.message || 'We could not create your order.'); return; }
    setOrderNumber(res.body.order_number || '');
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#10100f] text-sm text-white/60">Loading your fit quiz…</main>;
  if (orderNumber) return <main className="grid min-h-screen place-items-center bg-[#10100f] p-6 text-center text-white"><div><p className="text-xs uppercase tracking-[.3em] text-amber-300">Order confirmed</p><h1 className="mt-3 font-serif text-4xl">You’re all set.</h1><p className="mt-4 text-white/65">Your order {orderNumber} has been created.</p></div></main>;
  if (error && !quiz) return <main className="grid min-h-screen place-items-center bg-[#10100f] p-6 text-center text-white"><p>{error}</p></main>;
  if (!question) return null;
  const imageURL = window.matchMedia('(prefers-color-scheme: dark)').matches ? illustration?.dark_url : illustration?.light_url;

  return <main className="min-h-screen bg-[#f4f1ea] px-5 py-10 text-[#201f1b] sm:py-16">
    <section className="mx-auto max-w-md">
      <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#817967]">Juno fit finder · {step + 1} / {questions.length}</p>
      <div className="mt-3 h-px bg-[#d9d1c3]"><div className="h-px bg-[#201f1b] transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
      <h1 className="mt-10 font-serif text-4xl leading-none">{question.label || question.question}</h1>
      {imageURL && <img src={imageURL} alt="Body shape choices" className="mt-7 max-h-44 w-full object-contain" />}
      <div className="mt-7 grid gap-2">
        {(question.options || []).map((option) => {
          const value = optionValue(option); const selected = answers[question.id] === value;
          return <button key={value} onClick={() => setAnswers((current) => ({ ...current, [question.id]: value }))} className={`rounded-sm border px-4 py-3 text-left text-sm transition ${selected ? 'border-[#201f1b] bg-[#201f1b] text-white' : 'border-[#cfc6b6] bg-white hover:border-[#201f1b]'}`}>{optionLabel(option)}</button>;
        })}
        {question.type === 'number' && <label className="flex items-center gap-3 rounded-sm border border-[#cfc6b6] bg-white px-4 py-3"><input type="number" min="36" max="96" value={answers[question.id] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="w-full bg-transparent text-sm outline-none" placeholder="Enter a whole number" /><span className="text-sm text-[#817967]">{question.unit}</span></label>}
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex gap-3"><button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || submitting} className="px-4 py-3 text-sm disabled:opacity-30">Back</button><button onClick={() => void next()} disabled={!canContinue || submitting} className="flex-1 rounded-sm bg-[#201f1b] px-4 py-3 text-sm text-white disabled:opacity-35">{submitting ? 'Creating order…' : step === questions.length - 1 ? 'Confirm my size' : 'Continue'}</button></div>
    </section>
  </main>;
};

export default SharedSizeQuizPage;
