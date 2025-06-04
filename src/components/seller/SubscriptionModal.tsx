import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  billingPeriod: 'monthly';
}

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: Plan, paymentDetails: PaymentDetails) => void;
  currentPlan?: Plan;
}

const plan: Plan = {
  id: 'standard',
  name: 'Standard',
  price: 4999,
  billingPeriod: 'monthly',
  features: [
    'Unlimited products',
    'Advanced analytics',
    'Priority support',
    'Multiple user accounts',
    'API access',
    'Custom integrations'
  ]
};

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  currentPlan
}) => {
  const [paymentDetails, setPaymentDetails] = React.useState<PaymentDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      await onSubscribe(plan, paymentDetails);
      onClose();
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 transition-opacity pointer-events-none"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-background text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle z-10"
            >
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <CreditCard size={24} className="text-primary mr-2" />
                    <h3 className="text-2xl font-semibold text-white">
                      {currentPlan ? 'Manage Subscription' : 'Subscribe to Juno'}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-400 hover:text-white focus:outline-none"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-background-light rounded-lg p-6 border-2 border-primary">
                    <h4 className="text-xl font-semibold text-white mb-2">{plan.name} Plan</h4>
                    <div className="flex items-baseline mb-4">
                      <span className="text-3xl font-bold text-white">Rs. {plan.price}</span>
                      <span className="text-neutral-400 ml-2">/{plan.billingPeriod}</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-neutral-400">
                          <Check size={16} className="text-primary mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-400 mb-1">Card Holder Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={paymentDetails.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background-light border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter card holder name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-neutral-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={paymentDetails.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background-light border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-neutral-400 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-background-light border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-neutral-400 mb-1">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={paymentDetails.cvv}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-background-light border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={onClose}
                    className="mr-4 px-6 py-2 text-neutral-400 hover:text-white focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubscribe}
                    disabled={isProcessing || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.name}
                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : (currentPlan ? 'Update Payment Method' : 'Subscribe Now - Rs. 4999/month')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;