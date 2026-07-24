import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Table, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

const ManageInvites: React.FC = () => {
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvites = async () => {
      setIsLoading(true);
      try {
        setError('Invites endpoint removed in API v2.');
      } catch (err) {
        setError('An error occurred while fetching invites.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvites();
  }, []);

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Heading level={2} startIcon={<Gift size={20} />}>All ambassador invites</Heading>
      {isLoading ? (
        <Text tone="secondary">Loading invites…</Text>
      ) : error ? (
        <Banner status="info" title={error} />
      ) : (
        <Table data={invites} idKey="code" density="balanced" hasHover columns={[
          { key: 'owner', header: 'Owner', width: proportional(2) },
          { key: 'code', header: 'Invite code', width: proportional(2) },
          { key: 'signups', header: 'Signups', width: proportional(1) },
        ]} />
      )}
      </VStack>
    </Card>
  );
};

export default ManageInvites;
