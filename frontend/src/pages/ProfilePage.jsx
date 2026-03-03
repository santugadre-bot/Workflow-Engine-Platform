import { useState, useEffect } from 'react';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineCheck, HiOutlineExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useUpdateProfile, useUpdateAvatar, useRemoveAvatar, useChangePassword } from '../api';
import AppLayout from '../components/layout/AppLayout';
import useUIStore from '../store/uiStore';

export default function ProfilePage() {
    const { user } = useAuth();
    const { addToast } = useUIStore();
    const [activeTab, setActiveTab] = useState('general');

    return (
        <AppLayout title="My Profile">
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'general'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <HiOutlineUser className="w-5 h-5" />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'security'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <HiOutlineLockClosed className="w-5 h-5" />
                            Security
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    {activeTab === 'general' && <GeneralSettings user={user} addToast={addToast} />}
                    {activeTab === 'security' && <SecuritySettings addToast={addToast} />}
                </div>
            </div>
        </AppLayout>
    );
}

function GeneralSettings({ user, addToast }) {
    const { updateUser } = useAuth();
    const [formData, setFormData] = useState({
        displayName: '',
        email: ''
    });
    const [errors, setErrors] = useState({});
    const updateProfile = useUpdateProfile();

    // Initialize form
    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const validate = () => {
        const newErrors = {};
        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        } else if (formData.displayName.length < 2) {
            newErrors.displayName = 'Display name must be at least 2 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await updateProfile.mutateAsync({ displayName: formData.displayName });
            updateUser({ displayName: formData.displayName });
            addToast('Profile updated successfully', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    return (
        <div className="space-y-8 max-w-lg">
            <div>
                <h3 className="text-lg font-medium text-slate-900">Profile Information</h3>
                <p className="mt-1 text-sm text-slate-500">Update your account's public profile and details.</p>
            </div>

            <AvatarUpload addToast={addToast} />

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="input-group">
                    <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className={`input w-full ${errors.displayName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.displayName && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                            <HiOutlineExclamationCircle className="w-4 h-4" /> {errors.displayName}
                        </p>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="input w-full bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
                    />
                    <p className="text-xs text-slate-400 mt-1">Email address cannot be changed securely at this time.</p>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="btn btn-primary min-w-[120px]"
                        disabled={updateProfile.isPending}
                    >
                        {updateProfile.isPending ? <span className="spinner w-4 h-4 border-2" /> : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function AvatarUpload({ addToast }) {
    const { user, updateUser } = useAuth();
    const updateAvatar = useUpdateAvatar();
    const removeAvatar = useRemoveAvatar();
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Determines validity of file
    const validateFile = (file) => {
        if (!file.type.startsWith('image/')) {
            addToast('Please upload an image file (JPG, PNG, WebP).', 'error');
            return false;
        }
        if (file.size > 2 * 1024 * 1024) {
            addToast('File size must be less than 2MB.', 'error');
            return false;
        }
        return true;
    };

    const handleUpload = async (file) => {
        if (!validateFile(file)) return;

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const avatarUrl = await updateAvatar.mutateAsync(formData);
            updateUser({ avatarUrl });
            addToast('Avatar updated successfully', 'success');
        } catch (error) {
            console.error('Upload failed', error);
            addToast('Failed to upload avatar. Please try again.', 'error');
            setPreviewUrl(null); // Revert on failure
        }
    };

    const handleRemove = async () => {
        if (!window.confirm('Are you sure you want to remove your avatar?')) return;

        try {
            await removeAvatar.mutateAsync();
            updateUser({ avatarUrl: null });
            setPreviewUrl(null);
            addToast('Avatar removed', 'success');
        } catch (error) {
            addToast('Failed to remove avatar', 'error');
        }
    };

    const onFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    // Drag and Drop
    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    // Derived display URL
    const displayUrl = previewUrl || user?.avatarUrl;
    // Check if it's a relative path (from our backend) or absolute (external)
    const renderSrc = displayUrl?.startsWith('/') ? `http://${window.location.hostname}:8080${displayUrl}` : displayUrl;

    return (
        <div className="flex items-start gap-6">
            <div
                className={`relative group cursor-pointer transition-all duration-200 ${isDragging ? 'scale-105 ring-4 ring-primary/20' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <input
                    type="file"
                    id="avatar-input"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={onFileChange}
                    disabled={updateAvatar.isPending || removeAvatar.isPending}
                />

                <label htmlFor="avatar-input" className="block relative">
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-200">
                        {renderSrc ? (
                            <img
                                src={renderSrc}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = ''; }} // Fallback on error
                            />
                        ) : (
                            <span className="text-slate-500 text-2xl font-bold">
                                {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                            </span>
                        )}

                        {/* Overlay */}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${updateAvatar.isPending || removeAvatar.isPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {updateAvatar.isPending || removeAvatar.isPending ? (
                                <div className="spinner w-6 h-6 border-white border-t-transparent" />
                            ) : (
                                <HiOutlineUser className="w-8 h-8 text-white opacity-80" />
                            )}
                        </div>
                    </div>
                </label>
            </div>

            <div className="flex-1">
                <div className="flex flex-col space-y-2">
                    <label htmlFor="avatar-input" className="btn btn-outline text-sm w-fit cursor-pointer">
                        Upload New Picture
                    </label>
                    {displayUrl && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="text-xs text-red-500 hover:text-red-600 hover:underline w-fit"
                            disabled={updateAvatar.isPending || removeAvatar.isPending}
                        >
                            Remove picture
                        </button>
                    )}
                    <p className="text-xs text-slate-400">
                        JPG, GIF or PNG. 80px circle. Max 2MB.<br />
                        Drag and drop supported.
                    </p>
                </div>
            </div>
        </div>
    );
}

function SecuritySettings({ addToast }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const changePassword = useChangePassword();

    const validate = () => {
        const newErrors = {};
        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }
        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }
        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await changePassword.mutateAsync({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });
            addToast('Password updated successfully', 'success');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update password', 'error');
        }
    };

    return (
        <div className="space-y-8 max-w-lg">
            <div>
                <h3 className="text-lg font-medium text-slate-900">Security & Password</h3>
                <p className="mt-1 text-sm text-slate-500">Ensure your account is secure with a strong password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="input-group">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className={`input w-full ${errors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                            <HiOutlineExclamationCircle className="w-4 h-4" /> {errors.currentPassword}
                        </p>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={`input w-full ${errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                            <HiOutlineExclamationCircle className="w-4 h-4" /> {errors.newPassword}
                        </p>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`input w-full ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                            <HiOutlineExclamationCircle className="w-4 h-4" /> {errors.confirmPassword}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="btn btn-primary min-w-[140px]"
                        disabled={changePassword.isPending}
                    >
                        {changePassword.isPending ? <span className="spinner w-4 h-4 border-2" /> : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
