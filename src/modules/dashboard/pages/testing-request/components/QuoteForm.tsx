import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export interface QuoteFormState {
  amount: string;
  currency: string;
  expiryDays: string;
  notes: string;
}

interface QuoteFormProps {
  quoteForm: QuoteFormState;
  setQuoteForm: Dispatch<SetStateAction<QuoteFormState>>;
  formSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const QuoteForm = ({ quoteForm, setQuoteForm, formSubmitting, onSubmit, onCancel }: QuoteFormProps) => {
  return (
    <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
      <h3 className="text-lg font-light text-white mb-4">Send Quote</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Quoted Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={quoteForm.amount}
              onChange={(event) =>
                setQuoteForm((prev) => ({
                  ...prev,
                  amount: event.target.value,
                }))
              }
              placeholder="Enter total testing fee"
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Currency</label>
            <input
              type="text"
              value={quoteForm.currency}
              onChange={(event) =>
                setQuoteForm((prev) => ({
                  ...prev,
                  currency: event.target.value.toUpperCase(),
                }))
              }
              maxLength={8}
              placeholder="USD"
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 uppercase"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-300">Quote expiry (days)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={quoteForm.expiryDays}
            onChange={(event) =>
              setQuoteForm((prev) => ({
                ...prev,
                expiryDays: event.target.value,
              }))
            }
            placeholder="7"
            className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
          <p className="text-xs text-gray-500">
            Leave blank to skip expiry. Customers will still be reminded to act promptly.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-300">Notes</label>
          <textarea
            value={quoteForm.notes}
            onChange={(event) =>
              setQuoteForm((prev) => ({
                ...prev,
                notes: event.target.value,
              }))
            }
            rows={4}
            placeholder="Highlight the scope included in this pricing or special considerations."
            className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-800/60 px-4 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-gray-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Send Quote
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;

