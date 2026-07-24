import React, { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { broadcastNotification } from '../../api/adminApi';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';

const ManageNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      setError('Title and body are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await broadcastNotification(title, body);
      if (result && result.data && Array.isArray(result.data)) {
        const ticketIds = result.data.map((t: any) => t.id).filter((id : any) => id).join(', ');
        setSuccess(`Broadcast sent successfully! Tickets: ${ticketIds}`);
      } else {
        setSuccess(result.message || 'Broadcast request sent successfully, but no ticket details returned.');
      }
      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card padding={4} maxWidth="680px">
      <form onSubmit={handleSendBroadcast}>
        <VStack gap={4}>
        <Heading level={2} startIcon={<Bell size={20} />}>Broadcast notifications</Heading>
        <TextInput
          label="Notification Title"
          value={title}
          onChange={(value) => setTitle(value)}
          placeholder="e.g., New Season Arrivals!"
          isRequired
        />
        <TextArea
            label="Notification body"
            value={body}
            onChange={(value) => setBody(value)}
            placeholder="Describe the notification..."
            rows={4}
            isRequired
          />
        {error && <Banner status="error" title={error} />}
        {success && <Banner status="success" title={success} />}
        <Button type="submit" label="Send broadcast" icon={<Send size={16} />} variant="primary" isLoading={isLoading} />
        </VStack>
      </form>
    </Card>
  );
};

export default ManageNotifications;
