'use client';

import { useEffect, useState } from 'react';

const buildNumber = process.env.NEXT_PUBLIC_BUILD_NUMBER || 'dev';
const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || '';
const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || '';

export default function BuildInfo() {
  // Formatted after mount so it uses the viewer's time zone, not the server's
  const [builtAt, setBuiltAt] = useState<string | null>(null);

  useEffect(() => {
    if (!buildTime) return;
    setBuiltAt(
      new Date(buildTime).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    );
  }, []);

  return (
    <div
      className="mt-2 hidden text-center text-xs text-gray-400 md:block"
      title={commitSha}
    >
      <div>
        Build {buildNumber}
        {commitSha && ` · ${commitSha.slice(0, 7)}`}
      </div>
      {builtAt && <div>{builtAt}</div>}
    </div>
  );
}
