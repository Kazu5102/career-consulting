
// services/authService.ts
// v5.91 - 2026-05-17 - Protocol 3.0: Secured Arch 3.0 Upgrade
const DEFAULT_PASSWORD = '1qazxcv';

export const getStoredPasswords = (): string[] => {
    // 環境変数が設定されていない場合はデフォルトを使用
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    if (!envPassword) {
        return [DEFAULT_PASSWORD];
    }
    // カンマ区切りで複数のパスワードを配列として返す
    return envPassword.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
};

export const checkPassword = (password: string): boolean => {
    // 複数のパスワードのいずれかに一致するか確認
    return getStoredPasswords().includes(password);
};

export const setPassword = (newPassword: string, currentPassword: string): { success: boolean; message: string } => {
    return { success: false, message: '現在のシステム設定では、パスワードの変更はサーバー（環境変数）からのみ可能です。対象の環境変数(VITE_ADMIN_PASSWORD)にカンマ区切りで追加してください。' };
};
