'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function ConfirmDeliveryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const processConfirmation = async () => {
      const orderId = searchParams.get('orderId');
      const choice = searchParams.get('choice');

      if (!orderId || !choice) {
        setError('Invalid delivery confirmation link');
        setIsProcessing(false);
        return;
      }

      try {
        // Confirm the delivery choice and send system message
        const response = await fetch('/api/orders/unified/' + orderId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingType: choice === 'self' ? 'self' : 'empi',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to confirm delivery choice');
        }

        // Send confirmation message to chat
        const messageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            senderEmail: 'system@empi.com',
            senderName: 'System',
            senderType: 'admin',
            content: choice === 'self' 
              ? '✅ **Delivery confirmed!**\n\nYou selected: 📍 **Personal Pickup**\n\nOur team will notify you when your order is ready for pickup.'
              : '✅ **Delivery confirmed!**\n\nYou selected: 🚚 **EMPI Delivery**\n\nOur logistics team will contact you with delivery details.',
            messageType: 'system',
          }),
        });

        setSuccess(true);
        setIsProcessing(false);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard?tab=custom-orders');
        }, 2000);
      } catch (err) {
        console.error('Error confirming delivery:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsProcessing(false);
      }
    };

    processConfirmation();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming...</h1>
            <p className="text-gray-600">Please wait while we confirm your delivery choice.</p>
          </>
        ) : success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">✅ Confirmed!</h1>
            <p className="text-gray-600 mb-4">Your delivery choice has been confirmed.</p>
            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-2">❌ Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard?tab=custom-orders')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
