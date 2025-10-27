import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

import type { AssignableTester } from '../services/testingRequestService';

export interface BugReportFormState {
  title: string;
  description: string;
  severity: string;
  status: string;
  testerId: string;
}

interface BugReportFormProps {
  bugReportForm: BugReportFormState;
  formSubmitting: boolean;
  severityOptions: string[];
  statusOptions: string[];
  testerOptions: AssignableTester[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  setBugReportForm: Dispatch<SetStateAction<BugReportFormState>>;
  formatStatusLabel: (status: string) => string;
}

const BugReportForm = ({
  bugReportForm,
  formSubmitting,
  severityOptions,
  statusOptions,
  testerOptions,
  onSubmit,
  onCancel,
  setBugReportForm,
  formatStatusLabel,
}: BugReportFormProps) => {
  return (
    <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
      <h3 className="text-lg font-light text-white mb-4">Add Bug Report</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Severity</label>
            <select
              value={bugReportForm.severity}
              onChange={(event) => setBugReportForm((prev) => ({ ...prev, severity: event.target.value }))}
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Status</label>
            <select
              value={bugReportForm.status}
              onChange={(event) => setBugReportForm((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Assign Tester (optional)</label>
            <select
              value={bugReportForm.testerId}
              onChange={(event) => setBugReportForm((prev) => ({ ...prev, testerId: event.target.value }))}
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Unassigned</option>
              {testerOptions.map((tester) => (
                <option key={tester.id} value={tester.id}>
                  {tester.fullName || tester.email || `User ${tester.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-300">Title</label>
          <input
            type="text"
            value={bugReportForm.title}
            onChange={(event) => setBugReportForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Short summary of the issue"
            className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-300">Description</label>
          <textarea
            value={bugReportForm.description}
            onChange={(event) => setBugReportForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={4}
            placeholder="Detailed steps to reproduce, expected vs actual behavior."
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
            Create Bug Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default BugReportForm;
