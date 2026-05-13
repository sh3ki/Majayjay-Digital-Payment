import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loginAsync, logoutAsync, registerAsync, clearError, verifyOtpAsync, resendOtpAsync, setPendingVerificationUserId } from '../store/slices/authSlice';
import { LoginDto, RegisterDto } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error, pendingVerificationUserId } = useSelector((state: RootState) => state.auth);

  const login = (dto: LoginDto) => dispatch(loginAsync(dto));
  const register = (dto: RegisterDto) => dispatch(registerAsync(dto));
  const logout = () => dispatch(logoutAsync());
  const clear = () => dispatch(clearError());
  const verifyOtp = (userId: number, otp: string) => dispatch(verifyOtpAsync({ userId, otp }));
  const resendOtp = (userId: number) => dispatch(resendOtpAsync(userId));
  const clearPendingVerification = () => dispatch(setPendingVerificationUserId(null));

  const rawRole = typeof user?.role === 'string' ? user.role : (user?.role as { roleName?: string })?.roleName || '';
  const roleName = rawRole.toLowerCase();
  const isAdmin = roleName === 'admin';
  const isCashier = roleName === 'cashier';
  const isResident = roleName === 'resident';
  const isDeptViewer = roleName === 'department_viewer';

  return {
    user, isAuthenticated, isLoading, error,
    pendingVerificationUserId,
    login, register, logout, clear,
    verifyOtp, resendOtp, clearPendingVerification,
    isAdmin, isCashier, isResident, isDeptViewer,
  };
};

export default useAuth;
