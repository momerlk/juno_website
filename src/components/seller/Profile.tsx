import React, { useState, useEffect } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Seller as TSeller } from '../../constants/seller';
import { Loader, Save, Building, User, Mail, Phone, MapPin, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-background p-6 rounded-lg border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const Profile: React.FC = () => {
    const { seller } = useSellerAuth();
    const token = seller?.token || null;
    const [profile, setProfile] = useState<Partial<TSeller>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (token) {
                setIsLoading(true);
                console.log("getting response")
                const response = await api.Auth.GetProfile(token);
                if (response.ok && response.body) {
                    setProfile(response.body);
                } else {
                    setError('Failed to fetch profile.');
                }
                setIsLoading(false);
            }
        };
        console.log("fetching profile")
        fetchProfile();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length > 1) {
            setProfile(prev => ({
                ...prev,
                [keys[0]]: {
                    ...(prev as any)[keys[0]],
                    [keys[1]]: value
                }
            }));
        } else {
            setProfile(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'banner_url') => {
        const file = e.target.files?.[0];
        if (file) {
            const url = await api.uploadFileAndGetUrl(file, 'high_quality');
            setProfile(prev => ({ ...prev, [field]: url }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (token) {
            setIsSaving(true);
            const response = await api.Seller.UpdateProfile(token, profile as TSeller);
            if (response.ok) {
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile.');
            }
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-center p-8 text-white"><Loader className="animate-spin inline-block"/> Loading profile...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Section title="Business Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="business_name" className="block text-sm font-medium text-neutral-300">Business Name</label>
                            <input type="text" name="business_name" id="business_name" value={profile.business_name || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label htmlFor="legal_name" className="block text-sm font-medium text-neutral-300">Legal Name</label>
                            <input type="text" name="legal_name" id="legal_name" value={profile.legal_name || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-neutral-300">Description</label>
                        <textarea name="description" id="description" value={profile.description || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1 h-24" />
                    </div>
                </Section>

                <Section title="Brand Identity">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300">Logo</label>
                            <input type="file" id="logo-upload" onChange={e => handleImageUpload(e, 'logo_url')} className="hidden" />
                            <label htmlFor="logo-upload" className="mt-1 flex justify-center items-center w-32 h-32 rounded-full bg-background border-2 border-dashed border-neutral-600 cursor-pointer hover:border-primary">
                                {profile.logo_url ? <img src={profile.logo_url} className="w-full h-full rounded-full object-cover" /> : <Upload/>}
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300">Banner</label>
                            <input type="file" id="banner-upload" onChange={e => handleImageUpload(e, 'banner_url')} className="hidden" />
                            <label htmlFor="banner-upload" className="mt-1 flex justify-center items-center w-full h-full rounded-md bg-background border-2 border-dashed border-neutral-600 cursor-pointer hover:border-primary">
                                {profile.banner_url ? <img src={profile.banner_url} className="w-full h-full rounded-md object-cover" /> : <Upload/>}
                            </label>
                        </div>
                    </div>
                </Section>

                <Section title="Contact Information">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contact.contact_person_name" className="block text-sm font-medium text-neutral-300">Contact Person</label>
                            <input type="text" name="contact.contact_person_name" id="contact.contact_person_name" value={profile.contact?.contact_person_name || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label htmlFor="contact.email" className="block text-sm font-medium text-neutral-300">Contact Email</label>
                            <input type="email" name="contact.email" id="contact.email" value={profile.contact?.email || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label htmlFor="contact.phone_number" className="block text-sm font-medium text-neutral-300">Phone Number</label>
                            <input type="tel" name="contact.phone_number" id="contact.phone_number" value={profile.contact?.phone_number || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label htmlFor="contact.whatsapp" className="block text-sm font-medium text-neutral-300">WhatsApp Number</label>
                            <input type="tel" name="contact.whatsapp" id="contact.whatsapp" value={profile.contact?.whatsapp || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                    </div>
                </Section>

                <Section title="Store Location">
                    <div>
                        <label htmlFor="location.address" className="block text-sm font-medium text-neutral-300">Address</label>
                        <input type="text" name="location.address" id="location.address" value={profile.location?.address || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="location.city" className="block text-sm font-medium text-neutral-300">City</label>
                            <input type="text" name="location.city" id="location.city" value={profile.location?.city || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label htmlFor="location.state" className="block text-sm font-medium text-neutral-300">State/Province</label>
                            <input type="text" name="location.state" id="location.state" value={profile.location?.state || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label htmlFor="location.postal_code" className="block text-sm font-medium text-neutral-300">Postal Code</label>
                            <input type="text" name="location.postal_code" id="location.postal_code" value={profile.location?.postal_code || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                        </div>
                    </div>
                </Section>

                <div className="flex justify-end pt-6 border-t border-neutral-700">
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">
                        {isSaving ? <><Loader className="animate-spin mr-2"/> Saving...</> : <><Save className="mr-2"/> Save Changes</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default Profile;
