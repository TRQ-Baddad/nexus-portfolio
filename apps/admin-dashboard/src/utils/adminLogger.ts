import { supabase } from '../../../../utils/supabase';

interface LogDetails {
  [key: string]: any;
}

/**
 * Logs a significant action performed by an administrator.
 * @param action A string describing the action (e.g., 'suspend_user').
 * @param targetUserId The ID of the user being affected, if any.
 * @param details A JSON object with additional context about the action.
 */
export const logAdminAction = async (
  action: string,
  targetUserId?: string | null,
  details?: LogDetails
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      console.error("Could not log action: Admin user not found.");
      return;
    }

    const { error } = await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      admin_user_email: user.email,
      action: action,
      target_user_id: targetUserId,
      details: details || null,
    });

    if (error) {
      console.error("Failed to write to audit log:", error);
    }
  } catch (e) {
    console.error("Exception in logAdminAction:", e);
  }
};
