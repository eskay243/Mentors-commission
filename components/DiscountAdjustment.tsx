'use client'

import { useState, useEffect } from 'react'
import { Percent, DollarSign, X, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DiscountAdjustmentProps {
  originalAmount: number
  currentAmount: number
  onAmountChange: (newAmount: number, discountType: 'percentage' | 'fixed' | 'none', discountValue: number) => void
  disabled?: boolean
}

export default function DiscountAdjustment({ 
  originalAmount, 
  currentAmount, 
  onAmountChange, 
  disabled = false 
}: DiscountAdjustmentProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate discount amount and final amount
  const calculateDiscount = () => {
    if (discountType === 'none') return { discountAmount: 0, finalAmount: originalAmount }
    
    let discountAmount = 0
    if (discountType === 'percentage') {
      discountAmount = (originalAmount * discountValue) / 100
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(discountValue, originalAmount) // Don't allow discount > original amount
    }
    
    const finalAmount = Math.max(0, originalAmount - discountAmount)
    return { discountAmount, finalAmount }
  }

  const { discountAmount, finalAmount } = calculateDiscount()

  // Update parent when discount changes
  useEffect(() => {
    onAmountChange(finalAmount, discountType, discountValue)
  }, [finalAmount, discountType, discountValue])

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed' | 'none') => {
    setDiscountType(type)
    if (type === 'none') {
      setDiscountValue(0)
    }
  }

  const handleDiscountValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setDiscountValue(numValue)
  }

  const resetDiscount = () => {
    setDiscountType('none')
    setDiscountValue(0)
  }

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Calculator className="h-4 w-4 mr-2" />
        {isExpanded ? 'Hide' : 'Show'} Discount Options
      </button>

      {/* Discount Controls */}
      {isExpanded && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Discount Adjustment</h4>
            <button
              type="button"
              onClick={resetDiscount}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          </div>

          {/* Discount Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Discount Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="none"
                  checked={discountType === 'none'}
                  onChange={(e) => handleDiscountTypeChange('none')}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">No Discount</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => handleDiscountTypeChange('percentage')}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Percentage</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={discountType === 'fixed'}
                  onChange={(e) => handleDiscountTypeChange('fixed')}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Fixed Amount</span>
              </label>
            </div>
          </div>

          {/* Discount Value Input */}
          {discountType !== 'none' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {discountType === 'percentage' ? (
                    <Percent className="h-4 w-4 text-gray-400" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => handleDiscountValueChange(e.target.value)}
                  disabled={disabled}
                  min="0"
                  max={discountType === 'percentage' ? 100 : originalAmount}
                  step={discountType === 'percentage' ? 1 : 1000}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={discountType === 'percentage' ? '25' : '50000'}
                />
                {discountType === 'percentage' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Price:</span>
              <span className="font-medium">{formatCurrency(originalAmount)}</span>
            </div>
            
            {discountType !== 'none' && discountAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                <hr className="border-gray-200" />
              </>
            )}
            
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900">Final Amount:</span>
              <span className="text-green-600">{formatCurrency(finalAmount)}</span>
            </div>
          </div>

          {/* Discount Summary */}
          {discountType !== 'none' && discountAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Calculator className="h-4 w-4 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-blue-800">Discount Applied</h5>
                  <p className="text-sm text-blue-700">
                    {discountType === 'percentage' 
                      ? `${discountValue}% off (${formatCurrency(discountAmount)})`
                      : `${formatCurrency(discountValue)} off`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
