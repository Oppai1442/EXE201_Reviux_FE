import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  X,
  FileArchive,
  Calendar,
  AlertCircle,
  Info,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  submitTestingRequestAPI,
  type SubmitTestingRequestPayload,
} from "../services/testingRequestService";
import { getTokenCostForType } from "../utils/tokenCost";
import type { UserTokenInfo } from "../services/userTokenService";

interface QATestingFormProps {
  onClose: () => void;
  onSubmitted?: () => void;
  tokenInfo?: UserTokenInfo | null;
  onRequireTokens?: (requiredTokens: number) => void;
}

interface LocalFormState {
  title: string;
  description: string;
  testingTypes: string[];
  scopeAllocations: Record<string, number>;
  deadline: string;
  referenceUrl: string;
  archive: File | null;
}

const TESTING_OPTIONS = [
  "Functional Testing",
  "Performance Testing",
  "Security Testing",
  "Usability Testing",
  "Compatibility Testing",
  "Regression Testing",
  "API Testing",
  "UI/UX Testing",
];

const FILE_EXTENSIONS = [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"];

const QATestingForm: React.FC<QATestingFormProps> = ({
  onClose,
  onSubmitted,
  tokenInfo,
  onRequireTokens,
}) => {
  const [formState, setFormState] = useState<LocalFormState>({
    title: "",
    description: "",
    testingTypes: [],
    scopeAllocations: {},
    deadline: "",
    referenceUrl: "",
    archive: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isValid = useMemo(() => {
    return (
      formState.title.trim().length >= 3 &&
      formState.description.trim().length >= 10 &&
      formState.testingTypes.length > 0
    );
  }, [formState]);

  const requiredTokens = useMemo(() => {
    if (formState.testingTypes.length === 0) {
      return 0;
    }
    return formState.testingTypes.reduce((total, type) => {
      const allocation = formState.scopeAllocations[type];
      if (typeof allocation === "number" && allocation > 0) {
        return total + allocation;
      }
      return total + getTokenCostForType(type);
    }, 0);
  }, [formState.testingTypes, formState.scopeAllocations]);

  const handleToggleType = (option: string) => {
    setFormState((prev) => {
      const exists = prev.testingTypes.includes(option);
      if (exists) {
        const { [option]: _removed, ...rest } = prev.scopeAllocations;
        return {
          ...prev,
          testingTypes: prev.testingTypes.filter((item) => item !== option),
          scopeAllocations: rest,
        };
      }
      const defaultTokens = getTokenCostForType(option);
      return {
        ...prev,
        testingTypes: [...prev.testingTypes, option],
        scopeAllocations: {
          ...prev.scopeAllocations,
          [option]: defaultTokens,
        },
      };
    });
  };

  const handleScopeTokenChange = (option: string, value: number) => {
    const sanitized = Number.isNaN(value) ? 1 : Math.max(1, Math.round(value));
    setFormState((prev) => ({
      ...prev,
      scopeAllocations: {
        ...prev.scopeAllocations,
        [option]: sanitized,
      },
    }));
  };

  const handleScopeTokenStep = (option: string, delta: number) => {
    setFormState((prev) => {
      const current = prev.scopeAllocations[option] ?? getTokenCostForType(option);
      const next = Math.max(1, current + delta);
      return {
        ...prev,
        scopeAllocations: {
          ...prev.scopeAllocations,
          [option]: next,
        },
      };
    });
  };

  const validateArchive = (file: File) => {
    const lower = file.name.toLowerCase();
    const valid = FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!valid) {
      toast.error("Please upload a compressed archive (.zip, .rar, .7z, .tar, .gz, .bz2).");
      return false;
    }
    return true;
  };

  const handleSelectArchive = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    if (!validateArchive(file)) {
      return;
    }
    setFormState((prev) => ({ ...prev, archive: file }));
  };

  const handleDropArchive = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const { files } = event.dataTransfer;
    handleSelectArchive(files);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      toast.error("Please fill all required fields before submitting.");
      return;
    }

    const scopePayload = formState.testingTypes.map((type) => ({
      type,
      tokens: Math.max(1, formState.scopeAllocations[type] ?? getTokenCostForType(type)),
    }));

    const payload: SubmitTestingRequestPayload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      testingTypes: formState.testingTypes,
      testingScope: scopePayload.length ? scopePayload : undefined,
      requestedTokenFee: requiredTokens > 0 ? requiredTokens : undefined,
      deadline: formState.deadline || undefined,
      referenceUrl: formState.referenceUrl.trim() || undefined,
      archive: formState.archive,
    };

    try {
      setIsSubmitting(true);
      if (tokenInfo && tokenInfo.remainingTokens < requiredTokens) {
        toast.error("Not enough tokens to submit this request.");
        onRequireTokens?.(requiredTokens);
        return;
      }
      await submitTestingRequestAPI(payload);
      toast.success("Testing request submitted successfully.");
      onSubmitted?.();
      onClose();
    } catch (error: unknown) {
      console.error("Failed to submit testing request", error);
      toast.error("Failed to submit testing request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-white">New Testing Request</h2>
          <p className="mt-1 text-sm text-gray-400">
            Provide context and assets so our QA team can prepare the right test plan.
          </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 transition-colors duration-200 hover:text-white"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

      <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Estimated token cost</p>
            <p className="text-lg font-medium text-white">{requiredTokens} token(s)</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Remaining tokens</p>
            <p className="text-lg font-medium text-white">
              {tokenInfo ? `${tokenInfo.remainingTokens} / ${tokenInfo.totalTokens}` : "--"}
            </p>
          </div>
          <div className="text-sm text-gray-400">
            Plan:{" "}
            <span className="text-cyan-200">
              {(tokenInfo?.planType ?? "FREE").toString().toUpperCase()}
            </span>
          </div>
        </div>
        {tokenInfo && tokenInfo.remainingTokens < requiredTokens ? (
          <p className="mt-3 text-sm text-amber-300">
            Not enough tokens. Purchase additional tokens or adjust the selected testing scope.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="e.g. Checkout flow audit"
              className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              Deadline (optional)
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="date"
                value={formState.deadline}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, deadline: event.target.value }))
                }
                className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-3 pl-10 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Reference Link (optional)</label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="url"
                value={formState.referenceUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, referenceUrl: event.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-3 pl-10 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              Testing Scope <span className="text-rose-400">*</span>
              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                className="rounded-full border border-gray-800/60 p-1 text-gray-400 transition hover:border-cyan-500/40 hover:text-cyan-200"
                aria-label="Toggle guidance"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </label>
            {showGuide && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">
                Select the types of testing you would like us to prioritise. You can combine
                multiple options to capture the full scope.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {TESTING_OPTIONS.map((option) => {
                const isSelected = formState.testingTypes.includes(option);
                const cost = getTokenCostForType(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleToggleType(option)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors duration-200 ${
                      isSelected
                        ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200"
                        : "border-gray-800/60 bg-gray-900/50 text-gray-400 hover:border-cyan-500/30 hover:text-cyan-200"
                    }`}
                  >
                    <span>{option}</span>
                    <span className="ml-2 rounded-full bg-gray-800/80 px-2 py-0.5 text-[10px] uppercase text-gray-300">
                      {cost} token{cost > 1 ? "s" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            {formState.testingTypes.length > 0 && (
              <div className="mt-4 space-y-3 rounded-xl border border-gray-800/60 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Token allocation</div>
                <p className="text-xs text-gray-400">
                  Increase tokens for a scope if you want the QA team to dedicate more effort to that area.
                </p>
                <div className="space-y-3">
                  {formState.testingTypes.map((type) => {
                    const current = formState.scopeAllocations[type] ?? getTokenCostForType(type);
                    const baseline = getTokenCostForType(type);
                    return (
                      <div key={type} className="flex flex-col gap-2 rounded-lg border border-gray-800/50 bg-gray-900/40 p-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{type}</div>
                          <div className="text-xs text-gray-500">Default allocation: {baseline} token{baseline > 1 ? "s" : ""}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleScopeTokenStep(type, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-800/60 bg-gray-900/60 text-gray-300 transition-colors duration-200 hover:border-cyan-500/50 hover:text-cyan-200"
                            aria-label={`Decrease token allocation for ${type}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={current}
                            onChange={(event) => handleScopeTokenChange(type, Number(event.target.value))}
                            className="w-20 rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-1 text-center text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleScopeTokenStep(type, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-800/60 bg-gray-900/60 text-gray-300 transition-colors duration-200 hover:border-cyan-500/50 hover:text-cyan-200"
                            aria-label={`Increase token allocation for ${type}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              Upload Assets (optional)
            </label>
            <label
              htmlFor="archive-upload"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropArchive}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-200 ${
                isDragging
                  ? "border-cyan-500/80 bg-cyan-500/10"
                  : "border-gray-800/60 bg-gray-900/40 hover:border-cyan-500/40"
              }`}
            >
              <Upload className="h-8 w-8 text-cyan-300" />
              <div className="text-sm text-gray-300">
                Drag & drop archive here or <span className="text-cyan-300 underline">browse</span>
              </div>
              <p className="text-xs text-gray-500">
                Accepted formats: {FILE_EXTENSIONS.join(", ")}
              </p>
              <input
                id="archive-upload"
                ref={fileInputRef}
                type="file"
                accept={FILE_EXTENSIONS.join(",")}
                className="hidden"
                onChange={(event) => handleSelectArchive(event.target.files)}
              />
            </label>
            {formState.archive && (
              <div className="flex items-center justify-between rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-gray-200">
                <div className="flex items-center gap-2">
                  <FileArchive className="h-4 w-4 text-cyan-300" />
                  <span className="truncate">{formState.archive.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, archive: null }))}
                  className="text-gray-400 transition-colors duration-200 hover:text-rose-400"
                  aria-label="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-400">
          Description <span className="text-rose-400">*</span>
        </label>
        <textarea
          value={formState.description}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, description: event.target.value }))
          }
          rows={6}
          placeholder="Describe the flows, environments, or recent changes you would like us to focus on."
          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      {!isValid && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            Provide a project name, description, and at least one testing type so our team knows
            where to begin.
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-800/60 px-4 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-gray-700 hover:text-white"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <FileArchive className="h-4 w-4" />
              Submit Request
            </>
          )}
        </button>
      </div>
    </form>
          <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-spin {
          animation: spin 1s linear;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </>
  );
};

export default QATestingForm;
