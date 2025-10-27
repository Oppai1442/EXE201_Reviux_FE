import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export interface TestLogFormState {
  level: string;
  message: string;
}

interface TestLogFormProps {
  testLogForm: TestLogFormState;
  logLevels: string[];
  formSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  setTestLogForm: Dispatch<SetStateAction<TestLogFormState>>;
}

const TestLogForm = ({
  testLogForm,
  logLevels,
  formSubmitting,
  onSubmit,
  onCancel,
  setTestLogForm,
}: TestLogFormProps) => {
  return (
    <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
      <h3 className="text-lg font-light text-white mb-4">Add Test Log</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Log Level</label>
            <select
              value={testLogForm.level}
              onChange={(event) => setTestLogForm((prev) => ({ ...prev, level: event.target.value }))}
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {logLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-300">Message</label>
          <textarea
            value={testLogForm.message}
            onChange={(event) => setTestLogForm((prev) => ({ ...prev, message: event.target.value }))}
            rows={4}
            placeholder="Describe the outcome or error observed during testing"
            className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            required
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
            Save Log
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestLogForm;
