import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Terminal, Search, Download, Trash2, Play, Pause, Copy, Settings } from 'lucide-react';

type LogEntry = {
  id: number;
  timestamp: string;
  level: string;
  thread: string;
  logger: string;
  message: string;
  stackTrace: string[];
  formatted: string;
};

type IncomingLogPayload = Partial<LogEntry> & {
  formatted?: string;
  stackTrace?: string[] | null;
};

const MAX_LOG_ITEMS = 2000;
const RECONNECT_DELAY_MS = 2000;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildLogWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const base = new URL(apiUrl);
      const wsProtocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      const basePath = base.pathname.replace(/\/$/, '');
      base.protocol = wsProtocol;
      base.pathname = `${basePath}/ws/logs`;
      base.search = '';
      base.hash = '';
      return base.toString();
    } catch {
      // Fallback to window location below.
    }
  }
  const { protocol, host, pathname } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  const basePath = pathname.startsWith('/api') ? '/api' : '';
  return `${wsProtocol}//${host}${basePath}/ws/logs`;
};

const normaliseLogPayload = (data: IncomingLogPayload): LogEntry => {
  const timestamp = data.timestamp ?? new Date().toISOString();
  const level = (data.level ?? 'INFO').toUpperCase();
  const thread = data.thread ?? 'main';
  const logger = data.logger ?? 'application';
  const message = data.message ?? '';
  const stackTrace = Array.isArray(data.stackTrace) ? data.stackTrace : [];

  const baseFormatted = `${timestamp} ${level.padEnd(5)} [${thread}] ${logger} - ${message}`;
  const formatted =
    typeof data.formatted === 'string' && data.formatted.length > 0
      ? data.formatted
      : stackTrace.length > 0
        ? `${baseFormatted}\n${stackTrace.join('\n')}`
        : baseFormatted;

  const id =
    typeof data.id === 'number' && Number.isFinite(data.id)
      ? data.id
      : Date.now();

  return {
    id,
    timestamp,
    level,
    thread,
    logger,
    message,
    stackTrace,
    formatted
  };
};

const trimLogs = (items: LogEntry[]) => {
  if (items.length <= MAX_LOG_ITEMS) {
    return items;
  }
  return items.slice(items.length - MAX_LOG_ITEMS);
};

const ConsoleLogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [fontSize, setFontSize] = useState(12);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [bufferSize, setBufferSize] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const bufferRef = useRef<LogEntry[]>([]);
  const isStreamingRef = useRef(isStreaming);

  const logStreamUrl = useMemo(() => buildLogWebSocketUrl(), []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
    if (isStreaming && bufferRef.current.length > 0) {
      setLogs((prev) => trimLogs([...prev, ...bufferRef.current]));
      bufferRef.current = [];
      setBufferSize(0);
    }
  }, [isStreaming]);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      setConnectionState('connecting');
      try {
        const socket = new WebSocket(logStreamUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setConnectionState('open');
          setLastConnectedAt(new Date());
        };

        socket.onmessage = (event) => {
          let payload: IncomingLogPayload | null = null;
          try {
            payload = JSON.parse(event.data) as IncomingLogPayload;
          } catch {
            return;
          }

          if (!payload) {
            return;
          }

          const entry = normaliseLogPayload(payload);
          if (isStreamingRef.current) {
            setLogs((prev) => trimLogs([...prev, entry]));
          } else {
            bufferRef.current.push(entry);
            setBufferSize(bufferRef.current.length);
          }
        };

        socket.onerror = () => {
          setConnectionState('error');
          socket.close();
        };

        socket.onclose = (_event) => {
          if (!shouldReconnectRef.current) {
            setConnectionState('closed');
            return;
          }

          setConnectionState('connecting');
          if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
        };
      } catch {
        setConnectionState('error');
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounted');
        } catch {
          // Ignore close failures.
        }
        wsRef.current = null;
      }
    };
  }, [logStreamUrl]);

  useEffect(() => {
    if (!autoScroll || !logContainerRef.current) {
      return;
    }
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) {
      return logs;
    }
    const query = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const formattedMatch = log.formatted.toLowerCase().includes(query);
      if (formattedMatch) {
        return true;
      }
      return log.stackTrace.some((line) => line.toLowerCase().includes(query));
    });
  }, [logs, searchQuery]);

  const getLogColor = useCallback((level: string) => {
    switch ((level ?? '').toUpperCase()) {
      case 'ERROR':
        return 'text-red-400';
      case 'WARN':
        return 'text-yellow-400';
      case 'DEBUG':
        return 'text-cyan-400';
      case 'TRACE':
        return 'text-purple-400';
      default:
        return 'text-green-400';
    }
  }, []);

  const highlightText = useCallback((text: string) => {
    if (!searchQuery.trim()) {
      return text;
    }
    const pattern = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
    const fragments = text.split(pattern);
    return fragments.map((fragment, index) => {
      if (index % 2 === 1) {
        return (
          <mark key={`${fragment}-${index}`} className="bg-cyan-500/30 text-cyan-200 rounded-sm px-0.5">
            {fragment}
          </mark>
        );
      }
      return fragment;
    });
  }, [searchQuery]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    bufferRef.current = [];
    setBufferSize(0);
  }, []);

  const handleDownloadLogs = useCallback(() => {
    if (logs.length === 0) {
      return;
    }
    const content = logs.map((log) => log.formatted).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `console-logs-${new Date().toISOString()}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const handleCopyAll = useCallback(() => {
    if (logs.length === 0) {
      return;
    }
    const content = logs.map((log) => log.formatted).join('\n\n');
    void navigator.clipboard.writeText(content);
  }, [logs]);

  const handleToggleStreaming = useCallback(() => {
    setIsStreaming((prev) => !prev);
  }, []);

  const connectionLabel = useMemo(() => {
    console.log(connectionState)
    switch (connectionState) {
      case 'open':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection error';
      case 'closed':
      default:
        return 'Disconnected';
    }
  }, [connectionState]);

  const lastLogTimestamp = logs.length > 0 ? logs[logs.length - 1].timestamp : '—';

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">

      {[...Array(15)].map((_, index) => (
        <div
          key={index}
          className="fixed w-1 h-1 bg-cyan-400/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          }}
        />
      ))}

      <div className="flex-1 flex flex-col">
        <nav className="border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-md">
          <div className="max-w-full mx-auto px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span className="text-lg font-light">Live Console</span>
              <div className="flex items-center gap-2 ml-4">
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-xs text-gray-400 font-light">
                  {isStreaming ? 'Streaming' : 'Paused'}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4 text-xs text-gray-400 font-light">
                <span className="text-cyan-400">{connectionLabel}</span>
                {bufferSize > 0 && (
                  <span className="rounded-full bg-cyan-500/10 text-cyan-300 px-2 py-0.5">
                    Buffered: {bufferSize}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="bg-gray-900/50 border border-gray-800/50 rounded-lg pl-9 pr-4 py-1.5 text-sm font-light focus:outline-none focus:border-cyan-500/50 transition-colors w-64"
                />
              </div>

              <button
                onClick={() => setShowSettings((value) => !value)}
                className="p-2 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:border-cyan-500/50 transition-all duration-300"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopyAll}
                className="p-2 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:border-cyan-500/50 transition-all duration-300"
                title="Copy All"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownloadLogs}
                className="p-2 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:border-cyan-500/50 transition-all duration-300"
                title="Download Logs"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleStreaming}
                className="px-3 py-1.5 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm font-light hover:border-cyan-500/50 transition-all duration-300 flex items-center gap-2"
              >
                {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isStreaming ? 'Pause' : 'Resume'}
              </button>

              <button
                onClick={handleClearLogs}
                className="p-2 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:border-red-500/50 transition-all duration-300"
                title="Clear Console"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="border-t border-gray-800/50 bg-gray-900/70 backdrop-blur-sm px-6 py-3">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400 font-light">Font Size:</label>
                  <input
                    type="range"
                    min="10"
                    max="16"
                    value={fontSize}
                    onChange={(event) => setFontSize(Number(event.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-cyan-400 font-light w-8">{fontSize}px</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoscroll"
                    checked={autoScroll}
                    onChange={(event) => setAutoScroll(event.target.checked)}
                    className="w-4 h-4 rounded border-gray-800/50 bg-gray-950/50 text-cyan-500"
                  />
                  <label htmlFor="autoscroll" className="text-sm text-gray-400 font-light cursor-pointer">
                    Auto-scroll
                  </label>
                </div>

                <div className="text-sm text-gray-500 font-light ml-auto">
                  {filteredLogs.length.toLocaleString()} / {logs.length.toLocaleString()} lines
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-800/40 bg-gray-900/60 px-6 py-2 flex items-center justify-between text-xs text-gray-400 font-light">
            <div className="flex items-center gap-4">
              <span>Endpoint: {logStreamUrl}</span>
              <span>|</span>
              <span>Last log: {lastLogTimestamp}</span>
              {lastConnectedAt && (
                <>
                  <span>|</span>
                  <span>Connected at: {lastConnectedAt.toLocaleTimeString()}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>Total: {logs.length.toLocaleString()}</span>
              <span>|</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </nav>
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto bg-gray-950 font-mono scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-950"
          style={{ fontSize: `${fontSize}px` }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 font-light">
              <div className="text-center">
                <Terminal className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No logs to display</p>
                <p className="text-sm mt-2 text-gray-600">
                  {logs.length === 0 ? 'Waiting for console output...' : 'No results found for your search'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {filteredLogs.map((log) => {
                const lines = log.formatted.split(/\r?\n/);
                return (
                  <div
                    key={log.id}
                    className={`${getLogColor(log.level)} leading-relaxed hover:bg-gray-900/30 px-2 py-1 -mx-2 transition-colors`}
                  >
                    {lines.map((line, index) => (
                      <pre
                        key={`${log.id}-${index}`}
                        className={`whitespace-pre-wrap ${index === 0 ? '' : 'text-gray-400'}`}
                      >
                        {highlightText(line)}
                      </pre>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>



      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 12px;
        }

        .scrollbar-thumb-gray-800::-webkit-scrollbar-thumb {
          background-color: #1f2937;
          border-radius: 6px;
          border: 3px solid #030712;
        }

        .scrollbar-thumb-gray-800::-webkit-scrollbar-thumb:hover {
          background-color: #374151;
        }

        .scrollbar-track-gray-950::-webkit-scrollbar-track {
          background-color: #030712;
        }
      `}</style>
    </div>
  );
};

export default ConsoleLogViewer;
