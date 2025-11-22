"use client";

import { useEffect, useState } from "react";

type LinkItem = {
  id: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  clicks: number;
  lastAccessedAt: string;
};

export default function Home() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/links");
        if (!res.ok) {
          throw new Error("Failed to load links");
        }

        const data = await res.json();

        const mapped: LinkItem[] = data.map((item: any) => ({
          id: item.id,
          shortUrl: item.code,
          originalUrl: item.originalUrl,
          createdAt: new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          clicks: item.clicks ?? 0,
          lastAccessedAt: item.lastAccessedAt
            ? new Date(item.lastAccessedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
            : "Never",
        }));

        setLinks(mapped);
      } catch (err: any) {
        console.error("Error fetching links", err);
        setError("Could not load links");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, []);

  useEffect(() => {
    const value = shortCode.trim();

    if (!value) {
      setCodeError(null);
      return;
    }

    const pattern = /^[A-Za-z0-9]{6,8}$/;
    if (!pattern.test(value)) {
      setCodeError("Code must be 6–8 characters, using only letters and numbers.");
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setIsCheckingCode(true);
        setCodeError(null);

        const res = await fetch(`/api/links/check?code=${encodeURIComponent(value)}`);
        if (!res.ok) {
          throw new Error("Failed to validate code");
        }

        const data = await res.json();
        if (!data.available) {
          setCodeError("This short URL code is already in use.");
        } else {
          setCodeError(null);
        }
      } catch (err) {
        console.error("Error checking code availability", err);
        setCodeError("Could not validate code.");
      } finally {
        setIsCheckingCode(false);
      }
    }, 1000);

    return () => clearTimeout(handle);
  }, [shortCode]);

  const handleVisitShortLink = async (code: string) => {
    const fullUrl = `${window.location.origin}/${code}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      }
    } catch (err) {
      console.error("Failed to copy short URL", err);
    }

    window.open(fullUrl, "_blank");
  };

  const handleCopyShortLink = async (code: string) => {
    const fullUrl = `${window.location.origin}/${code}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
        setCopiedCode(code);
        setTimeout(() => {
          setCopiedCode((current) => (current === code ? null : current));
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy short URL", err);
    }
  };

  const handleDeactivate = async (id: string, code: string) => {
    try {
      const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Failed to deactivate link", await res.text());
        return;
      }

      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err) {
      console.error("Error calling deactivate API", err);
    }
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setUrl("");
    setShortCode("");
    setUrlError(null);
  };

  const handleSubmitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim() || !shortCode.trim() || codeError || urlError) return;

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: url,
          code: shortCode.trim(),
          lastAccessedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error("Failed to create link", await res.text());
        return;
      }

      const created = await res.json();

      const newItem: LinkItem = {
        id: created.id,
        shortUrl: created.code,
        originalUrl: created.originalUrl,
        createdAt: new Date(created.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        clicks: created.clicks ?? 0,
        lastAccessedAt: new Date(created.lastAccessedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      };

      setLinks((prev) => [newItem, ...prev]);
      handleCloseCreate();
    } catch (err) {
      console.error("Error calling create link API", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              TinyLink
            </h1>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            type="button"
            onClick={handleOpenCreate}
          >
            Create link
          </button>
        </header>

        {/* Toolbar */}
        <section className="flex flex-col gap-3 rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Search links"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            </div>
          </div>


        </section>


        {/* Link cards */}
        <section className="flex flex-col gap-4">
          {isLoading && (
            <p className="text-sm text-slate-500">Loading links...</p>
          )}
          {error && !isLoading && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {(() => {
            const term = searchTerm.trim().toLowerCase();
            const filteredLinks = !term
              ? links
              : links.filter((link) => {
                const original = link.originalUrl.toLowerCase();
                const shortCodeVal = link.shortUrl.toLowerCase();
                return (
                  original.includes(term) || shortCodeVal.includes(term)
                );
              });

            if (!isLoading && !error && filteredLinks.length === 0) {
              return (
                <p className="text-sm text-slate-500">
                  {links.length === 0
                    ? "No links found."
                    : "No links match your search."}
                </p>
              );
            }

            return filteredLinks.map((link) => (
              <article
                key={link.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="mt-1 text-xs text-slate-500">
                      Created On: {link.createdAt}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Clicks Count: {link.clicks}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      LastAccessedAt: {link.lastAccessedAt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeactivate(link.id, link.shortUrl)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                        {link.originalUrl}
                      </h2>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="font-medium text-blue-600">
                        <button
                          type="button"
                          className="underline-offset-2 hover:underline"
                          onClick={() => handleVisitShortLink(link.shortUrl)}
                        >
                          {`${window.location.origin}/${link.shortUrl}`}
                        </button>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyShortLink(link.shortUrl)}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {copiedCode === link.shortUrl ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ));
          })()}
        </section>

        {/* End marker */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-400">
          <span className="h-px w-12 bg-slate-200" />
          <span>You&apos;ve reached the end of your links</span>
          <span className="h-px w-12 bg-slate-200" />
        </div>

        {/* Create link modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Create new link</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the destination URL you want to shorten.
              </p>

              <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Destination URL
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUrl(value);

                      if (!value.trim()) {
                        setUrlError("Destination URL is required.");
                        return;
                      }

                      try {
                        new URL(value);
                        setUrlError(null);
                      } catch {
                        setUrlError(
                          "Please enter a valid URL (including http:// or https://).",
                        );
                      }
                    }}
                    placeholder="https://example.com/my-long-url"
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {urlError && (
                    <p className="mt-1 text-xs text-red-500">{urlError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Short URL code
                  </label>
                  <input
                    type="text"
                    required
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value)}
                    placeholder="e.g. xqzqwp"
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs">
                    {isCheckingCode && !codeError && (
                      <span className="text-slate-500">Checking availability...</span>
                    )}
                    {!isCheckingCode && codeError && (
                      <span className="text-red-500">{codeError}</span>
                    )}
                    {!isCheckingCode && !codeError && shortCode.trim() && (
                      <span className="text-emerald-600">This code is available.</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseCreate}
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={
                      !url.trim() ||
                      !shortCode.trim() ||
                      !!codeError ||
                      !!urlError ||
                      isCheckingCode
                    }
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
