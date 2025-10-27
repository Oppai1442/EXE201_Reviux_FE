import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

import type { AssignableTester } from '../services/testingRequestService';

export interface AssignFormState {
  testerId: string;
  status: string;
  note: string;
}

interface AssignTesterFormProps {
  assignForm: AssignFormState;
  assignStatusOptions: string[];
  testerOptions: AssignableTester[];
  formSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  setAssignForm: Dispatch<SetStateAction<AssignFormState>>;
  formatStatusLabel: (status: string) => string;
}

const AssignTesterForm = ({
  assignForm,
  assignStatusOptions,
  testerOptions,
  formSubmitting,
  onSubmit,
  onCancel,
  setAssignForm,
  formatStatusLabel,
}: AssignTesterFormProps) => {
  return (
    <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
      <h3 className="text-lg font-light text-white mb-4">Assign Tester</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Tester</label>
            <select
              value={assignForm.testerId}
              onChange={(event) => setAssignForm((prev) => ({ ...prev, testerId: event.target.value }))}
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              required
            >
              <option value="">Select tester</option>
              {testerOptions.map((tester) => (
                <option key={tester.id} value={tester.id}>
                  {tester.fullName || tester.email || `User ${tester.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-300">Status</label>
            <select
              value={assignForm.status}
              onChange={(event) => setAssignForm((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {assignStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-300">Note (optional)</label>
          <textarea
            value={assignForm.note}
            onChange={(event) => setAssignForm((prev) => ({ ...prev, note: event.target.value }))}
            rows={3}
            placeholder="Optional message for this assignment"
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
            Assign
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignTesterForm;
