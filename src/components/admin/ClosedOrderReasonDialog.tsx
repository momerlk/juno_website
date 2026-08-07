import React from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';

export const CLOSED_ORDER_REASONS = ['sizing_issue', 'quality_issue', 'defective_parcel', 'incorrect_product', 'other'] as const;

export const ClosedOrderReasonDialog: React.FC<{
  isOpen: boolean;
  status: string;
  reason: string;
  isSaving?: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ isOpen, status, reason, isSaving, onReasonChange, onCancel, onConfirm }) => (
  <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onCancel()} purpose="form" width="420px">
    <Card padding={4}>
      <VStack gap={4}>
        <Heading level={2}>Set {status.replace(/_/g, ' ')} reason</Heading>
        <Selector label="Reason" value={reason} onChange={onReasonChange} isDisabled={isSaving} options={CLOSED_ORDER_REASONS.map((value) => ({ value, label: value.replace(/_/g, ' ') }))} />
        <Button label={`Set ${status.replace(/_/g, ' ')}`} onClick={onConfirm} isLoading={isSaving} width="100%" />
        <Button label="Cancel" variant="secondary" onClick={onCancel} isDisabled={isSaving} width="100%" />
      </VStack>
    </Card>
  </Dialog>
);
