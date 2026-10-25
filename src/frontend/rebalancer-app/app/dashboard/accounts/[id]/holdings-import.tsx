'use client';

import { useState } from 'react';
import { Holding, HoldingImportRow, Security } from '@/app/lib/definitions';
import { previewHoldingImport, applyHoldingImport } from '@/app/lib/api';

type Props = {
  accountId: number;
  holdings: Holding[];
  securities: Security[];
  onClose: () => void;
  onImported: () => Promise<void>;
};

// Row from the file plus the security the user has chosen for it (0 = skip)
type ImportRow = HoldingImportRow & { chosenId: number };

const formatShares = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value);

export default function HoldingsImport({
  accountId,
  holdings,
  securities,
  onClose,
  onImported,
}: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [removeMissing, setRemoveMissing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setBusy(true);
    try {
      const preview = await previewHoldingImport(accountId, await file.text());
      setRows(preview.rows.map((r) => ({ ...r, chosenId: r.securityId ?? 0 })));
      setWarnings(preview.warnings);
    } catch (err) {
      setError('Failed to read file');
      setRows(null);
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const currentShares = new Map<number, number>();
  for (const h of holdings) {
    currentShares.set(
      h.securityId,
      (currentShares.get(h.securityId) ?? 0) + h.shares,
    );
  }

  // Two file rows mapped to the same security are combined
  const sharesToImport = new Map<number, number>();
  for (const r of rows ?? []) {
    if (r.chosenId > 0)
      sharesToImport.set(
        r.chosenId,
        (sharesToImport.get(r.chosenId) ?? 0) + r.shares,
      );
  }

  const missing = holdings.filter((h) => !sharesToImport.has(h.securityId));
  const unmatchedCount = rows?.filter((r) => r.chosenId === 0).length ?? 0;

  const describeChange = (row: ImportRow) => {
    if (row.chosenId === 0)
      return <span className="text-gray-400">Skipped</span>;
    const current = currentShares.get(row.chosenId);
    if (current === undefined)
      return <span className="text-green-700">New</span>;
    if (Math.abs(current - sharesToImport.get(row.chosenId)!) < 0.00005)
      return <span className="text-gray-500">Unchanged</span>;
    return (
      <span className="text-blue-700">
        {formatShares(current)} →{' '}
        {formatShares(sharesToImport.get(row.chosenId)!)}
      </span>
    );
  };

  const handleApply = async () => {
    setBusy(true);
    setError(null);
    try {
      await applyHoldingImport(accountId, {
        items: Array.from(sharesToImport, ([securityId, shares]) => ({
          securityId,
          shares,
        })),
        removeMissing,
      });
      await onImported();
      onClose();
    } catch (err) {
      setError('Failed to import holdings');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-md bg-gray-50 p-4">
      <h3 className="mb-1 font-semibold">Import from Quicken</h3>
      <p className="mb-3 text-sm text-gray-600">
        In Quicken, run a Portfolio Value report for just this account and
        export it as CSV. Share counts in this account will be set to match the
        file; prices still come from Refresh Prices.
      </p>

      <label className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 hover:bg-gray-100">
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          disabled={busy}
        />
        {fileName ? 'Choose a different file' : 'Choose file...'}
      </label>
      {fileName && (
        <span className="ml-3 text-sm text-gray-600">{fileName}</span>
      )}

      {error && (
        <div className="mb-3 rounded border border-red-400 bg-red-100 px-4 py-2 text-red-700">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mb-3 list-inside list-disc rounded border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {rows && rows.length > 0 && (
        <>
          {unmatchedCount > 0 && (
            <p className="mb-2 text-sm text-yellow-800">
              {unmatchedCount} row{unmatchedCount === 1 ? '' : 's'} didn&apos;t
              match a security. Pick one from the list, or add it on the
              Securities page and re-import. Unmatched rows are skipped.
            </p>
          )}
          <div className="mb-3 overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left">In file</th>
                  <th className="px-3 py-2 text-right">Shares</th>
                  <th className="px-3 py-2 text-left">Security</th>
                  <th className="px-3 py-2 text-left">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.line}
                    className={`border-b ${
                      row.chosenId === 0 ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      {row.ticker && (
                        <span className="mr-2 font-medium">{row.ticker}</span>
                      )}
                      {row.name}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatShares(row.shares)}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.chosenId}
                        onChange={(e) =>
                          setRows(
                            rows.map((r, j) =>
                              j === i
                                ? { ...r, chosenId: Number(e.target.value) }
                                : r,
                            ),
                          )
                        }
                        className="w-full rounded-md border px-2 py-1"
                      >
                        <option value={0}>Skip</option>
                        {securities.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.ticker} - {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">{describeChange(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {missing.length > 0 && (
            <label className="mb-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={removeMissing}
                onChange={(e) => setRemoveMissing(e.target.checked)}
                className="mt-1"
              />
              <span>
                Remove holdings not in the file:{' '}
                <span className="text-gray-600">
                  {missing
                    .map((h) => `${h.ticker} (${formatShares(h.shares)})`)
                    .join(', ')}
                </span>
              </span>
            </label>
          )}
        </>
      )}

      {rows && rows.length === 0 && warnings.length === 0 && (
        <p className="mb-3 text-sm text-gray-600">
          No holdings found in this file.
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={busy || !rows || sharesToImport.size === 0}
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? 'Working...'
            : `Import ${sharesToImport.size} holding${
                sharesToImport.size === 1 ? '' : 's'
              }`}
        </button>
        <button
          onClick={onClose}
          className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
