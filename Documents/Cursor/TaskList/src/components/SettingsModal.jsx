import { useState, useEffect } from 'react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Google Calendar auth state
  const [googleAuthStatus, setGoogleAuthStatus] = useState(null);
  const [isLoadingAuthStatus, setIsLoadingAuthStatus] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [isExchangingCode, setIsExchangingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('taskListApp_openaiKey') || '';
      setApiKey(savedKey);

      // Check Google auth status
      checkGoogleAuthStatus();
    }
  }, [isOpen]);

  const checkGoogleAuthStatus = async () => {
    setIsLoadingAuthStatus(true);
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const status = await response.json();
        setGoogleAuthStatus(status);
      } else {
        setGoogleAuthStatus({ connected: false, error: 'Failed to check status' });
      }
    } catch (error) {
      setGoogleAuthStatus({ connected: false, error: error.message });
    } finally {
      setIsLoadingAuthStatus(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/url');
      if (response.ok) {
        const data = await response.json();
        // Open auth URL in new tab
        window.open(data.authUrl, '_blank');
      } else {
        alert('Failed to get authorization URL');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleExchangeCode = async () => {
    if (!authCode.trim()) {
      alert('Please enter the authorization code');
      return;
    }

    setIsExchangingCode(true);
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Google Calendar connected successfully!');
        setAuthCode('');
        // Refresh auth status
        await checkGoogleAuthStatus();
      } else {
        const error = await response.json();
        alert('Failed to exchange code: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error exchanging code: ' + error.message);
    } finally {
      setIsExchangingCode(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('taskListApp_openaiKey', apiKey);
      onClose();
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('taskListApp_openaiKey');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Settings</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your API key is stored locally in your browser only. Never share it with others.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ API usage may incur costs. Use GPT-4o-mini for the lowest cost.
          </p>
        </div>

        {/* Google Calendar Integration */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Google Calendar Integration
          </h3>

          {/* Connection Status */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              {isLoadingAuthStatus ? (
                <span className="text-sm text-gray-500">Checking...</span>
              ) : googleAuthStatus ? (
                <span className={`text-sm ${googleAuthStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {googleAuthStatus.connected ? '✅ Connected' : '❌ Not Connected'}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Unknown</span>
              )}
            </div>

            {googleAuthStatus?.error && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                Error: {googleAuthStatus.error}
              </p>
            )}

            {!googleAuthStatus?.connected && (
              <div className="space-y-3">
                <button
                  onClick={handleConnectGoogle}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  🔗 Connect Google Calendar
                </button>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Authorization Code
                  </label>
                  <input
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Paste the code from Google here..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    After authorizing, you'll be redirected. Copy the 'code' parameter from the URL and paste it here.
                  </p>
                  <button
                    onClick={handleExchangeCode}
                    disabled={isExchangingCode || !authCode.trim()}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExchangingCode ? 'Exchanging...' : 'Exchange Code'}
                  </button>
                </div>
              </div>
            )}

            {googleAuthStatus?.connected && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Google Calendar is connected! You can now create calendar events from your tasks.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

