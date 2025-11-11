'use client'

import { useState } from 'react'
import { X, Printer, Download } from 'lucide-react'

interface ReceiptData {
  id: string
  type: 'payment' | 'commission'
  amount: number
  description: string
  date: string
  status: string
  reference?: string
  payer?: string
  payee?: string
  course?: string
  commission?: number
}

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  receipt: ReceiptData | null
  userType: 'student' | 'mentor'
}

export default function ReceiptModal({ isOpen, onClose, receipt, userType }: ReceiptModalProps) {
  if (!isOpen || !receipt) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable version of the receipt
    const printContent = document.getElementById('receipt-content')?.innerHTML
    if (printContent) {
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - CodeLab Educare</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              background: #f9fafb;
              padding: 20px;
              line-height: 1.6;
            }
            
            .receipt-container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .receipt-header { 
              text-align: center; 
              padding: 24px 16px;
              border-bottom: 2px dashed #d1d5db;
              background: #fafafa;
            }
            
            .company-logo {
              margin-bottom: 12px;
            }
            
            .company-logo div {
              width: 64px;
              height: 64px;
              margin: 0 auto;
              background: #2563eb;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .company-logo span {
              color: white;
              font-weight: 700;
              font-size: 20px;
            }
            
            .receipt-body {
              padding: 16px;
            }
            
            .transaction-type {
              text-align: center;
              margin-bottom: 16px;
            }
            
            .receipt-details {
              margin-bottom: 24px;
            }
            
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .detail-row:last-child {
              border-bottom: none;
            }
            
            .amount-section {
              border-top: 2px dashed #d1d5db;
              padding-top: 16px;
              margin-top: 24px;
            }
            
            .amount-display {
              text-align: center;
            }
            
            .amount-value {
              font-size: 32px;
              font-weight: 700;
              color: #111827;
              margin: 8px 0;
            }
            
            .receipt-footer { 
              text-align: center; 
              padding: 16px;
              border-top: 2px dashed #d1d5db;
              background: #f9fafb;
              font-size: 12px;
              color: #6b7280;
            }
            
            .receipt-number {
              background: #f3f4f6;
              border-radius: 4px;
              padding: 4px 12px;
              display: inline-block;
              font-family: 'Courier New', monospace;
            }
            
            .status-badge {
              font-size: 10px;
              font-weight: 500;
              padding: 2px 8px;
              border-radius: 12px;
            }
            
            .status-completed {
              background: #dcfce7;
              color: #166534;
            }
            
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            
            .reference-code {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              color: #6b7280;
              background: #f9fafb;
              padding: 2px 6px;
              border-radius: 3px;
            }
            
            @media print {
              body { 
                background: white; 
                padding: 0;
              }
              .receipt-container { 
                box-shadow: none; 
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `], { type: 'text/html' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receipt.id.slice(-8).toUpperCase()}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {userType === 'student' ? 'Payment Receipt' : 'Commission Receipt'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div id="receipt-content" className="p-6 bg-white">
          {/* Receipt Container with proper receipt styling */}
          <div className="receipt-container max-w-sm mx-auto bg-white border-2 border-gray-300 shadow-lg">
            {/* Receipt Header */}
            <div className="receipt-header text-center py-6 px-4 border-b-2 border-gray-300 border-dashed">
              <div className="company-logo mb-3">
                <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">CL</span>
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">CodeLab Educare</h1>
              <p className="text-sm text-gray-600 mb-2">EdTech Payment Platform</p>
              <div className="receipt-number bg-gray-100 rounded px-3 py-1 inline-block">
                <span className="text-xs font-mono text-gray-700">
                  Receipt #{receipt.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="receipt-body p-4">
              {/* Transaction Type Header */}
              <div className="transaction-type text-center mb-4">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  receipt.type === 'payment' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {receipt.type === 'payment' ? '💳 Course Payment' : '💰 Mentor Commission'}
                </div>
              </div>

              {/* Receipt Details */}
              <div className="receipt-details space-y-3">
                <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Date:</span>
                  <span className="text-sm font-mono text-gray-900">{receipt.date}</span>
                </div>
                
                <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Transaction Type:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {receipt.type === 'payment' ? 'Course Payment' : 'Mentor Commission'}
                  </span>
                </div>

                <div className="detail-row flex flex-col py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium mb-1">Description:</span>
                  <span className="text-sm text-gray-900 leading-relaxed">{receipt.description}</span>
                </div>

                {receipt.course && (
                  <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Course:</span>
                    <span className="text-sm font-medium text-gray-900">{receipt.course}</span>
                  </div>
                )}

                {receipt.payer && (
                  <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Student:</span>
                    <span className="text-sm font-medium text-gray-900">{receipt.payer}</span>
                  </div>
                )}

                {receipt.payee && (
                  <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Mentor:</span>
                    <span className="text-sm font-medium text-gray-900">{receipt.payee}</span>
                  </div>
                )}

                {receipt.commission && (
                  <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Commission Rate:</span>
                    <span className="text-sm font-medium text-blue-600">{receipt.commission}%</span>
                  </div>
                )}

                <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Status:</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    receipt.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {receipt.status}
                  </span>
                </div>

                {receipt.reference && (
                  <div className="detail-row flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Reference:</span>
                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {receipt.reference}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount Section */}
              <div className="amount-section mt-6 pt-4 border-t-2 border-gray-300 border-dashed">
                <div className="amount-display text-center">
                  <div className="amount-label text-sm text-gray-600 mb-1">
                    {receipt.type === 'payment' ? 'Amount Paid' : 'Commission Earned'}
                  </div>
                  <div className="amount-value text-3xl font-bold text-gray-900">
                    ₦{receipt.amount.toLocaleString()}
                  </div>
                  <div className="amount-currency text-sm text-gray-500 mt-1">
                    Nigerian Naira
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="receipt-footer text-center py-4 px-4 border-t-2 border-gray-300 border-dashed bg-gray-50">
              <div className="thank-you mb-2">
                <span className="text-sm text-gray-700">Thank you for using</span>
                <span className="text-sm font-semibold text-blue-600"> CodeLab Educare!</span>
              </div>
              <div className="support-info text-xs text-gray-500 mb-2">
                For support: support@codelabeducare.com
              </div>
              <div className="generated-info text-xs text-gray-400">
                Generated: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span className="font-medium">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span className="font-medium">Print</span>
          </button>
        </div>
      </div>
    </div>
  )
}
