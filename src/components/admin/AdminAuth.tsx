import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Theme } from '@astryxdesign/core/theme';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import '@astryxdesign/core/astryx.css';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { junoAdminTheme } from './junoAdminTheme';

const AdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAdminAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Authentication failed. Please check your credentials.');
    }
  };

  return (
    <Theme theme={junoAdminTheme} mode="dark">
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card padding={5} maxWidth="440px">
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Heading level={1}>Admin sign in</Heading>
              <FormLayout>
                <TextInput label="Email" type="email" value={email} onChange={setEmail} placeholder="name@juno.com" isRequired startIcon={Mail} />
                <TextInput label="Password" type="password" value={password} onChange={setPassword} isRequired startIcon={Lock} />
              </FormLayout>
              {error && <Banner status="error" title={error} />}
              <Button type="submit" label="Sign in" variant="primary" icon={<ArrowRight size={16} />} isLoading={isLoading} width="100%" />
            </VStack>
          </form>
        </Card>
      </main>
    </Theme>
  );
};

export default AdminAuth;
