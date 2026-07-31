import React, { useState, useEffect } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Seller as TSeller } from '../../constants/seller';
import { Loader, Save, Building, User, Mail, Phone, MapPin, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        <div className="mt-4 space-y-4">{children}</div>
    </section>
);

const Profile: React.FC = () => {
    const { seller } = useSellerAuth();
    const token = seller?.token || null;
    const [profile, setProfile] = useState<Partial<TSeller>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState<'logo_url' | 'banner_url' | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (token) {
                setIsLoading(true);
                const response = await api.Seller.GetProfile(token);
                if (response.ok && response.body) {
                    setProfile(response.body);
                } else {
                    setError('Failed to fetch profile.');
                }
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setHasUnsavedChanges(true);
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
            setUploadingImage(field);
            try {
                const url = await api.uploadFileAndGetUrl(file, 'high_quality');
                setProfile(prev => ({ ...prev, [field]: url }));
                setHasUnsavedChanges(true);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Failed to upload image. Please try again.");
            } finally {
                setUploadingImage(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (token) {
            setIsSaving(true);
            const response = await api.Seller.UpdateProfile(token, profile as TSeller);
            if (response.ok && response.body) {
                setProfile(response.body);
                alert('Profile updated successfully!');
                setHasUnsavedChanges(false);
            } else {
                alert('Failed to update profile.');
            }
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-6 text-sm text-neutral-400"><Loader className="animate-spin inline-block"/> Loading profile...</div>;
    if (error) return <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-neutral-100">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Section title="Business Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="business_name" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Business Name</label>
                            <input type="text" name="business_name" id="business_name" value={profile.business_name || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                        <div>
                            <label htmlFor="legal_name" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Legal Name</label>
                            <input type="text" name="legal_name" id="legal_name" value={profile.legal_name || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Description</label>
                        <textarea name="description" id="description" value={profile.description || ''} onChange={handleChange} className="mt-1 h-24 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                    </div>
                </Section>

                <Section title="Brand Identity">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Logo</label>
                            <input type="file" id="logo-upload" onChange={e => handleImageUpload(e, 'logo_url')} className="hidden" disabled={uploadingImage === 'logo_url'} />
                            <label htmlFor="logo-upload" className={`mt-1 flex justify-center items-center w-32 h-32 rounded-full border-2 border-dashed border-white/15 bg-[#080808] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 overflow-hidden relative ${uploadingImage === 'logo_url' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingImage === 'logo_url' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                                        <Loader className="animate-spin text-white mb-1" size={24} />
                                        <span className="text-xs text-white">Uploading...</span>
                                    </div>
                                ) : profile.logo_url ? (
                                    <img src={profile.logo_url} className="w-full h-full object-cover" alt="Logo" />
                                ) : (
                                    <Upload className="text-neutral-400"/>
                                )}
                            </label>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Banner</label>
                            <input type="file" id="banner-upload" onChange={e => handleImageUpload(e, 'banner_url')} className="hidden" disabled={uploadingImage === 'banner_url'} />
                            <label htmlFor="banner-upload" className={`mt-1 flex justify-center items-center w-full h-48 rounded-lg border-2 border-dashed border-white/15 bg-[#080808] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 overflow-hidden relative ${uploadingImage === 'banner_url' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingImage === 'banner_url' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                                        <Loader className="animate-spin text-white mb-1" size={24} />
                                        <span className="text-xs text-white">Uploading...</span>
                                    </div>
                                ) : profile.banner_url ? (
                                    <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
                                ) : (
                                    <Upload className="text-neutral-400"/>
                                )}
                            </label>
                        </div>
                    </div>
                </Section>

                <Section title="Contact Information">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contact.contact_person_name" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Contact Person</label>
                            <input type="text" name="contact.contact_person_name" id="contact.contact_person_name" value={profile.contact?.contact_person_name || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                        <div>
                            <label htmlFor="contact.support_email" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Support Email</label>
                            <input type="email" name="contact.support_email" id="contact.support_email" value={profile.contact?.support_email || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                        <div>
                            <label htmlFor="contact.phone_number" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Phone Number</label>
                            <input type="tel" name="contact.phone_number" id="contact.phone_number" value={profile.contact?.phone_number || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                        <div>
                            <label htmlFor="contact.whatsapp" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">WhatsApp Number</label>
                            <input type="tel" name="contact.whatsapp" id="contact.whatsapp" value={profile.contact?.whatsapp || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                    </div>
                </Section>

                <Section title="Store Location">
                    <div>
                        <label htmlFor="location.address" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Address</label>
                        <input type="text" name="location.address" id="location.address" value={profile.location?.address || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="location.city" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">City</label>
                            <input type="text" name="location.city" id="location.city" value={profile.location?.city || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                        <div>
                            <label htmlFor="location.state" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">State/Province</label>
                            <input type="text" name="location.state" id="location.state" value={profile.location?.state || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                        <div>
                            <label htmlFor="location.postal_code" className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Postal Code</label>
                            <input type="text" name="location.postal_code" id="location.postal_code" value={profile.location?.postal_code || ''} onChange={handleChange} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                        </div>
                    </div>
                </Section>

                <div className="flex flex-col items-end rounded-lg border border-white/10 bg-[#121212] p-4">
                    {hasUnsavedChanges && (
                        <div className="mb-3 rounded border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                            You have unsaved changes. Save to apply them.
                        </div>
                    )}
                    <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-40">
                        {isSaving ? <><Loader size={14} className="animate-spin"/> Saving...</> : <><Save size={14}/> Save Changes</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default Profile;
