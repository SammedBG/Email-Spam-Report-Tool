import { useState } from "react"

export default function TestInstructions({ testCode, testInboxes, onClose }) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedAddresses, setCopiedAddresses] = useState(false)

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'code') {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else {
        setCopiedAddresses(true)
        setTimeout(() => setCopiedAddresses(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const emailAddresses = testInboxes.map(inbox => inbox.address).join(', ')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Test Instructions</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Test Code Section */}
          <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-300">Test Code</h4>
              <button
                onClick={() => copyToClipboard(testCode, 'code')}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              >
                {copiedCode ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-slate-800 border border-slate-600 rounded px-3 py-2 font-mono text-lg text-white">
              {testCode}
            </div>
            <p className="text-sm text-slate-300 mt-2">
              Include this code in your email's <strong>subject line</strong> and <strong>body</strong>
            </p>
          </div>

          {/* Test Inbox Addresses */}
          <div className="bg-green-950/30 border border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-300">Send Email To These Addresses</h4>
              <button
                onClick={() => copyToClipboard(emailAddresses, 'addresses')}
                className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-colors"
              >
                {copiedAddresses ? '✓ Copied!' : 'Copy All'}
              </button>
            </div>
            <div className="space-y-2">
              {testInboxes.map((inbox, index) => (
                <div key={index} className="bg-slate-800 border border-slate-600 rounded px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{inbox.provider}</span>
                      <span className="text-slate-400 ml-2">→</span>
                      <span className="font-mono text-green-300 ml-2">{inbox.address}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(inbox.address, 'single')}
                      className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4">
            <h4 className="font-semibold text-amber-300 mb-3">How to Test</h4>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Send an email from your own email account to all the addresses above</li>
              <li>Include the test code <code className="bg-slate-700 px-1 rounded">{testCode}</code> in both the subject and body</li>
              <li>Wait 2-3 minutes for delivery</li>
              <li>Click "Check Results" to see where your email landed</li>
            </ol>
          </div>

          {/* Tips */}
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">💡 Tips for Better Results</h4>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>Use a professional subject line</li>
              <li>Include some text content in the body</li>
              <li>Don't use spam trigger words</li>
              <li>Test with different email content</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Got it, Start Testing!
          </button>
        </div>
      </div>
    </div>
  )
}
